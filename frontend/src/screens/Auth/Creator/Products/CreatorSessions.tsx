import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Clock,
  TrendingUp,
  PhoneCall,
  Plus,
  Search,
  X,
  Calendar,
} from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  getMySessions,
  getSessionStats,
  getMyExpertProfile,
  getMySessionProducts,
  deleteSessionProduct,
} from '../../../../store/SessionSlice';
import DateRangeFilterModal from './Course/components/DateRangeFilterModal';
import CustomTextInput from '../../../../components/CustomInput';
import SessionProductCard from './SessionProductCard';
import AddUserModal from '../../../../components/AddUserModal';
import Clipboard from '@react-native-clipboard/clipboard';
import { generateShareLink } from '../../../../services/AppsFlyerService';
import SessionPreview from './SessionPreview';

const CARD_BG = '#141414';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_MUTED = 'rgba(255,255,255,0.5)';

const CreatorSessions: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { stats, expertProfile, products } = useSelector(
    (state: any) => state.sessionReducer,
  );

  const [isAvailable, setIsAvailable] = useState(
    expertProfile?.is_available ?? false,
  );

  const [productFilter, setProductFilter] = useState<
    'All' | 'Active' | 'Draft'
  >('All');

  // Filter & Search states
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserProduct, setAddUserProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });

  const activeCount = products.filter((p: any) => p.is_active).length;
  const draftCount = products.filter((p: any) => !p.is_active).length;

  const filteredProducts = products.filter((p: any) => {
    if (productFilter === 'Active') return p.is_active;
    if (productFilter === 'Draft') return !p.is_active;
    return true; // 'All'
  });

  const filterTabs: {
    label: string;
    value: 'All' | 'Active' | 'Draft';
    count: number;
  }[] = [
    { label: 'All', value: 'All', count: products.length },
    { label: 'Active', value: 'Active', count: activeCount },
    { label: 'Draft', value: 'Draft', count: draftCount },
  ];

  const fetchData = (
    page = 1,
    query = searchQuery,
    reset = false,
    filter = statusFilter,
    dates = dateRange,
  ) => {
    dispatch(
      getMySessions({
        role: 'receiver',
        page,
        limit: 20,
        search: query,
        status: filter,
        fromDate: dates.from ? dates.from.toISOString() : undefined,
        toDate: dates.to ? dates.to.toISOString() : undefined,
      }),
    );
  };

  useEffect(() => {
    if (isFocused) {
      dispatch(getMyExpertProfile());
      dispatch(getSessionStats());
      dispatch(getMySessionProducts());
      fetchData(1);
    }
  }, [isFocused]);

  useEffect(() => {
    if (expertProfile) setIsAvailable(expertProfile.is_available);
  }, [expertProfile]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchData(1, text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchData(1, '');
  };

  const applyDateRange = (from: Date, to: Date) => {
    setDateRange({ from, to });
    setStatusFilter('Date');
    setShowDatePicker(false);
    fetchData(1, searchQuery, true, 'Date', { from, to });
  };

  const clearDateFilter = () => {
    setStatusFilter('All');
    setDateRange({ from: null, to: null });
    fetchData(1, searchQuery, true, 'All', { from: null, to: null });
  };

  const formatShortDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (product: any) => {
    Alert.alert(
      'Delete session',
      `Delete "${product.title}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteSessionProduct(product.id)).unwrap();
              Toast.show({
                type: 'success',
                text1: 'Session deleted',
                position: 'top',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Could not delete session',
                position: 'top',
              });
            }
          },
        },
      ],
    );
  };

  const handleCopyLink = async (product: any) => {
    const link = await generateShareLink({
      type: 'session',
      id: product.id,
      title: product.title || 'Session',
      description: 'Book this session!',
      imageUrl: product.thumbnail_url || '',
    });
    Clipboard.setString(link);
    Toast.show({
      type: 'success',
      text1: 'Session link copied',
      position: 'top',
    });
  };

  // If not registered as expert, show registration CTA
  if (!expertProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.regContent}>
          <View style={styles.regIcon}>
            <PhoneCall size={wp(36)} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.regTitle}>Become a Session Expert</Text>
          <Text style={styles.regSub}>
            Register to offer paid 1:1 video sessions to users. Set your rates,
            manage availability, and earn.
          </Text>
          <TouchableOpacity
            style={styles.regBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ExpertRegistration')}
          >
            <Text style={styles.regBtnText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search + Date */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={wp(18)} color={colors.gold} />
            <CustomTextInput
              inputContainerStyle={styles.searchInput}
              inputStyle={{ fontSize: fp(14), color: colors.textPrimary }}
              placeholderTextColor={colors.textMuted}
              placeholder="Search sessions..."
              onChangeText={handleSearch}
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
                  {formatShortDate(dateRange.from)} -{' '}
                  {formatShortDate(dateRange.to)}
                </Text>
                <TouchableOpacity
                  onPress={clearDateFilter}
                  hitSlop={{ top: 10, bottom: 10, left: 8, right: 10 }}
                >
                  <X size={wp(10)} color={colors.gold} />
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <PhoneCall size={wp(18)} color={colors.gold} strokeWidth={1.8} />
            <Text style={styles.statValue}>{stats?.total_sessions || 0}</Text>
            <Text style={styles.statLabel}>SESSIONS</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={wp(18)} color={colors.gold} strokeWidth={1.8} />
            <Text style={styles.statValue}>{stats?.total_minutes || 0}</Text>
            <Text style={styles.statLabel}>MINUTES</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={wp(18)} color={colors.gold} strokeWidth={1.8} />
            <Text style={styles.statValue}>
              ₹{Number(stats?.total_earnings || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>EARNED</Text>
          </View>
        </View>

        {/* Product Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {filterTabs.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.filterTab,
                productFilter === tab.value && styles.filterTabActive,
              ]}
              onPress={() => setProductFilter(tab.value)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterTabText,
                  productFilter === tab.value && styles.filterTabTextActive,
                ]}
                numberOfLines={1}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session Offerings */}
        <Text style={styles.overviewLabel}>My Sessions </Text>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyProductsText}>
              You haven't created any session offerings yet. Tap + to add one.
            </Text>
          </View>
        ) : (
          <View style={{ gap: hp(10) }}>
            {filteredProducts.map((product: any) => (
              <SessionProductCard
                key={product.id}
                product={product}
                onPreview={() => navigation.navigate('SessionPreview', { data: product })}
                onAddUser={() => {
                  setAddUserProduct(product);
                  setShowAddUser(true);
                }}
                onCopyLink={() => handleCopyLink(product)}
                onPress={() =>
                  navigation.navigate('SessionDetails', { data: product })
                }
                onEdit={() =>
                  navigation.navigate('SessionDetails', { data: product })
                }
                onDelete={() => handleDelete(product)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Date Range Modal */}
      <DateRangeFilterModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={applyDateRange}
        initialFrom={dateRange.from}
        initialTo={dateRange.to}
      />

      <AddUserModal
        visible={showAddUser}
        onClose={() => setShowAddUser(false)}
        productTitle={addUserProduct?.title || 'this session'}
        productType="session"
        onGrant={identifier =>
          dispatch(
            grantSessionAccess({
              productId: addUserProduct?.id,
              ...identifier,
            }),
          ).unwrap()
        }
      />

      <View style={styles.fabContainer}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={() => navigation.navigate('SessionDetails')}
          color={colors.bg}
        />
      </View>
    </View>
  );
};

export default memo(CreatorSessions);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(30),
  },
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: hp(16),
  },
  availLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(10) },
  availDot: { width: wp(10), height: wp(10), borderRadius: wp(5) },
  availTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  availSub: { fontSize: fp(11), color: TEXT_SECONDARY, marginTop: hp(1) },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: CARD_BG,
    borderRadius: wp(10),
    paddingVertical: hp(10),
    marginTop: hp(16),
    marginBottom: hp(20),
    borderWidth: 1.5,
    borderColor: 'rgba(240,192,64,0.4)',
    borderStyle: 'dashed',
  },
  editBtnText: { fontSize: fp(13), fontWeight: '600', color: colors.gold },
  overviewLabel: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: hp(10),
  },
  statsRow: { flexDirection: 'row', gap: wp(10), marginBottom: hp(20) },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  statValue: { fontSize: fp(16), fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: fp(9), color: TEXT_MUTED, letterSpacing: 0.3 },
  regContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(32),
  },
  regIcon: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(24),
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  regTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  regSub: {
    fontSize: fp(13),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: fp(20),
    marginTop: hp(8),
    marginBottom: hp(24),
  },
  regBtn: {
    backgroundColor: colors.gold,
    borderRadius: wp(14),
    paddingHorizontal: wp(32),
    paddingVertical: hp(14),
  },
  regBtnText: { fontSize: fp(15), fontWeight: '700', color: colors.bg },
  fabContainer: { position: 'absolute', right: wp(16), bottom: hp(16) },
  fab: { backgroundColor: colors.gold, borderRadius: wp(50) },

  // Search + Date
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
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
    backgroundColor: CARD_BG,
    flex: 1,
  },
  searchInput: {
    height: hp(44),
    width: '82%',
    backgroundColor: 'transparent',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    height: hp(44),
    paddingHorizontal: wp(14),
    borderRadius: wp(26),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: wp(130),
  },
  dateBtnActive: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderColor: colors.gold,
  },
  dateBtnText: {
    fontSize: fp(10),
    color: colors.gold,
    fontWeight: '600',
  },
  emptyProducts: {
    backgroundColor: CARD_BG,
    borderRadius: wp(14),
    padding: wp(20),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    marginBottom: hp(20),
  },
  emptyProductsText: {
    fontSize: fp(13),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: fp(19),
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginBottom: hp(16),
  },
  filterTab: {
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
  filterTabActive: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderColor: colors.gold,
  },
  filterTabText: {
    fontSize: fp(11.5),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterTabTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
});
