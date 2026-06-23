import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Platform,
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
  Pressable,
} from 'react-native';
import {
  BriefcaseBusiness,
  ChevronDown,
  AtSign,
  Search,
  Send,
  ShieldCheck,
  X,
  Instagram,
  MessageCircle,
  UserCircle,
  Lock,
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
  getProfileViewsUsed,
  hasReachedProfileViewLimit,
  isPremiumUser,
  shouldLockContactActions,
} from '../../../../utils/marketplaceUtils';

type AudienceRow = [string, string];
type PackageRow = [string, string];

export type Creator = {
  id: string;
  name: string;
  niche: string;
  city: string;
  bio: string;
  phone: string;
  instagram: string;
  sebiRegistered: boolean;
  followers: string;
  er: string;
  views: string;
  audience: AudienceRow[];
  packages: PackageRow[];
};

type MetricProps = {
  label: string;
  value: string;
};

type NativeTableProps = {
  title: string;
  rows: AudienceRow[] | PackageRow[];
};

type InspectorDrawerProps = {
  creator: Creator | null;
  onClose: () => void;
};

type CreatorCardProps = {
  creator: Creator;
  user: any;
  onInspect: (creator: Creator) => void;
  onShowPaywall: () => void;
  onOpenWhatsApp: (creator: Creator) => void;
  onOpenInstagram: (creator: Creator) => void;
};

const NICHES: string[] = ['Finance', 'AI', 'Beauty', 'Fitness', 'SaaS'];

const CREATORS: Creator[] = [
  {
    id: 'cr-101',
    name: 'Aarav Mehta',
    niche: 'Finance',
    city: 'Mumbai',
    bio: 'Equity research educator building SEBI-safe learning funnels.',
    phone: '919876543210',
    instagram: 'aaravalpha',
    sebiRegistered: true,
    followers: '486K',
    er: '6.8%',
    views: '92K',
    audience: [
      ['Age 22-30', '58%'],
      ['Tier 1 investors', '44%'],
      ['Hindi + English', '81%'],
      ['High intent leads', '36K/mo'],
    ],
    packages: [
      ['Reel integration', '₹1,20,000'],
      ['Webinar co-host', '₹2,75,000'],
      ['Newsletter drop', '₹85,000'],
    ],
  },
  {
    id: 'cr-102',
    name: 'Rohan Sharma',
    niche: 'AI',
    city: 'Bangalore',
    bio: 'AI enthusiast showcasing workflows, automation tools, and agent setups.',
    phone: '919876543211',
    instagram: 'rohan.ai',
    sebiRegistered: false,
    followers: '150K',
    er: '8.2%',
    views: '45K',
    audience: [
      ['Age 18-25', '65%'],
      ['Developers & techies', '50%'],
      ['English', '90%'],
      ['Tool signups', '5K/mo'],
    ],
    packages: [
      ['Reel promotion', '₹45,000'],
      ['Sponsorship deal', '₹1,00,000'],
      ['LinkedIn post', '₹30,000'],
    ],
  },
  {
    id: 'cr-103',
    name: 'Anjali Sen',
    niche: 'Beauty',
    city: 'Delhi',
    bio: 'Skincare specialist reviewing clean makeup and organic beauty products.',
    phone: '919876543212',
    instagram: 'anjali.beauty',
    sebiRegistered: false,
    followers: '280K',
    er: '7.5%',
    views: '80K',
    audience: [
      ['Age 18-35 (Female)', '85%'],
      ['Skincare buyers', '60%'],
      ['Hindi + English', '75%'],
      ['Conversion rate', '4.2%'],
    ],
    packages: [
      ['Video review', '₹70,000'],
      ['Insta story package', '₹35,000'],
      ['Product placement', '₹90,000'],
    ],
  },
  {
    id: 'cr-104',
    name: 'Vikram Singh',
    niche: 'Fitness',
    city: 'Pune',
    bio: 'Personal trainer and nutritionist helping professionals get fit.',
    phone: '919876543213',
    instagram: 'vikramfit',
    sebiRegistered: false,
    followers: '320K',
    er: '5.9%',
    views: '110K',
    audience: [
      ['Age 20-40', '70%'],
      ['Gymgoers', '65%'],
      ['Hindi + English', '85%'],
      ['Active gym sub', '30%'],
    ],
    packages: [
      ['Workout reel', '₹80,000'],
      ['Supplement sponsor', '₹1,50,000'],
      ['Transformation post', '₹50,000'],
    ],
  },
  {
    id: 'cr-105',
    name: 'Simran Kaur',
    niche: 'SaaS',
    city: 'Hyderabad',
    bio: 'Product manager sharing reviews of productivity apps and startup tools.',
    phone: '919876543214',
    instagram: 'simransaashustle',
    sebiRegistered: false,
    followers: '95K',
    er: '9.1%',
    views: '30K',
    audience: [
      ['Age 22-35', '75%'],
      ['Founders & PMs', '55%'],
      ['English', '95%'],
      ['Trial activations', '1.2K/mo'],
    ],
    packages: [
      ['Product demo reel', '₹40,000'],
      ['Newsletter feature', '₹20,000'],
      ['Dedicated video', '₹85,000'],
    ],
  },
];

