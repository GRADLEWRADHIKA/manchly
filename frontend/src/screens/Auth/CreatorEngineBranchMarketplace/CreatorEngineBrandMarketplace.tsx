import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Instagram,
  Play,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  WalletCards,
  X,
} from 'lucide-react-native';
import { fp, hp, wp } from '../../../utils/responsive';

const token = {
  bg: '#050505',
  card: '#111111',
  cardHi: '#171717',
  ink: '#FFFFFF',
  muted: '#8B929E',
  soft: '#CDD2DA',
  border: '#292929',
  borderHi: '#F97316',
  orange: '#F97316',
  green: '#16A34A',
  greenText: '#DCFCE7',
  blue: '#2563EB',
  blueText: '#DBEAFE',
  terminal: '#0A0A0A',
};

const niches = ['Finance', 'AI', 'Beauty', 'Fitness', 'SaaS'];

const creators = [
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
    name: 'Nisha Rao',
    niche: 'Beauty',
    city: 'Bengaluru',
    bio: 'UGC creator with strong conversion on skincare launches.',
    phone: '919812345670',
    instagram: 'nishaglowlab',
    sebiRegistered: false,
    followers: '238K',
    er: '8.1%',
    views: '64K',
    audience: [
      ['Women 18-34', '71%'],
      ['Metro buyers', '49%'],
      ['Repeat viewers', '42%'],
      ['Story tap rate', '13.4%'],
    ],
    packages: [
      ['UGC bundle x5', '₹70,000'],
      ['Reel + stories', '₹1,10,000'],
      ['Launch live', '₹1,80,000'],
    ],
  },
  {
    id: 'cr-103',
    name: 'Kabir Sethi',
    niche: 'AI',
    city: 'Delhi NCR',
    bio: 'Operator-led AI automation demos for founders and product teams.',
    phone: '918765432109',
    instagram: 'kabirbuilds',
    sebiRegistered: true,
    followers: '312K',
    er: '7.4%',
    views: '88K',
    audience: [
      ['Founders', '31%'],
      ['Product teams', '26%'],
      ['LinkedIn overlap', '54K'],
      ['Course buyers', '9.8K'],
    ],
    packages: [
      ['Tool demo reel', '₹1,45,000'],
      ['Workshop funnel', '₹3,20,000'],
      ['Lead magnet', '₹95,000'],
    ],
  },
];

const initialLinks = {
  education: 'https://rigi.link/wealth-sprint',
  collabs: 'brand@creator.studio',
  consulting: 'https://cal.com/rigi-growth',
  ugc: 'https://rigi.link/ugc-kit',
};

type Creator = (typeof creators)[number];
type Role = 'brand' | 'creator';
type LinkKey = keyof typeof initialLinks;

