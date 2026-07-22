import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {
  BriefcaseBusiness,
  Search,
  ShieldCheck,
  X,
  Instagram,
  MessageCircle,
  UserCircle,
  Lock,
  RefreshCw,
  ChevronRight,
  ArrowLeft
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import colors from '../../../../utils/colors';
import { fp, hp, wp } from '../../../../utils/responsive';
import PaywallModal from '../../../../components/PaywallModal';
import { incrementProfileView } from '../../../../store/UserSlice';
import {
  isPremiumUser,
  shouldLockContactActions,
} from '../../../../utils/marketplaceUtils';
import { api, ApiError } from '../../../../services/ApiClient';

type AudienceRow = [string, string];
type PackageRow = [string, string];

export type Creator = {
  id: string;
  name: string;
  niche: string;
  city: string;
  bio: string;
  sebiRegistered: boolean;
  followers: string;
  er: string;       // mapped from API's engagementRate
  views: string;    // mapped from API's avgViews
  audience: AudienceRow[];
  packages: PackageRow[];
};

type ApiCreator = {
  id: string;
  name: string;
  niche: string;
  city: string;
  bio: string;
  sebiRegistered: boolean;
  followers: string;
  engagementRate: string;
  avgViews: string;
  audience?: { label: string; value: string }[];
  packages?: { label: string; value: string }[];
};

const NICHES: string[] = ['Finance', 'AI', 'Beauty', 'Fitness', 'SaaS'];

function mapApiCreator(c: ApiCreator): Creator {
  return {
    id: c.id,
    name: c.name,
    niche: c.niche,
    city: c.city,
    bio: c.bio,
    sebiRegistered: c.sebiRegistered,
    followers: c.followers,
    er: c.engagementRate,
    views: c.avgViews,
    audience: (c.audience ?? []).map(r => [r.label, r.value] as AudienceRow),
    packages: (c.packages ?? []).map(r => [r.label, r.value] as PackageRow),
  };
}

type NativeTableProps = { title: string; rows: AudienceRow[] | PackageRow[] };

const NativeTable: React.FC<NativeTableProps> = ({ title, rows }) => (
  <View style={s.tableBlock}>
    <Text style={s.tableTitle}>{title}</Text>
    {rows.length === 0 ? (
      <Text style={s.tableEmpty}>No data added yet.</Text>
    ) : (
      rows.map(row => (
        <View key={row[0]} style={s.tableRow}>
          <Text style={s.tableLabel}>{row[0]}</Text>
          <Text style={s.tableValue}>{row[1]}</Text>
        </View>
      ))
    )}
  </View>
);


type CreatorCardProps = {
  creator: Creator;
  user: any;
  contactLoading: boolean;
  onInspect: (creator: Creator) => void;
  onShowPaywall: () => void;
  onOpenWhatsApp: (creator: Creator) => void;
  onOpenInstagram: (creator: Creator) => void;
};

const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  user,
  contactLoading,
  onInspect,
  onShowPaywall,
  onOpenWhatsApp,
  onOpenInstagram,
}) => {
  const contactsLocked = shouldLockContactActions(creator.followers, user);

  return (
    <TouchableOpacity
      style={s.creatorCard}
      onPress={() => onInspect(creator)}
      activeOpacity={0.9}
    >
      <View style={s.creatorHeader}>
        <Text style={s.creatorName}>{creator.name}</Text>
        {creator.sebiRegistered && (
          <View style={s.sebiBadge}>
            <ShieldCheck size={wp(12)} color="#16A34A" />
            <Text style={s.sebiText}>SEBI Registered</Text>
          </View>
        )}
      </View>

      <Text style={s.creatorNiche}>
        {creator.niche} • {creator.city}
      </Text>

      <Text style={s.creatorBio} numberOfLines={2}>
        {creator.bio}
      </Text>

      <View style={s.metricsRow}>
        <View style={s.cardMetric}>
          <Text style={s.cardMetricVal}>{creator.followers}</Text>
          <Text style={s.cardMetricLabel}>Followers</Text>
        </View>
        <View style={s.cardMetric}>
          <Text style={s.cardMetricVal}>{creator.er}</Text>
          <Text style={s.cardMetricLabel}>Engagement</Text>
        </View>
        <View style={s.cardMetric}>
          <Text style={s.cardMetricVal}>{creator.views}</Text>
          <Text style={s.cardMetricLabel}>Avg Views</Text>
        </View>
      </View>

      <View style={s.actionRow}>
        <TouchableOpacity
          style={[s.actionBtn, contactsLocked ? s.actionBtnLocked : s.waBtn]}
          onPress={() => contactsLocked ? onShowPaywall() : onOpenWhatsApp(creator)}
          disabled={contactLoading}
          activeOpacity={0.8}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color={contactsLocked ? '#71717A' : '#16A34A'} />
          ) : contactsLocked ? (
            <Lock size={16} color="#71717A" />
          ) : (
            <MessageCircle size={16} color="#16A34A" />
          )}
          <Text style={contactsLocked ? s.actionBtnLockedText : s.waBtnText}>
            WhatsApp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, contactsLocked ? s.actionBtnLocked : s.igBtn]}
          onPress={() => contactsLocked ? onShowPaywall() : onOpenInstagram(creator)}
          disabled={contactLoading}
          activeOpacity={0.8}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color={contactsLocked ? '#71717A' : '#DB2777'} />
          ) : contactsLocked ? (
            <Lock size={16} color="#71717A" />
          ) : (
            <Instagram size={16} color="#DB2777" />
          )}
          <Text style={contactsLocked ? s.actionBtnLockedText : s.igBtnText}>
            Instagram
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

