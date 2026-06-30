import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
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
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Play,
  Sparkles,
  Terminal,
  WalletCards,
  Bell,
  AtSign,
  Save,
  Globe,
  User,
  BarChart2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { fp, hp, wp } from '../../../../utils/responsive';
import { api, ApiError } from '../../../../services/ApiClient';

type Niche = 'Finance' | 'AI' | 'Beauty' | 'Fitness' | 'SaaS';

type LinksState = {
  education: string;
  collabs: string;
  consulting: string;
  ugc: string;
};

type LinkKey = keyof LinksState;

const NICHES: Niche[] = ['Finance', 'AI', 'Beauty', 'Fitness', 'SaaS'];

const INITIAL_LINKS: LinksState = {
  education: '',
  collabs: '',
  consulting: '',
  ugc: '',
};

const LINK_LABELS: Record<LinkKey, string> = {
  education: 'Education',
  collabs: 'Brand Collabs',
  consulting: 'Consulting',
  ugc: 'UGC',
};

const PERMISSIONS: string[] = [
  'instagram_manage_insights',
  'messages',
];


type MockProfileProps = {
  name: string;
  bio: string;
  links: LinksState;
};

const MockProfile: React.FC<MockProfileProps> = ({ name, bio, links }) => {
  const items: [string, string][] = [
    ['Monetized Course', links.education],
    ['Webinar + Brand Collab', links.collabs],
    ['Consulting Calendar', links.consulting],
    ['UGC Rate Card', links.ugc],
  ].filter(([, v]) => v.trim() !== '') as [string, string][];

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'RC';

  return (
    <View style={styles.mockProfile}>
      <View style={styles.mockAvatar}>
        <Text style={styles.mockAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.mockName}>{name || 'Your Name'}</Text>
      <Text style={styles.mockSub}>{bio || 'Your bio will appear here.'}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyLinksHint}>Add links above to see them here.</Text>
      ) : (
        items.map(([label, value]) => (
          <TouchableOpacity key={label} style={styles.mockLink} activeOpacity={0.7}>
            <Text style={styles.mockLinkTitle}>{label}</Text>
            <Text style={styles.mockLinkValue} numberOfLines={1}>{value}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};


const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <Text style={styles.fieldError}>{message}</Text> : null;


export default function CreatorCenter() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  /* ── UI state ── */
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [hookLoading, setHookLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── Profile fields ── */
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState<Niche>('Finance');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [sebiRegistered, setSebiRegistered] = useState(false);
  const [followers, setFollowers] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [avgViews, setAvgViews] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ── Links & terminal ── */
  const [links, setLinks] = useState<LinksState>(INITIAL_LINKS);
  const [comment, setComment] = useState('Send me the webinar bonus');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '$ waiting for webhook payload...',
    'Graph API sandbox connected.',
  ]);

  /* ─── Derived ─── */
  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get<any>('/api/creator/profile');
      if (data) {
        setName(data.name ?? '');
        setBio(data.bio ?? '');
        setNiche(data.niche ?? 'Finance');
        setCity(data.city ?? '');
        setPhone(data.phone ?? '');
        setInstagram(data.instagram ?? '');
        setSebiRegistered(data.sebiRegistered ?? false);
        setFollowers(data.followers ?? '');
        setEngagementRate(data.engagementRate ?? '');
        setAvgViews(data.avgViews ?? '');
        setIsPublished(data.isPublished ?? false);
        if (data.links) {
          setLinks({
            education: data.links.education ?? '',
            collabs: data.links.collabs ?? '',
            consulting: data.links.consulting ?? '',
            ugc: data.links.ugc ?? '',
          });
        }
      }
    } catch (e) {
      console.warn('[CreatorCenter] loadProfile error:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setFieldErrors({});
    setSaveSuccess(false);
    try {
      await api.put('/api/creator/profile', {
        name,
        bio,
        niche,
        city,
        phone,
        AtSign,
        sebiRegistered,
        followers,
        engagementRate,
        avgViews,
        links,
        audience: [],
        packages: [],
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      const err = e as ApiError;
      if (err.error === 'VALIDATION_FAILED' && err.fields) {
        setFieldErrors(err.fields);
      } else {
        Alert.alert('Save failed', 'Could not save your profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    setPublishLoading(true);
    try {
      const data = await api.post<{ isPublished: boolean }>(
        '/api/creator/profile/publish',
        {},
      );
      setIsPublished(data.isPublished);
    } catch (e: any) {
      const err = e as ApiError;
      if (err.error === 'INCOMPLETE_PROFILE') {
        Alert.alert(
          'Profile incomplete',
          `Fill in these fields before publishing:\n\n${(err.missingFields ?? []).join(', ')}`,
        );
      } else if (err.status === 404) {
        Alert.alert('No profile yet', 'Save your profile first before publishing.');
      } else {
        Alert.alert('Error', 'Could not update publish status. Try again.');
      }
    } finally {
      setPublishLoading(false);
    }
  };


  const runHook = async () => {
    setHookLoading(true);
    try {
      const data = await api.post<{ lines: string[] }>(
        '/api/creator/webhook-test',
        { comment },
      );
      setTerminalLines(data.lines);
    } catch {
      setTerminalLines(['[error] webhook test failed — check server connection']);
    } finally {
      setHookLoading(false);
    }
  };

  const updateLink = (field: LinkKey, value: string) => {
    setLinks(prev => ({ ...prev, [field]: value }));
  };

  const inputStyle = (field: string) => [
    styles.formInput,
    focusedField === field && styles.formInputFocused,
    !!fieldErrors[field] && styles.formInputError,
  ];


  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greetingSub}>{getGreeting()}</Text>
              <Text style={styles.greeting}>{displayName?.split(' ')[0]}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
            >
              <AtSign size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('CreatorNotification')}
            >
              <Bell size={wp(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={styles.heroBlock}>
          <View style={styles.heroIcon}>
            <Sparkles size={wp(22)} color={colors.secondary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>MONETIZATION ENGINE</Text>
            <Text style={styles.title}>Creator Center</Text>
            <Text style={styles.subtitle}>
              Build your public profile, configure offers, and test Meta automations.
            </Text>
          </View>
        </View>

        {/* ── Publish Status Banner ── */}
        <View style={[styles.publishBanner, isPublished ? styles.publishBannerLive : styles.publishBannerDraft]}>
          <View style={styles.publishBannerLeft}>
            <View style={[styles.publishDot, { backgroundColor: isPublished ? '#16A34A' : '#F59E0B' }]} />
            <View>
              <Text style={styles.publishBannerTitle}>
                {isPublished ? 'Listed on Marketplace' : 'Draft — not visible to brands'}
              </Text>
              <Text style={styles.publishBannerSub}>
                {isPublished
                  ? 'Brands can discover and contact you'
                  : 'Save your profile, then publish to go live'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.publishToggleBtn, isPublished ? styles.publishToggleBtnLive : styles.publishToggleBtnDraft]}
            onPress={togglePublish}
            disabled={publishLoading}
            activeOpacity={0.8}
          >
            {publishLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.publishToggleBtnText}>
                {isPublished ? 'Unpublish' : 'Publish'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SECTION: Creator Profile ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>Public Profile</Text>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Rigi Creator Studio"
              placeholderTextColor="#94A3B8"
              style={inputStyle('name')}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            <FieldError message={fieldErrors.name} />
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Courses, consults, collabs, and UGC"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={[inputStyle('bio'), styles.textArea]}
              onFocus={() => setFocusedField('bio')}
              onBlur={() => setFocusedField(null)}
            />
            <FieldError message={fieldErrors.bio} />
          </View>

          {/* Niche Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Niche</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nicheRow}
            >
              {NICHES.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.nicheChip, niche === n && styles.nicheChipActive]}
                  onPress={() => setNiche(n)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.nicheChipText, niche === n && styles.nicheChipTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Mumbai"
              placeholderTextColor="#94A3B8"
              style={inputStyle('city')}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
            />
            <FieldError message={fieldErrors.city} />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WhatsApp Number (digits only)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="919876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={inputStyle('phone')}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
            <FieldError message={fieldErrors.phone} />
          </View>

          {/* Instagram */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Instagram Handle (no @)</Text>
            <TextInput
              value={instagram}
              onChangeText={setInstagram}
              placeholder="yourhandle"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={inputStyle('instagram')}
              onFocus={() => setFocusedField('instagram')}
              onBlur={() => setFocusedField(null)}
            />
            <FieldError message={fieldErrors.instagram} />
          </View>

          {/* SEBI Toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>SEBI Registered</Text>
              <Text style={styles.switchSub}>Adds a verified badge on your card</Text>
            </View>
            <Switch
              value={sebiRegistered}
              onValueChange={setSebiRegistered}
              trackColor={{ false: '#CBD5E1', true: colors.primary + '60' }}
              thumbColor={sebiRegistered ? colors.primary : '#F1F5F9'}
            />
          </View>
        </View>

        {/* ── SECTION: Stats ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BarChart2 size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>Audience Stats</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statField}>
              <Text style={styles.inputLabel}>Followers</Text>
              <TextInput
                value={followers}
                onChangeText={setFollowers}
                placeholder="486K"
                placeholderTextColor="#94A3B8"
                style={inputStyle('followers')}
                onFocus={() => setFocusedField('followers')}
                onBlur={() => setFocusedField(null)}
              />
              <FieldError message={fieldErrors.followers} />
            </View>
            <View style={styles.statField}>
              <Text style={styles.inputLabel}>Engagement Rate</Text>
              <TextInput
                value={engagementRate}
                onChangeText={setEngagementRate}
                placeholder="6.8%"
                placeholderTextColor="#94A3B8"
                style={inputStyle('engagementRate')}
                onFocus={() => setFocusedField('engagementRate')}
                onBlur={() => setFocusedField(null)}
              />
              <FieldError message={fieldErrors.engagementRate} />
            </View>
            <View style={styles.statField}>
              <Text style={styles.inputLabel}>Avg Views</Text>
              <TextInput
                value={avgViews}
                onChangeText={setAvgViews}
                placeholder="92K"
                placeholderTextColor="#94A3B8"
                style={inputStyle('avgViews')}
                onFocus={() => setFocusedField('avgViews')}
                onBlur={() => setFocusedField(null)}
              />
              <FieldError message={fieldErrors.avgViews} />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Save size={wp(16)} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {saveSuccess ? 'Saved!' : 'Save Profile'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SECTION: Link-In-Bio ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <WalletCards size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>Link-In-Bio Digital Forge</Text>
          </View>

          {(Object.keys(INITIAL_LINKS) as LinkKey[]).map(field => (
            <View key={field} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{LINK_LABELS[field]}</Text>
              <TextInput
                value={links[field]}
                onChangeText={v => updateLink(field, v)}
                onFocus={() => setFocusedField(`link_${field}`)}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#94A3B8"
                placeholder={field === 'collabs' ? 'brand@you.com or https://…' : 'https://…'}
                autoCapitalize="none"
                style={inputStyle(`link_${field}`)}
              />
              <FieldError message={fieldErrors[`link${field.charAt(0).toUpperCase() + field.slice(1)}`]} />
            </View>
          ))}

          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => setPreviewOpen(p => !p)}
            activeOpacity={0.8}
          >
            <ExternalLink size={wp(16)} color={colors.white} />
            <Text style={styles.previewToggleText}>
              {previewOpen ? 'Hide Preview' : 'Open Live Preview'}
            </Text>
          </TouchableOpacity>

          {previewOpen && <MockProfile name={name} bio={bio} links={links} />}
        </View>

        {/* ── SECTION: Meta Automation ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BadgeCheck size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>Meta Instagram Graph Automation</Text>
          </View>

          {PERMISSIONS.map(p => (
            <View key={p} style={styles.permissionRow}>
              <CheckCircle2 size={wp(18)} color={colors.success} />
              <Text style={styles.permissionText}>{p}</Text>
              <Text style={styles.permissionBadge}>ACTIVE</Text>
            </View>
          ))}

          <View style={styles.terminalBlock}>
            <View style={styles.terminalTop}>
              <Terminal size={wp(16)} color="#38BDF8" />
              <Text style={styles.terminalTitle}>Webhook Testing Shell</Text>
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Mock user comment"
              placeholderTextColor="#64748B"
              style={styles.commentInput}
            />

            <TouchableOpacity
              style={[styles.runButton, hookLoading && styles.runButtonDisabled]}
              onPress={runHook}
              disabled={hookLoading}
              activeOpacity={0.8}
            >
              {hookLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Play size={wp(15)} color={colors.white} />
                  <Text style={styles.runButtonText}>Run Hook Emulation</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.logs}>
              {terminalLines.map((line, i) => (
                <Text key={i} style={styles.logLine}>{line}</Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    gap: hp(12),
  },
  loadingText: { color: '#64748B', fontSize: fp(14), fontWeight: '500' },
  scrollContent: { paddingHorizontal: wp(16), paddingBottom: hp(110) },

  /* Header */
  headerWrapper: {
    backgroundColor: colors.primary,
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(12) },
  avatar: {
    width: wp(44), height: wp(44), borderRadius: wp(22),
    borderWidth: 2, borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(44), height: wp(44), borderRadius: wp(22),
    backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fp(18), fontWeight: '700', color: colors.white },
  greetingSub: { fontSize: fp(12), color: colors.muted, fontWeight: '500' },
  greeting: { fontSize: fp(16), fontWeight: '800', color: colors.white, marginTop: hp(1) },
  bellBtn: {
    width: wp(40), height: wp(40), borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  /* Hero */
  heroBlock: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: wp(16),
    borderWidth: 1, borderColor: '#eaecef',
    padding: wp(16), marginVertical: hp(16),
  },
  heroIcon: {
    width: wp(46), height: wp(46), borderRadius: wp(12),
    backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center',
    marginRight: wp(12), borderWidth: 1, borderColor: '#FED7AA',
  },
  heroCopy: { flex: 1 },
  kicker: { color: '#F59E0B', fontSize: fp(10), fontWeight: '900', letterSpacing: 0.5 },
  title: { color: '#0F172A', fontSize: fp(20), fontWeight: '800', marginTop: hp(2) },
  subtitle: { color: '#64748b', fontSize: fp(11.5), marginTop: hp(2), lineHeight: fp(16) },

  /* Publish Banner */
  publishBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: wp(14), padding: wp(14), marginBottom: hp(16),
    borderWidth: 1,
  },
  publishBannerLive: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  publishBannerDraft: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  publishBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(10), flex: 1 },
  publishDot: { width: wp(8), height: wp(8), borderRadius: wp(4) },
  publishBannerTitle: { color: '#0F172A', fontSize: fp(13), fontWeight: '700' },
  publishBannerSub: { color: '#64748B', fontSize: fp(11), marginTop: hp(2) },
  publishToggleBtn: {
    paddingHorizontal: wp(14), paddingVertical: hp(8),
    borderRadius: wp(10), minWidth: wp(90), alignItems: 'center',
  },
  publishToggleBtnLive: { backgroundColor: '#DC2626' },
  publishToggleBtnDraft: { backgroundColor: '#16A34A' },
  publishToggleBtnText: { color: colors.white, fontSize: fp(12.5), fontWeight: '700' },

  /* Section cards */
  sectionCard: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: wp(16), padding: wp(16), marginBottom: hp(16),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: wp(8), marginBottom: hp(16),
  },
  sectionTitle: { color: '#0F172A', fontSize: fp(15), fontWeight: '800', flex: 1 },

  /* Inputs */
  inputGroup: { marginBottom: hp(12) },
  inputLabel: { color: '#475467', fontSize: fp(11.5), fontWeight: '700', marginBottom: hp(6) },
  formInput: {
    minHeight: hp(46), borderRadius: wp(12), borderWidth: 1,
    borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
    color: '#0F172A', paddingHorizontal: wp(14), fontSize: fp(13.5),
  },
  formInputFocused: { borderColor: colors.secondary, backgroundColor: colors.white },
  formInputError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  textArea: { minHeight: hp(80), paddingTop: hp(12), textAlignVertical: 'top' },
  fieldError: { color: '#EF4444', fontSize: fp(11), marginTop: hp(4), fontWeight: '500' },

  /* Niche chips */
  nicheRow: { gap: wp(8), paddingVertical: hp(4) },
  nicheChip: {
    paddingHorizontal: wp(16), paddingVertical: hp(8),
    borderRadius: wp(20), backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  nicheChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  nicheChipText: { fontSize: fp(12.5), color: '#64748B', fontWeight: '600' },
  nicheChipTextActive: { color: colors.white, fontWeight: '700' },

  /* SEBI switch */
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderRadius: wp(12), padding: wp(14),
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: hp(4),
  },
  switchTitle: { color: '#334155', fontSize: fp(13), fontWeight: '700' },
  switchSub: { color: '#94A3B8', fontSize: fp(11), marginTop: hp(2) },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: wp(8), marginBottom: hp(12) },
  statField: { flex: 1 },

  /* Save button */
  saveBtn: {
    minHeight: hp(48), borderRadius: wp(12), backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(8), marginTop: hp(4),
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: fp(14) },

  /* Links */
  previewToggle: {
    minHeight: hp(44), borderRadius: wp(12), backgroundColor: colors.info,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(8), marginTop: hp(8),
  },
  previewToggleText: { color: colors.white, fontWeight: '700', fontSize: fp(13.5) },

  /* Mock preview */
  mockProfile: {
    marginTop: hp(16), backgroundColor: '#F8FAFC', borderRadius: wp(20),
    borderWidth: 2, borderColor: '#E2E8F0', padding: wp(16),
  },
  mockAvatar: {
    width: wp(56), height: wp(56), borderRadius: wp(28),
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', borderWidth: 2, borderColor: colors.white, elevation: 2,
  },
  mockAvatarText: { color: colors.white, fontWeight: '800', fontSize: fp(18) },
  mockName: {
    color: '#0F172A', fontWeight: '800', textAlign: 'center',
    fontSize: fp(16), marginTop: hp(8),
  },
  mockSub: {
    color: '#64748b', textAlign: 'center', fontSize: fp(11.5),
    marginTop: hp(2), marginBottom: hp(12),
  },
  emptyLinksHint: {
    color: '#94A3B8', textAlign: 'center', fontSize: fp(12),
    marginTop: hp(8), fontStyle: 'italic',
  },
  mockLink: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(12),
    marginTop: hp(8), borderWidth: 1, borderColor: '#E2E8F0',
  },
  mockLinkTitle: { color: '#0F172A', fontSize: fp(12.5), fontWeight: '700' },
  mockLinkValue: { color: '#64748b', fontSize: fp(11), marginTop: hp(1) },

  /* Permissions */
  permissionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: wp(12), padding: wp(12),
    marginBottom: hp(8), gap: wp(8), borderWidth: 1, borderColor: '#E2E8F0',
  },
  permissionText: { color: '#334155', flex: 1, fontSize: fp(12), fontWeight: '600' },
  permissionBadge: {
    color: '#16A34A', fontSize: fp(10), fontWeight: '800',
    backgroundColor: '#DCFCE7', paddingHorizontal: wp(8),
    paddingVertical: hp(2), borderRadius: wp(6), overflow: 'hidden',
  },

  /* Terminal */
  terminalBlock: {
    backgroundColor: '#0F172A', borderRadius: wp(14),
    borderWidth: 1, borderColor: '#1E293B',
    padding: wp(14), marginTop: hp(8),
  },
  terminalTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: wp(8), marginBottom: hp(12),
  },
  terminalTitle: { color: '#38BDF8', fontSize: fp(12), fontWeight: '800' },
  commentInput: {
    minHeight: hp(42), borderRadius: wp(10), borderWidth: 1,
    borderColor: '#334155', color: colors.white, backgroundColor: '#1E293B',
    paddingHorizontal: wp(12), fontSize: fp(12.5), marginBottom: hp(10),
  },
  runButton: {
    minHeight: hp(40), borderRadius: wp(10), backgroundColor: colors.info,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(8), marginBottom: hp(12),
  },
  runButtonDisabled: { opacity: 0.6 },
  runButtonText: { color: colors.white, fontSize: fp(12.5), fontWeight: '700' },
  logs: { gap: hp(6), borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: hp(10) },
  logLine: {
    color: '#34D399',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: fp(11), lineHeight: fp(15),
  },
});