const NativeTable: React.FC<NativeTableProps> = ({ title, rows }) => (
  <View style={s.tableBlock}>
    <Text style={s.tableTitle}>{title}</Text>
    {rows.map((row) => (
      <View key={row[0]} style={s.tableRow}>
        <Text style={s.tableLabel}>{row[0]}</Text>
        <Text style={s.tableValue}>{row[1]}</Text>
      </View>
    ))}
  </View>
);

const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  user,
  onInspect,
  onShowPaywall,
  onOpenWhatsApp,
  onOpenInstagram,
}) => {
  const contactsLocked = shouldLockContactActions(creator.followers, user);

  const handleWhatsAppPress = () => {
    if (contactsLocked) {
      onShowPaywall();
      return;
    }

    onOpenWhatsApp(creator);
  };

  const handleInstagramPress = () => {
    if (contactsLocked) {
      onShowPaywall();
      return;
    }

    onOpenInstagram(creator);
  };

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
          style={[
            s.actionBtn,
            contactsLocked ? s.actionBtnLocked : s.waBtn,
          ]}
          onPress={handleWhatsAppPress}
          activeOpacity={0.8}
        >
          {contactsLocked ? (
            <Lock size={16} color="#71717A" />
          ) : (
            <MessageCircle size={16} color="#16A34A" />
          )}
          <Text
            style={[
              contactsLocked ? s.actionBtnLockedText : s.waBtnText,
            ]}
          >
            WhatsApp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.actionBtn,
            contactsLocked ? s.actionBtnLocked : s.igBtn,
          ]}
          onPress={handleInstagramPress}
          activeOpacity={0.8}
        >
          {contactsLocked ? (
            <Lock size={16} color="#71717A" />
          ) : (
            <Instagram size={16} color="#DB2777" />
          )}
          <Text
            style={[
              contactsLocked ? s.actionBtnLockedText : s.igBtnText,
            ]}
          >
            Instagram
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  creator,
  onClose,
}) => (
  <Modal
    visible={!!creator}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={s.modalScrim}>
      <TouchableOpacity style={s.scrimTouch} activeOpacity={1} onPress={onClose} />
      {creator && (
        <SafeAreaView style={s.drawer}>
          <View style={s.drawerHandle} />

          <View style={s.drawerHeader}>
            <View>
              <Text style={s.drawerTitle}>{creator.name}</Text>
              <Text style={s.drawerSub}>
                Audience and commercial rate map
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color="#475467" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Metrics in Drawer */}
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

            <NativeTable
              title="Target Audience Demographics"
              rows={creator.audience}
            />
            <NativeTable
              title="Commercial Rate Packages"
              rows={creator.packages}
            />
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  </Modal>
);

export default function BrandMarketplace() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const { user } = useSelector((state: any) => state.userReducer);
  const isPremium = isPremiumUser(user);

  const [query, setQuery] = useState<string>('');
  const [activeNiche, setActiveNiche] = useState<string>('Finance');
  const [sebiOnly, setSebiOnly] = useState<boolean>(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(
    null,
  );
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [viewedCreatorIds, setViewedCreatorIds] = useState<Set<string>>(
    () => new Set(),
  );

  const openWhatsApp = async (creator: Creator) => {
    const message = encodeURIComponent(
      `Hi ${creator.name}, we found your Rigi profile and would love to discuss a campaign.`,
    );

    const nativeUrl = `whatsapp://send?phone=${creator.phone}&text=${message}`;
    const webUrl = `https://wa.me/${creator.phone}?text=${message}`;

    const supported = await Linking.canOpenURL(nativeUrl);
    Linking.openURL(supported ? nativeUrl : webUrl);
  };

  const openInstagram = (creator: Creator) => {
    Linking.openURL(`instagram://user?username=${creator.instagram}`);
  };

  const handleShowPaywall = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  const handleClosePaywall = useCallback(() => {
    setPaywallVisible(false);
  }, []);

  const handleUpgrade = useCallback(() => {
    setPaywallVisible(false);
    navigation.navigate('UserSetting');
  }, [navigation]);

  const handleInspect = useCallback(
    (creator: Creator) => {
      const alreadyViewed = viewedCreatorIds.has(creator.id);
      const profileViewsUsed = getProfileViewsUsed(user);
      const limitReached =
        hasReachedProfileViewLimit(user) ||
        (!isPremium && !alreadyViewed && profileViewsUsed >= 5);

      if (limitReached && !alreadyViewed) {
        handleShowPaywall();
        return;
      }

      if (!isPremium && !alreadyViewed) {
        dispatch(incrementProfileView());
        setViewedCreatorIds(prev => new Set(prev).add(creator.id));
      }

      setSelectedCreator(creator);
    },
    [dispatch, handleShowPaywall, isPremium, user, viewedCreatorIds],
  );

  const filtered = useMemo(() => {
    return CREATORS.filter((c) => {
      const haystack =
        `${c.name} ${c.niche} ${c.city} ${c.bio}`.toLowerCase();

      return (
        haystack.includes(query.toLowerCase()) &&
        c.niche === activeNiche &&
        (!sebiOnly || c.sebiRegistered)
      );
    });
  }, [query, activeNiche, sebiOnly]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secPrimary} />

      {/* Maroon App Header */}
      <View style={[s.headerWrapper, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={s.avatar}
              />
            ) : (
              <View style={s.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={s.headerSubtitle}>Discover Brands</Text>
              <Text style={s.headerTitle}>Marketplace</Text>
            </View>
          </View>
          <View style={s.headerActions}>
            <Pressable
              style={({ pressed }) => [
                s.bellBtn,
                pressed && s.bellBtnPressed,
              ]}
              onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
              accessibilityLabel="Instagram"
            >
              <Instagram size={wp(18)} color={colors.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.feedContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Search Box */}
            <View style={s.searchContainer}>
              <Search size={18} color="#64748B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search creator by name or city..."
                placeholderTextColor="#94A3B8"
                style={s.searchInput}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* Niche Tabs / Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.nicheScroll}
              contentContainerStyle={s.nicheContent}
            >
              {NICHES.map((niche) => {
                const isActive = activeNiche === niche;
                return (
                  <TouchableOpacity
                    key={niche}
                    style={[s.nicheTab, isActive && s.nicheTabActive]}
                    onPress={() => setActiveNiche(niche)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.nicheTabText, isActive && s.nicheTabTextActive]}>
                      {niche}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* SEBI Only Switch */}
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
        }
        renderItem={({ item }) => (
          <CreatorCard
            creator={item}
            user={user}
            onInspect={handleInspect}
            onShowPaywall={handleShowPaywall}
            onOpenWhatsApp={openWhatsApp}
            onOpenInstagram={openInstagram}
          />
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <BriefcaseBusiness size={40} color="#94A3B8" />
            <Text style={s.emptyTextTitle}>No Creators Found</Text>
            <Text style={s.emptyTextSub}>Try searching for a different creator name or niche.</Text>
          </View>
        }
      />

      <InspectorDrawer
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
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
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  feedContent: {
    paddingBottom: hp(100),
  },

  // Curved Header Styles matching User settings/UserHome
  headerWrapper: {
    backgroundColor: colors.secPrimary,
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    flex: 1,
  },
  avatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
    lineHeight: fp(22),
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(10),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bellBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ scale: 0.93 }],
  },

  // Search Box
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    marginTop: hp(16),
    marginHorizontal: wp(16),
    paddingHorizontal: wp(14),
    height: hp(48),
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: wp(8),
  },
  searchInput: {
    flex: 1,
    height: hp(48),
    color: '#0F172A',
    fontSize: fp(13.5),
  },

  // Niche Scroll
  nicheScroll: {
    marginVertical: hp(12),
    paddingLeft: wp(16),
  },
  nicheContent: {
    paddingRight: wp(32),
    gap: wp(8),
  },
  nicheTab: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nicheTabActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  nicheTabText: {
    fontSize: fp(12.5),
    color: '#64748B',
    fontWeight: '600',
  },
  nicheTabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  // SEBI Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    marginBottom: hp(12),
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTitle: {
    fontSize: fp(13),
    color: '#334155',
    fontWeight: '700',
  },

  // Creator Card
  creatorCard: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(16),
    marginHorizontal: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(6),
  },
  creatorName: {
    fontSize: fp(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  sebiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  sebiText: {
    color: '#16A34A',
    fontSize: fp(9.5),
    fontWeight: '800',
  },
  creatorNiche: {
    color: colors.secPrimary,
    fontSize: fp(11),
    fontWeight: '700',
    marginBottom: hp(6),
  },
  creatorBio: {
    color: '#64748B',
    fontSize: fp(12.5),
    lineHeight: fp(17),
    marginBottom: hp(12),
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(10),
    padding: wp(10),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardMetric: {
    alignItems: 'center',
    flex: 1,
  },
  cardMetricVal: {
    fontSize: fp(13),
    fontWeight: '800',
    color: '#0F172A',
  },
  cardMetricLabel: {
    fontSize: fp(9.5),
    color: '#64748B',
    marginTop: hp(2),
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: wp(8),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(10),
    borderRadius: wp(10),
  },
  waBtn: {
    backgroundColor: '#DCFCE7',
  },
  waBtnText: {
    color: '#16A34A',
    fontSize: fp(12),
    fontWeight: '700',
  },
  igBtn: {
    backgroundColor: '#FDF2F8',
  },
  igBtnText: {
    color: '#DB2777',
    fontSize: fp(12),
    fontWeight: '700',
  },
  actionBtnLocked: {
    backgroundColor: '#181818',
  },
  actionBtnLockedText: {
    color: '#71717A',
    fontSize: fp(12),
    fontWeight: '700',
  },

  // Modal / Drawer Bottom Sheet
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  scrimTouch: {
    flex: 1,
  },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingHorizontal: wp(16),
    paddingTop: hp(10),
    paddingBottom: hp(24),
    maxHeight: '80%',
  },
  drawerHandle: {
    height: hp(4),
    width: wp(40),
    backgroundColor: '#E2E8F0',
    borderRadius: wp(2),
    alignSelf: 'center',
    marginBottom: hp(16),
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  drawerTitle: {
    color: '#0F172A',
    fontSize: fp(18),
    fontWeight: '800',
  },
  drawerSub: {
    color: '#64748B',
    fontSize: fp(12),
    marginTop: hp(2),
  },
  closeBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerMetricBox: {
    alignItems: 'center',
    flex: 1,
  },
  drawerMetricVal: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.secPrimary,
  },
  drawerMetricLabel: {
    fontSize: fp(10.5),
    color: '#64748B',
    marginTop: hp(2),
    fontWeight: '600',
  },

  tableBlock: {
    marginBottom: hp(16),
  },
  tableTitle: {
    color: colors.secPrimary,
    fontWeight: '800',
    fontSize: fp(13),
    marginBottom: hp(8),
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableLabel: {
    color: '#475467',
    fontSize: fp(12.5),
  },
  tableValue: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: fp(12.5),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(48),
    paddingHorizontal: wp(32),
  },
  emptyTextTitle: {
    fontSize: fp(16),
    fontWeight: '800',
    color: '#334155',
    marginTop: hp(12),
  },
  emptyTextSub: {
    fontSize: fp(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(4),
  },
});