/* ── Inspector Drawer ── */

type InspectorDrawerProps = {
  creator: Creator | null;
  loading: boolean;
  onClose: () => void;
};

const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ creator, loading, onClose }) => (
  <Modal
    visible={!!creator || loading}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={s.modalScrim}>
      <TouchableOpacity style={s.scrimTouch} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={s.drawer}>
        <View style={s.drawerHandle} />

        {loading || !creator ? (
          <View style={s.drawerLoader}>
            <ActivityIndicator size="large" color={colors.secPrimary} />
            <Text style={s.drawerLoaderText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            <View style={s.drawerHeader}>
              <View>
                <Text style={s.drawerTitle}>{creator.name}</Text>
                <Text style={s.drawerSub}>Audience and commercial rate map</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <X size={18} color="#475467" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.drawerMetricsRow}>
                <View style={s.drawerMetricBox}>
                  <Text style={s.drawerMetricVal}>{creator.followers}</Text>
                  <Text style={s.drawerMetricLabel}>Followers</Text>
                </View>
                <View style={s.drawerMetricBox}>
                  <Text style={s.drawerMetricVal}>{creator.er}</Text>
                  <Text style={s.drawerMetricLabel}>ER</Text>
                </View>
                <View style={s.drawerMetricBox}>
                  <Text style={s.drawerMetricVal}>{creator.views}</Text>
                  <Text style={s.drawerMetricLabel}>Avg Views</Text>
                </View>
              </View>

              <NativeTable title="Target Audience Demographics" rows={creator.audience} />
              <NativeTable title="Commercial Rate Packages" rows={creator.packages} />
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </View>
  </Modal>
);


export default function BrandMarketplace() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const { user } = useSelector((state: any) => state.userReducer);
  const isPremium = isPremiumUser(user);

  /* ── Filter state ── */
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeNiche, setActiveNiche] = useState('Finance');
  const [sebiOnly, setSebiOnly] = useState(false);

  /* ── Data state ── */
  const [creators, setCreators] = useState<Creator[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);

  /* ── Drawer state ── */
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  /* ── Contact state ── */
  const [contactLoadingId, setContactLoadingId] = useState<string | null>(null);

  /* ── Paywall ── */
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [viewedCreatorIds, setViewedCreatorIds] = useState<Set<string>>(new Set());

  /* ── Debounce query ── */
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  useEffect(() => {
    fetchCreators();
  }, [activeNiche, sebiOnly, debouncedQuery]);

  const fetchCreators = async () => {
    setListLoading(true);
    setListError(false);
    try {
      const params = new URLSearchParams({ niche: activeNiche });
      if (sebiOnly) params.set('sebiOnly', 'true');
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());

      const data = await api.get<ApiCreator[]>(
        `/api/marketplace/creators?${params.toString()}`,
      );
      setCreators((data ?? []).map(mapApiCreator));
    } catch {
      setListError(true);
      setCreators([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleInspect = useCallback(
    async (creator: Creator) => {
      setDrawerLoading(true);
      setSelectedCreator(null);

      try {
        // 1. Track the view and check paywall limit
        const viewData = await api.post<{
          alreadyViewed: boolean;
          totalViews: number;
          limitReached: boolean;
        }>(`/api/marketplace/creators/${creator.id}/view`, {});

        if (viewData.limitReached && !viewData.alreadyViewed) {
          setDrawerLoading(false);
          setPaywallVisible(true);
          return;
        }

        // Update local optimistic state
        if (!viewData.alreadyViewed) {
          dispatch(incrementProfileView());
          setViewedCreatorIds(prev => new Set(prev).add(creator.id));
        }

        // 2. Fetch full profile (includes audience + packages)
        const full = await api.get<ApiCreator>(`/api/marketplace/creators/${creator.id}`);
        setSelectedCreator(mapApiCreator(full));
      } catch {
        // Fallback to card data if detail fetch fails
        setSelectedCreator(creator);
      } finally {
        setDrawerLoading(false);
      }
    },
    [dispatch],
  );


  const openWhatsApp = useCallback(async (creator: Creator) => {
    setContactLoadingId(creator.id);
    try {
      const data = await api.get<{ phone: string; instagram: string }>(
        `/api/marketplace/creators/${creator.id}/contact`,
      );
      const message = encodeURIComponent(
        `Hi ${creator.name}, we found your Rigi profile and would love to discuss a campaign.`,
      );
      const nativeUrl = `whatsapp://send?phone=${data.phone}&text=${message}`;
      const webUrl = `https://wa.me/${data.phone}?text=${message}`;
      const { Linking } = require('react-native');
      const supported = await Linking.canOpenURL(nativeUrl);
      Linking.openURL(supported ? nativeUrl : webUrl);
    } catch (e: any) {
      const err = e as ApiError;
      if (err.status === 403) setPaywallVisible(true);
    } finally {
      setContactLoadingId(null);
    }
  }, []);

  const openInstagram = useCallback(async (creator: Creator) => {
    setContactLoadingId(creator.id);
    try {
      const data = await api.get<{ phone: string; instagram: string }>(
        `/api/marketplace/creators/${creator.id}/contact`,
      );
      const { Linking } = require('react-native');
      const nativeUrl = `instagram://user?username=${data.instagram}`;
      const webUrl = `https://www.instagram.com/${data.instagram}`;
      const supported = await Linking.canOpenURL(nativeUrl);
      Linking.openURL(supported ? nativeUrl : webUrl);
    } catch (e: any) {
      const err = e as ApiError;
      if (err.status === 403) setPaywallVisible(true);
    } finally {
      setContactLoadingId(null);
    }
  }, []);


  const handleShowPaywall = useCallback(() => setPaywallVisible(true), []);
  const handleClosePaywall = useCallback(() => setPaywallVisible(false), []);
  const handleUpgrade = useCallback(() => {
    setPaywallVisible(false);
    navigation.navigate('UserSetting');
  }, [navigation]);

  const ListHeader = (
    <View>
      {/* Search */}
      <View style={s.searchContainer}>
        <Search size={18} color="#64748B" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, niche or city…"
          placeholderTextColor="#94A3B8"
          style={s.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Niche Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.nicheScroll}
        contentContainerStyle={s.nicheContent}
      >
        {NICHES.map(n => {
          const isActive = activeNiche === n;
          return (
            <TouchableOpacity
              key={n}
              style={[s.nicheTab, isActive && s.nicheTabActive]}
              onPress={() => setActiveNiche(n)}
              activeOpacity={0.8}
            >
              <Text style={[s.nicheTabText, isActive && s.nicheTabTextActive]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SEBI Switch */}
      <View style={s.switchRow}>
        <Text style={s.switchTitle}>SEBI Registered Creators Only</Text>
        <Switch
          value={sebiOnly}
          onValueChange={setSebiOnly}
          trackColor={{ false: '#CBD5E1', true: colors.secPrimary + '50' }}
          thumbColor={sebiOnly ? colors.secPrimary : '#F1F5F9'}
        />
      </View>
    </View>
  );

  const EmptyComponent = listLoading ? (
    <View style={s.centerState}>
      <ActivityIndicator size="large" color={colors.secPrimary} />
      <Text style={s.centerStateText}>Finding creators…</Text>
    </View>
  ) : listError ? (
    <View style={s.centerState}>
      <RefreshCw size={40} color="#94A3B8" />
      <Text style={s.emptyTextTitle}>Could not load creators</Text>
      <Text style={s.emptyTextSub}>Check your connection and try again.</Text>
      <TouchableOpacity style={s.retryBtn} onPress={fetchCreators} activeOpacity={0.8}>
        <Text style={s.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={s.centerState}>
      <BriefcaseBusiness size={40} color="#94A3B8" />
      <Text style={s.emptyTextTitle}>No Creators Found</Text>
      <Text style={s.emptyTextSub}>
        {debouncedQuery
          ? `No results for "${debouncedQuery}" in ${activeNiche}.`
          : `No ${activeNiche} creators are listed yet.`}
      </Text>
    </View>
  );

 return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.uBottom} />

      {/* Header */}
      <View style={[s.headerWrapper, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ChevronRight size={wp(20)} color={colors.white} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Market Place</Text>
          <View style={s.headerSpacer} />
        </View>
      </View>

      <FlatList
        data={creators}
        keyExtractor={item => item.id}
        contentContainerStyle={s.feedContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <CreatorCard
            creator={item}
            user={user}
            contactLoading={contactLoadingId === item.id}
            onInspect={handleInspect}
            onShowPaywall={handleShowPaywall}
            onOpenWhatsApp={openWhatsApp}
            onOpenInstagram={openInstagram}
          />
        )}
        ListEmptyComponent={EmptyComponent}
      />

      <InspectorDrawer
        creator={selectedCreator}
        loading={drawerLoading}
        onClose={() => { setSelectedCreator(null); setDrawerLoading(false); }}
      />

      <PaywallModal
        visible={paywallVisible}
        onClose={handleClosePaywall}
        onUpgrade={handleUpgrade}
      />
    </View>
  );
}


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.uBg },
  feedContent: { paddingBottom: hp(100) },

  /* Header */
  headerWrapper: {
    backgroundColor: colors.uBg,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: wp(16), paddingVertical: hp(14),
  },
  backBtn: {
    width: wp(36), height: wp(36),
    justifyContent: 'center', alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: fp(17), fontWeight: '700', color: colors.white,
  },
  headerSpacer: { width: wp(36) },

  /* Search */
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.uCard,
    borderRadius: wp(14), marginTop: hp(4), marginHorizontal: wp(16),
    paddingHorizontal: wp(14), height: hp(48), gap: wp(8),
  },
  searchInput: { flex: 1, height: hp(48), color: colors.white, fontSize: fp(13.5) },

  /* Niche Tabs */
  nicheScroll: { marginVertical: hp(12), paddingLeft: wp(16) },
  nicheContent: { paddingRight: wp(32), gap: wp(8) },
  nicheTab: {
    paddingHorizontal: wp(16), paddingVertical: hp(8),
    borderRadius: wp(20), backgroundColor: colors.uCard,
    borderWidth: 0,
  },
  nicheTabActive: { backgroundColor: colors.btnGradientStart },
  nicheTabText: { fontSize: fp(12.5), color: colors.uSubHeading, fontWeight: '600' },
  nicheTabTextActive: { color: colors.white, fontWeight: '700' },

  /* SEBI Switch */
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.uCard, marginHorizontal: wp(16), marginBottom: hp(12),
    paddingHorizontal: wp(16), paddingVertical: hp(12), borderRadius: wp(14),
    borderWidth: 0,
  },
  switchTitle: { fontSize: fp(13), color: colors.white, fontWeight: '700' },

  /* Creator Card */
  creatorCard: {
    backgroundColor: colors.uCard, borderRadius: wp(16), padding: wp(16),
    marginHorizontal: wp(16), marginBottom: hp(12),
    borderWidth: 0,
  },
  creatorHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: hp(6),
  },
  creatorName: { fontSize: fp(15), fontWeight: '800', color: colors.white },
  sebiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: wp(4),
    backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: wp(8),
    paddingVertical: hp(3), borderRadius: wp(6),
  },
  sebiText: { color: '#4ADE80', fontSize: fp(9.5), fontWeight: '800' },
  creatorNiche: { color: colors.btnGradientStart, fontSize: fp(11), fontWeight: '700', marginBottom: hp(6) },
  creatorBio: { color: colors.uSubHeading, fontSize: fp(12.5), lineHeight: fp(17), marginBottom: hp(12) },
  metricsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.uSubtext, borderRadius: wp(10), padding: wp(10),
    marginBottom: hp(12), borderWidth: 0,
  },
  cardMetric: { alignItems: 'center', flex: 1 },
  cardMetricVal: { fontSize: fp(13), fontWeight: '800', color: colors.white },
  cardMetricLabel: { fontSize: fp(9.5), color: colors.uSubHeading, marginTop: hp(2), fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: wp(8) },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(6), paddingVertical: hp(10), borderRadius: wp(24),
  },
  waBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#22C55E' },
  waBtnText: { color: '#22C55E', fontSize: fp(12), fontWeight: '700' },
  igBtn: { backgroundColor: '#DB2777' },
  igBtnText: { color: colors.white, fontSize: fp(12), fontWeight: '700' },
  actionBtnLocked: { backgroundColor: colors.uSubtext },
  actionBtnLockedText: { color: colors.uSubHeading, fontSize: fp(12), fontWeight: '700' },

  /* Modal / Drawer */
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  scrimTouch: { flex: 1 },
  drawer: {
    backgroundColor: colors.uCard, borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24),
    paddingHorizontal: wp(16), paddingTop: hp(10), paddingBottom: hp(24), maxHeight: '80%',
  },
  drawerHandle: {
    height: hp(4), width: wp(40), backgroundColor: colors.uSubtext,
    borderRadius: wp(2), alignSelf: 'center', marginBottom: hp(16),
  },
  drawerLoader: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: hp(48), gap: hp(12),
  },
  drawerLoaderText: { color: colors.uSubHeading, fontSize: fp(14), fontWeight: '500' },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: hp(16),
  },
  drawerTitle: { color: colors.white, fontSize: fp(18), fontWeight: '800' },
  drawerSub: { color: colors.uSubHeading, fontSize: fp(12), marginTop: hp(2) },
  closeBtn: {
    width: wp(32), height: wp(32), borderRadius: wp(16),
    backgroundColor: colors.uSubtext, alignItems: 'center', justifyContent: 'center',
  },
  drawerMetricsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.uSubtext, borderRadius: wp(14), padding: wp(14),
    marginBottom: hp(16), borderWidth: 0,
  },
  drawerMetricBox: { alignItems: 'center', flex: 1 },
  drawerMetricVal: { fontSize: fp(16), fontWeight: '800', color: colors.btnGradientStart },
  drawerMetricLabel: { fontSize: fp(10.5), color: colors.uSubHeading, marginTop: hp(2), fontWeight: '600' },

  /* Table */
  tableBlock: { marginBottom: hp(16) },
  tableTitle: {
    color: colors.btnGradientStart, fontWeight: '800',
    fontSize: fp(13), marginBottom: hp(8), letterSpacing: 0.3,
  },
  tableEmpty: { color: colors.uSubHeading, fontSize: fp(12), fontStyle: 'italic' },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: hp(10), borderBottomWidth: 1, borderBottomColor: colors.uSubtext,
  },
  tableLabel: { color: colors.uSubHeading, fontSize: fp(12.5) },
  tableValue: { color: colors.white, fontWeight: '700', fontSize: fp(12.5) },

  /* Empty / Error / Loading */
  centerState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: hp(56), paddingHorizontal: wp(32),
  },
  centerStateText: { color: colors.uSubHeading, fontSize: fp(14), marginTop: hp(12) },
  emptyTextTitle: { fontSize: fp(16), fontWeight: '800', color: colors.white, marginTop: hp(12) },
  emptyTextSub: { fontSize: fp(12), color: colors.uSubHeading, textAlign: 'center', marginTop: hp(4) },
  retryBtn: {
    marginTop: hp(16), paddingHorizontal: wp(24), paddingVertical: hp(10),
    backgroundColor: colors.btnGradientStart, borderRadius: wp(10),
  },
  retryBtnText: { color: colors.white, fontSize: fp(13), fontWeight: '700' },
});