const CreatorEngineBrandMarketplace = () => {
  const [role, setRole] = useState<Role>('brand');
  const [query, setQuery] = useState('');
  const [activeNiche, setActiveNiche] = useState('Finance');
  const [sebiOnly, setSebiOnly] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [links, setLinks] = useState(initialLinks);
  const [focusedField, setFocusedField] = useState<LinkKey | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [comment, setComment] = useState('Send me the webinar bonus');
  const [terminalLines, setTerminalLines] = useState([
    '$ waiting for webhook payload...',
    'Graph API sandbox connected.',
  ]);

  const filteredCreators = useMemo(
    () =>
      creators.filter(creator => {
        const haystack = `${creator.name} ${creator.niche} ${creator.city} ${creator.bio}`;
        return (
          haystack.toLowerCase().includes(query.toLowerCase()) &&
          creator.niche === activeNiche &&
          (!sebiOnly || creator.sebiRegistered)
        );
      }),
    [activeNiche, query, sebiOnly],
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

  const updateLink = (field: LinkKey, value: string) => {
    setLinks(current => ({ ...current, [field]: value }));
  };

  const runHook = () => {
    const stamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setTerminalLines([
      `$ rigi-meta hook --comment "${comment}"`,
      `[${stamp}] received instagram.comment.created`,
      '[auth] permissions ok: instagram_manage_insights, messages',
      '[match] keyword intent: webinar_bonus',
      '[dm] mock fulfillment delivered with tracked link',
      '[status] 200 OK automation complete',
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={token.bg} />
      <View style={styles.topBar}>
        <Text style={styles.accessLabel}>Access Role:</Text>
        <View style={styles.segmentShell}>
          <SegmentButton
            active={role === 'brand'}
            label="BRAND PORTAL"
            onPress={() => setRole('brand')}
          />
          <SegmentButton
            active={role === 'creator'}
            label="CREATOR CENTER"
            onPress={() => setRole('creator')}
          />
        </View>
      </View>

      {role === 'brand' ? (
        <BrandPortal
          activeNiche={activeNiche}
          creatorList={filteredCreators}
          query={query}
          sebiOnly={sebiOnly}
          setActiveNiche={setActiveNiche}
          setQuery={setQuery}
          setSebiOnly={setSebiOnly}
          onInspect={setSelectedCreator}
          onInstagram={openInstagram}
          onWhatsApp={openWhatsApp}
        />
      ) : (
        <CreatorCenter
          comment={comment}
          focusedField={focusedField}
          links={links}
          previewOpen={previewOpen}
          terminalLines={terminalLines}
          setComment={setComment}
          setFocusedField={setFocusedField}
          setPreviewOpen={setPreviewOpen}
          updateLink={updateLink}
          runHook={runHook}
        />
      )}

      <InspectorDrawer
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </SafeAreaView>
  );
};

const SegmentButton = ({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.segmentButton, active && styles.segmentButtonActive]}
  >
    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const BrandPortal = ({
  activeNiche,
  creatorList,
  query,
  sebiOnly,
  setActiveNiche,
  setQuery,
  setSebiOnly,
  onInspect,
  onInstagram,
  onWhatsApp,
}: {
  activeNiche: string;
  creatorList: Creator[];
  query: string;
  sebiOnly: boolean;
  setActiveNiche: (value: string) => void;
  setQuery: (value: string) => void;
  setSebiOnly: (value: boolean) => void;
  onInspect: (creator: Creator) => void;
  onInstagram: (creator: Creator) => void;
  onWhatsApp: (creator: Creator) => void;
}) => (
  <FlatList
    data={creatorList}
    keyExtractor={item => item.id}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.feedContent}
    ListHeaderComponent={
      <View>
        <View style={styles.heroBlock}>
          <View style={styles.heroIcon}>
            <BriefcaseBusiness size={wp(22)} color={token.ink} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>CREATOR DISCOVERY</Text>
            <Text style={styles.title}>Brand Marketplace</Text>
            <Text style={styles.subtitle}>
              Filter high-intent creators and recruit from the card itself.
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={wp(18)} color={token.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search creator, city, niche"
            placeholderTextColor={token.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nicheRow}
        >
          {niches.map(niche => (
            <TouchableOpacity
              key={niche}
              activeOpacity={0.7}
              onPress={() => setActiveNiche(niche)}
              style={[
                styles.nicheChip,
                activeNiche === niche && styles.nicheChipActive,
              ]}
            >
              <Text
                style={[
                  styles.nicheText,
                  activeNiche === niche && styles.nicheTextActive,
                ]}
              >
                {niche}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>SEBI-Registered Creators</Text>
            <Text style={styles.switchSub}>Prioritize finance compliant profiles</Text>
          </View>
          <Switch
            value={sebiOnly}
            onValueChange={setSebiOnly}
            thumbColor={Platform.OS === 'android' ? token.orange : undefined}
            trackColor={{ false: '#3A3A3A', true: '#F9731680' }}
            ios_backgroundColor="#3A3A3A"
          />
        </View>
      </View>
    }
    renderItem={({ item }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onInspect(item)}
        style={styles.creatorCard}
      >
        <View style={styles.creatorTopRow}>
          <View>
            <View style={styles.creatorNameRow}>
              <Text style={styles.creatorName}>{item.name}</Text>
              {item.sebiRegistered ? (
                <ShieldCheck size={wp(16)} color={token.orange} />
              ) : null}
            </View>
            <Text style={styles.creatorMeta}>
              {item.niche} / {item.city}
            </Text>
          </View>
          <ChevronDown size={wp(20)} color={token.muted} />
        </View>
        <Text style={styles.creatorBio}>{item.bio}</Text>
        <View style={styles.statsGrid}>
          <Metric label="Followers" value={item.followers} />
          <Metric label="ER%" value={item.er} />
          <Metric label="Avg Views" value={item.views} />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onWhatsApp(item)}
            style={[styles.actionButton, styles.whatsAppButton]}
          >
            <Send size={wp(15)} color={token.greenText} />
            <Text style={styles.whatsAppText}>WhatsApp Recruiter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onInstagram(item)}
            style={[styles.actionButton, styles.instagramButton]}
          >
            <Instagram size={wp(15)} color={token.blueText} />
            <Text style={styles.instagramText}>Instagram DM</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )}
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No creators match this filter set.</Text>
      </View>
    }
  />
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricBox}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const InspectorDrawer = ({
  creator,
  onClose,
}: {
  creator: Creator | null;
  onClose: () => void;
}) => (
  <Modal visible={!!creator} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalScrim}>
      <TouchableOpacity activeOpacity={1} style={styles.scrimTouch} onPress={onClose} />
      {creator ? (
        <SafeAreaView style={styles.drawer}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.drawerTitle}>{creator.name}</Text>
              <Text style={styles.drawerSub}>Audience and commercial rate map</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <X size={wp(18)} color={token.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <NativeTable title="Target Audience Demographics" rows={creator.audience} />
            <NativeTable title="Commercial Rate Packages" rows={creator.packages} />
          </ScrollView>
        </SafeAreaView>
      ) : null}
    </View>
  </Modal>
);

const NativeTable = ({ title, rows }: { title: string; rows: string[][] }) => (
  <View style={styles.tableBlock}>
    <Text style={styles.tableTitle}>{title}</Text>
    {rows.map(([label, value]) => (
      <View key={label} style={styles.tableRow}>
        <Text style={styles.tableLabel}>{label}</Text>
        <Text style={styles.tableValue}>{value}</Text>
      </View>
    ))}
  </View>
);

const CreatorCenter = ({
  comment,
  focusedField,
  links,
  previewOpen,
  terminalLines,
  setComment,
  setFocusedField,
  setPreviewOpen,
  updateLink,
  runHook,
}: {
  comment: string;
  focusedField: LinkKey | null;
  links: typeof initialLinks;
  previewOpen: boolean;
  terminalLines: string[];
  setComment: (value: string) => void;
  setFocusedField: (value: LinkKey | null) => void;
  setPreviewOpen: (value: boolean) => void;
  updateLink: (field: LinkKey, value: string) => void;
  runHook: () => void;
}) => (
  <ScrollView
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.creatorContent}
  >
    <View style={styles.heroBlock}>
      <View style={[styles.heroIcon, styles.orangeIcon]}>
        <Sparkles size={wp(22)} color={token.ink} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.kicker}>MONETIZATION ENGINE</Text>
        <Text style={styles.title}>Creator Center</Text>
        <Text style={styles.subtitle}>
          Configure offers, preview your micro-site, and test Meta automations.
        </Text>
      </View>
    </View>

    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <WalletCards size={wp(19)} color={token.orange} />
        <Text style={styles.sectionTitle}>Link-In-Bio Digital Forge</Text>
      </View>
      {(
        [
          ['education', 'Education'],
          ['collabs', 'Brand Collabs'],
          ['consulting', 'Consulting'],
          ['ugc', 'UGC'],
        ] as [LinkKey, string][]
      ).map(([field, label]) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{label}</Text>
          <TextInput
            value={links[field]}
            onChangeText={value => updateLink(field, value)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            placeholderTextColor={token.muted}
            style={[
              styles.formInput,
              focusedField === field && styles.formInputFocused,
            ]}
          />
        </View>
      ))}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setPreviewOpen(!previewOpen)}
        style={styles.previewToggle}
      >
        <ExternalLink size={wp(16)} color={token.ink} />
        <Text style={styles.previewToggleText}>
          {previewOpen ? 'Hide Live Preview' : 'Open Live Mock Preview'}
        </Text>
      </TouchableOpacity>
      {previewOpen ? <MockProfile links={links} /> : null}
    </View>

    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <BadgeCheck size={wp(19)} color={token.blue} />
        <Text style={styles.sectionTitle}>Meta Instagram Graph Automation</Text>
      </View>
      {['instagram_manage_insights', 'messages'].map(permission => (
        <View key={permission} style={styles.permissionRow}>
          <CheckCircle2 size={wp(18)} color={token.green} />
          <Text style={styles.permissionText}>{permission}</Text>
          <Text style={styles.permissionBadge}>ACTIVE</Text>
        </View>
      ))}
      <View style={styles.terminalBlock}>
        <View style={styles.terminalTop}>
          <Terminal size={wp(16)} color={token.greenText} />
          <Text style={styles.terminalTitle}>Webhook Testing Shell</Text>
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Mock user comment"
          placeholderTextColor={token.muted}
          style={styles.commentInput}
        />
        <TouchableOpacity activeOpacity={0.7} onPress={runHook} style={styles.runButton}>
          <Play size={wp(15)} color={token.ink} />
          <Text style={styles.runButtonText}>Run Hook Emulation</Text>
        </TouchableOpacity>
        <View style={styles.logs}>
          {terminalLines.map(line => (
            <Text key={line} style={styles.logLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </View>
  </ScrollView>
);

const MockProfile = ({ links }: { links: typeof initialLinks }) => (
  <View style={styles.mockProfile}>
    <View style={styles.mockAvatar}>
      <Text style={styles.mockAvatarText}>RC</Text>
    </View>
    <Text style={styles.mockName}>Rigi Creator Studio</Text>
    <Text style={styles.mockSub}>Courses, consults, collabs, and UGC menu</Text>
    {[
      ['Monetized Course', links.education],
      ['Webinar + Brand Collab', links.collabs],
      ['Consulting Calendar', links.consulting],
      ['UGC Rate Card', links.ugc],
    ].map(([label, value]) => (
      <TouchableOpacity key={label} activeOpacity={0.7} style={styles.mockLink}>
        <Text style={styles.mockLinkTitle}>{label}</Text>
        <Text style={styles.mockLinkValue} numberOfLines={1}>
          {value}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default CreatorEngineBrandMarketplace;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: token.bg },
  topBar: {
    backgroundColor: token.bg,
    paddingHorizontal: wp(16),
    paddingTop: hp(10),
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: token.border,
  },
  accessLabel: {
    color: token.muted,
    fontSize: fp(11),
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: hp(8),
  },
  segmentShell: {
    flexDirection: 'row',
    backgroundColor: token.card,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: token.border,
    padding: wp(4),
  },
  segmentButton: {
    flex: 1,
    minHeight: hp(42),
    borderRadius: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: { backgroundColor: token.orange },
  segmentText: {
    color: token.muted,
    fontSize: fp(11),
    fontWeight: '900',
    letterSpacing: 0,
  },
  segmentTextActive: { color: token.ink },
  feedContent: { paddingHorizontal: wp(16), paddingBottom: hp(110) },
  creatorContent: { paddingHorizontal: wp(16), paddingBottom: hp(110) },
  heroBlock: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(18) },
  heroIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(8),
    backgroundColor: token.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  orangeIcon: { backgroundColor: token.orange },
  heroCopy: { flex: 1 },
  kicker: {
    color: token.orange,
    fontSize: fp(10),
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: { color: token.ink, fontSize: fp(24), fontWeight: '900', marginTop: hp(2) },
  subtitle: { color: token.soft, fontSize: fp(12), lineHeight: fp(17), marginTop: hp(4) },
  searchBox: {
    minHeight: hp(48),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: token.card,
    borderWidth: 1,
    borderColor: token.border,
    borderRadius: wp(8),
    paddingHorizontal: wp(12),
  },
  searchInput: {
    flex: 1,
    color: token.ink,
    fontSize: fp(14),
    marginLeft: wp(8),
    paddingVertical: 0,
  },
  nicheRow: { paddingVertical: hp(12), gap: wp(8) },
  nicheChip: {
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: token.border,
    paddingHorizontal: wp(14),
    paddingVertical: hp(9),
    backgroundColor: token.card,
  },
  nicheChipActive: { borderColor: token.orange, backgroundColor: '#2A170A' },
  nicheText: { color: token.soft, fontSize: fp(12), fontWeight: '800' },
  nicheTextActive: { color: token.orange },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.card,
    borderWidth: 1,
    borderColor: token.border,
    borderRadius: wp(8),
    padding: wp(12),
    marginBottom: hp(12),
  },
  switchCopy: { flex: 1, paddingRight: wp(10) },
  switchTitle: { color: token.ink, fontSize: fp(13), fontWeight: '800' },
  switchSub: { color: token.muted, fontSize: fp(11), marginTop: hp(3) },
  creatorCard: {
    backgroundColor: token.card,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: token.border,
    padding: wp(14),
    marginBottom: hp(12),
  },
  creatorTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  creatorNameRow: { flexDirection: 'row', alignItems: 'center', gap: wp(6) },
  creatorName: { color: token.ink, fontSize: fp(17), fontWeight: '900' },
  creatorMeta: { color: token.muted, fontSize: fp(12), marginTop: hp(3) },
  creatorBio: { color: token.soft, fontSize: fp(12), lineHeight: fp(18), marginTop: hp(10) },
  statsGrid: { flexDirection: 'row', gap: wp(8), marginTop: hp(12) },
  metricBox: {
    flex: 1,
    backgroundColor: token.bg,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: token.border,
    paddingVertical: hp(10),
    paddingHorizontal: wp(8),
  },
  metricValue: { color: token.ink, fontSize: fp(16), fontWeight: '900' },
  metricLabel: { color: token.muted, fontSize: fp(10), marginTop: hp(2) },
  actionRow: { flexDirection: 'row', gap: wp(8), marginTop: hp(12) },
  actionButton: {
    flex: 1,
    minHeight: hp(42),
    borderRadius: wp(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingHorizontal: wp(8),
  },
  whatsAppButton: { backgroundColor: token.green },
  instagramButton: { backgroundColor: token.blue },
  whatsAppText: { color: token.greenText, fontSize: fp(11), fontWeight: '900' },
  instagramText: { color: token.blueText, fontSize: fp(11), fontWeight: '900' },
  emptyState: { backgroundColor: token.card, borderRadius: wp(8), padding: wp(20), alignItems: 'center' },
  emptyText: { color: token.muted, fontWeight: '700' },
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  scrimTouch: { flex: 1 },
  drawer: {
    maxHeight: '78%',
    backgroundColor: token.card,
    borderTopLeftRadius: wp(18),
    borderTopRightRadius: wp(18),
    paddingHorizontal: wp(16),
    paddingBottom: hp(12),
  },
  drawerHandle: {
    alignSelf: 'center',
    width: wp(42),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: '#444',
    marginVertical: hp(10),
  },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(8) },
  drawerTitle: { color: token.ink, fontSize: fp(20), fontWeight: '900' },
  drawerSub: { color: token.muted, fontSize: fp(12), marginTop: hp(2) },
  closeBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(8),
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableBlock: { marginTop: hp(12), borderWidth: 1, borderColor: token.border, borderRadius: wp(8), overflow: 'hidden' },
  tableTitle: { color: token.orange, backgroundColor: token.terminal, fontSize: fp(12), fontWeight: '900', padding: wp(12) },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(12), paddingHorizontal: wp(12), borderTopWidth: 1, borderTopColor: token.border },
  tableLabel: { color: token.soft, fontSize: fp(12), flex: 1 },
  tableValue: { color: token.ink, fontSize: fp(12), fontWeight: '900', textAlign: 'right' },
  sectionCard: {
    backgroundColor: token.card,
    borderWidth: 1,
    borderColor: token.border,
    borderRadius: wp(8),
    padding: wp(14),
    marginBottom: hp(12),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(8), marginBottom: hp(12) },
  sectionTitle: { color: token.ink, fontSize: fp(15), fontWeight: '900', flex: 1 },
  inputGroup: { marginBottom: hp(10) },
  inputLabel: { color: token.soft, fontSize: fp(11), fontWeight: '800', marginBottom: hp(6) },
  formInput: {
    minHeight: hp(46),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: token.border,
    backgroundColor: '#090909',
    color: token.ink,
    paddingHorizontal: wp(12),
    fontSize: fp(13),
  },
  formInputFocused: { borderColor: token.borderHi },
  previewToggle: {
    minHeight: hp(44),
    borderRadius: wp(8),
    backgroundColor: token.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginTop: hp(2),
  },
  previewToggleText: { color: token.ink, fontWeight: '900', fontSize: fp(13) },
  mockProfile: { marginTop: hp(12), backgroundColor: '#F7F8FA', borderRadius: wp(8), padding: wp(14) },
  mockAvatar: { width: wp(54), height: wp(54), borderRadius: wp(8), backgroundColor: token.bg, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  mockAvatarText: { color: token.ink, fontWeight: '900', fontSize: fp(18) },
  mockName: { color: '#111', fontWeight: '900', textAlign: 'center', fontSize: fp(18), marginTop: hp(8) },
  mockSub: { color: '#555', textAlign: 'center', fontSize: fp(11), marginTop: hp(2), marginBottom: hp(10) },
  mockLink: { backgroundColor: '#111', borderRadius: wp(8), padding: wp(12), marginTop: hp(8) },
  mockLinkTitle: { color: token.ink, fontSize: fp(13), fontWeight: '900' },
  mockLinkValue: { color: '#D1D5DB', fontSize: fp(11), marginTop: hp(3) },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090909',
    borderRadius: wp(8),
    padding: wp(10),
    marginBottom: hp(8),
    gap: wp(8),
  },
  permissionText: { color: token.soft, flex: 1, fontSize: fp(12), fontWeight: '700' },
  permissionBadge: { color: token.green, fontSize: fp(10), fontWeight: '900' },
  terminalBlock: {
    backgroundColor: token.terminal,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: '#202020',
    padding: wp(12),
    marginTop: hp(6),
  },
  terminalTop: { flexDirection: 'row', alignItems: 'center', gap: wp(8), marginBottom: hp(10) },
  terminalTitle: { color: token.greenText, fontSize: fp(12), fontWeight: '900' },
  commentInput: {
    minHeight: hp(42),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: '#222',
    color: token.ink,
    paddingHorizontal: wp(10),
    fontSize: fp(12),
    marginBottom: hp(8),
  },
  runButton: {
    minHeight: hp(40),
    borderRadius: wp(8),
    backgroundColor: token.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginBottom: hp(10),
  },
  runButtonText: { color: token.ink, fontSize: fp(12), fontWeight: '900' },
  logs: { gap: hp(5) },
  logLine: {
    color: '#9FE8B5',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: fp(11),
    lineHeight: fp(16),
  },
});
