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
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from '../Products/Webinar/WebinarCard';
import { Plus, Search, Presentation, UserCircle, Bell, Instagram, X } from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import CustomTextInput from '../../../../components/CustomInput';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIMIT = 10;

const CreatorWebinar = ({embedded = false}: {embedded?: boolean}) => {
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

  const fetchData = useCallback((pageNum: number, search: string, refresh = false) => {
    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const payload: any = { page: pageNum, limit: LIMIT, my_webinars: true };
    if (search.trim()) {
      payload.search = search.trim();
    }

    dispatch(getAllWebinar(payload))
      .unwrap()
      .then(response => {
        const webinars = response?.data?.data?.webinars || [];
        const totalCount = response?.data?.data?.pagination?.total || webinars.length;

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
  }, [dispatch]);

  useEffect(() => {
    if (focus) {
      fetchData(1, searchQuery, true);
    }
  }, [focus, refreshFlag]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchData(1, text, true);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchData(1, '', true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, searchQuery, false);
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

  const renderItem = ({ item }: { item: any }) => (
    <WebinarCard
      data={item}
      setRefreshWebinar={() => setRefreshFlag(f => !f)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
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
          {searchQuery
            ? 'Try a different search term'
            : 'Create your first webinar to get started'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
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
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={wp(18)} color={colors.textMuted} />
          </TouchableOpacity>
        )}
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
                <Image source={{ uri: user.profile_image }} style={styles.avatar} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
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
        data={loading ? [] : data}
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(12),
    marginBottom: hp(4),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.25)',
    borderRadius: wp(26),
    paddingHorizontal: wp(16),
    backgroundColor: '#141414',
  },
  searchInput: {
    height: hp(42),
    width: '82%',
    backgroundColor: 'transparent',
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
});