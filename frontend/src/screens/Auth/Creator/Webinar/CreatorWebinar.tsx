import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  getAllWebinar,
  getCreatorWebinarStats,
} from '../../../../store/WebinarSlice';
import WebinarCard from '../Products/Webinar/WebinarCard';

import DateRangeFilterModal from '../Products/Course/components/DateRangeFilterModal';
import {
  Plus,
  Search,
  Presentation,
  UserCircle,
  Bell,
  Instagram,
  X,
  Wallet,
  Users,
  Calendar,
} from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import CustomTextInput from '../../../../components/CustomInput';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment-timezone';

const LIMIT = 10;

type StatusFilter = 'All' | 'Completed' | 'Draft' | 'Date';
type DateRange = { from: Date | null; to: Date | null };

const formatCompactINR = (num: number) => {
  const n = Number(num) || 0;
  if (n >= 10000000)
    return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${n}`;
};

const formatCompactNumber = (num: number) => {
  const n = Number(num) || 0;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
};

const formatShortDate = (d: Date) =>
  d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

// Local-calendar YYYY-MM-DD. Do NOT use toISOString() here: it converts to UTC,
// so a local-midnight date in IST (UTC+5:30) would be sent as the previous day.
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const StatCard = ({
  icon: Icon,
  value,
  label,
  loading,
}: {
  icon: any;
  value: string;
  label: string;
  loading?: boolean;
}) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}>
      <Icon size={wp(16)} color={colors.gold} strokeWidth={2} />
    </View>
    {loading ? (
      <ActivityIndicator
        size="small"
        color={colors.gold}
        style={{ marginVertical: hp(4) }}
      />
    ) : (
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CreatorWebinar = ({ embedded = false }: { embedded?: boolean }) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const focus = useIsFocused();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<any>(null);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const { creatorWebinarStats, statsLoading } = useSelector(
    (state: any) => state.webinarReducer,
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  // `filter` and `range` are passed explicitly by every call site (rather than
  // read from state) to avoid stale-closure bugs inside this memoized callback.
  const fetchData = useCallback(
    (
      pageNum: number,
      search: string,
      refresh: boolean,
      filter: StatusFilter,
      range: DateRange,
    ) => {
      if (refresh) {
        setLoading(true);
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const payload: any = { page: pageNum, limit: LIMIT, my_webinars: true };
      if (search.trim()) {
        payload.search = search.trim();
      }

      if (filter === 'Date' && range.from && range.to) {
        payload.from_date = toYMD(range.from);
        payload.to_date = toYMD(range.to);
      }

      dispatch(getAllWebinar(payload))
        .unwrap()
        .then(response => {
          const webinars = response?.data?.data?.webinars || [];
          const totalCount =
            response?.data?.data?.pagination?.total || webinars.length;

          if (refresh) {
            setData(webinars);
          } else {
            setData(prev => [...prev, ...webinars]);
          }

          setTotal(totalCount);
          setHasMore(webinars.length >= LIMIT);
          setPage(pageNum);
        })
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [dispatch],
  );

  useEffect(() => {
    if (focus) {
      fetchData(1, searchQuery, true, statusFilter, dateRange);
      dispatch(getCreatorWebinarStats());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, refreshFlag]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchData(1, text, true, statusFilter, dateRange);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchData(1, '', true, statusFilter, dateRange);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, searchQuery, false, statusFilter, dateRange);
    }
  };

  const handleCreateWebinar = () => {
    if (user?.kyc_verified) {
      navigation.navigate('CreateWebinar');
    } else {
      Toast.show({
        type: 'error',
        text1: 'KYC Required',
        text2: 'Please complete your KYC first',
        position: 'top',
      });
    }
  };

  // All/Completed/Draft filter client-side. If we're moving AWAY from 'Date',
  // refetch without date params, since `data` holds a date-restricted set.
  const handleStatusPillPress = (key: StatusFilter) => {
    if (key === 'Date') {
      setShowDatePicker(true);
      return;
    }
    const wasDateFilter = statusFilter === 'Date';
    setStatusFilter(key);
    if (wasDateFilter) {
      setDateRange({ from: null, to: null });
      fetchData(1, searchQuery, true, key, { from: null, to: null });
    }
  };

  const applyDateRange = (from: Date, to: Date) => {
    setDateRange({ from, to });
    setStatusFilter('Date');
    setShowDatePicker(false);
    fetchData(1, searchQuery, true, 'Date', { from, to });
  };

  // Clears the date filter directly from the inline date button (the X
  // shown once a range is active), independent of the status pills.
  const clearDateFilter = () => {
    setStatusFilter('All');
    setDateRange({ from: null, to: null });
    fetchData(1, searchQuery, true, 'All', { from: null, to: null });
  };

  const renderItem = ({ item }: { item: any }) => (
    <WebinarCard
      data={item}
      setRefreshWebinar={() => setRefreshFlag(f => !f)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore || loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Presentation size={wp(48)} color={colors.gold} />
        </View>
        <Text style={styles.emptyTitle}>No Webinars Found</Text>
        <Text style={styles.emptySubtitle}>
          {statusFilter === 'Date'
            ? 'No webinars in this date range'
            : searchQuery
            ? 'Try a different search term'
            : 'Create your first webinar to get started'}
        </Text>
      </View>
    );
  };

  const getWebinarBucket = (w: any) => {
    if ((w.status || '').toUpperCase() === 'DRAFT') return 'Draft';
    const isFuture = w.scheduled_at
      ? moment(w.scheduled_at).isAfter(moment())
      : false;
    return isFuture ? 'Upcoming' : 'Completed';
  };

  const completedCount = data.filter(
    w => getWebinarBucket(w) === 'Completed',
  ).length;
  const draftCount = data.filter(w => getWebinarBucket(w) === 'Draft').length;

  const filteredData =
    statusFilter === 'Date'
      ? data
      : data.filter(w => {
          if (statusFilter === 'All') return true;
          return getWebinarBucket(w) === statusFilter;
        });

  const renderHeader = () => (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={wp(18)} color={colors.gold} />
          <CustomTextInput
            inputContainerStyle={styles.searchInput}
            inputStyle={{ fontSize: fp(14), color: colors.textPrimary }}
            placeholderTextColor={colors.textMuted}
            placeholder="Search webinars..."
            onChange={handleSearch as any}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={wp(18)} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.dateBtn,
            statusFilter === 'Date' && styles.dateBtnActive,
          ]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Calendar
            size={wp(13)}
            color={statusFilter === 'Date' ? colors.gold : colors.textMuted}
          />
          {statusFilter === 'Date' && dateRange.from && dateRange.to && (
            <>
              <Text style={styles.dateBtnText} numberOfLines={2}>
                {formatShortDate(dateRange.from)} - {formatShortDate(dateRange.to)}
              </Text>
              <TouchableOpacity
                onPress={clearDateFilter}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 10 }}
              >
                <X size={wp(12)} color={colors.gold} />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon={Presentation}
          value={`${creatorWebinarStats?.statistics?.total_webinars ?? 0}`}
          label="Webinars"
          loading={statsLoading}
        />
        <StatCard
          icon={Wallet}
          value={formatCompactINR(
            creatorWebinarStats?.statistics?.revenue ?? 0,
          )}
          label="Revenue"
          loading={statsLoading}
        />
        <StatCard
          icon={Users}
          value={formatCompactNumber(
            creatorWebinarStats?.statistics?.total_enrollments ?? 0,
          )}
          label="Users"
          loading={statsLoading}
        />
      </View>

      {/* Status Filter Pills */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'All', label: `All (${data.length})` },
            { key: 'Completed', label: `Completed (${completedCount})` },
            { key: 'Draft', label: `Draft (${draftCount})` },
          ] as { key: StatusFilter; label: string }[]
        ).map(f => {
          const isActive = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => handleStatusPillPress(f.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>My Webinars</Text>
        <Text style={styles.webinarCount}>{total} webinars</Text>
      </View>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {!embedded && (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profile_image ? (
                <Image
                  source={{ uri: user.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCircle size={wp(28)} color={colors.textPrimary} />
                </View>
              )}
              <View>
                <Text style={styles.headerSubtitle}>My Webinars</Text>
                <Text style={styles.headerTitle}>
                  {total} webinar{total !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
            >
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() =>
                  Linking.openURL('https://www.instagram.com/manchly_app')
                }
              >
                <Instagram size={wp(20)} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('CreatorNotification')}
              >
                <Bell size={wp(20)} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={loading ? [] : filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.fabContainer}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={handleCreateWebinar}
          color={colors.bg}
        />
      </View>

      <DateRangeFilterModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={applyDateRange}
        onClear={clearDateFilter}
        initialRange={dateRange}
      />
    </View>
  );
};

export default CreatorWebinar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: wp(16),
    paddingBottom: hp(80),
  },

  // Header
  headerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: hp(1),
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Search + Date
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginTop: hp(12),
    marginBottom: hp(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.25)',
    borderRadius: wp(26),
    paddingHorizontal: wp(16),
    backgroundColor: '#141414',
    flex: 1,
  },
  searchInput: {
    height: hp(42),
    width: '82%',
    backgroundColor: 'transparent',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    height: hp(42),
    paddingHorizontal: wp(14),
    borderRadius: wp(26),
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: wp(120),
  },
  dateBtnActive: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderColor: colors.gold,
  },
  dateBtnText: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '600',
  },

  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(4),
  },
  listTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  webinarCount: {
    fontSize: fp(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Loaders
  loaderContainer: {
    height: hp(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(16),
    gap: wp(8),
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fp(13),
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
    paddingHorizontal: wp(40),
  },
  emptyIcon: {
    backgroundColor: colors.surface,
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  emptyTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(19),
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    right: wp(16),
    bottom: hp(16),
  },
  fab: {
    backgroundColor: colors.gold,
    borderRadius: wp(50),
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(14),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1B1B',
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.18)',
    paddingVertical: hp(12),
    alignItems: 'center',
  },
  statIconWrap: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: 'rgba(240,192,64,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
  },
  statValue: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fp(10.5),
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: hp(2),
    letterSpacing: 0.2,
  },
  // list already has paddingHorizontal: wp(16), so no extra marginHorizontal here
  filterRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginTop: hp(14),
  },
  filterPill: {
    flex: 1,
    paddingVertical: hp(10),
    paddingHorizontal: wp(4),
    borderRadius: wp(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderColor: colors.gold,
  },
  filterPillText: {
    fontSize: fp(11.5),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterPillTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
});