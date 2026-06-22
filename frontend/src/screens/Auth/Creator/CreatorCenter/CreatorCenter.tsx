import React, { useState } from 'react';
import {
  Platform,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Play,
  Sparkles,
  Terminal,
  WalletCards,
  UserCircle,
  Bell,
  Instagram,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { fp, hp, wp } from '../../../../utils/responsive';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */

type LinksState = {
  education: string;
  collabs: string;
  consulting: string;
  ugc: string;
};

type LinkKey = keyof LinksState;

type TerminalLine = string;

const INITIAL_LINKS: LinksState = {
  education: 'https://rigi.link/wealth-sprint',
  collabs: 'brand@creator.studio',
  consulting: 'https://cal.com/rigi-growth',
  ugc: 'https://rigi.link/ugc-kit',
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
  links: LinksState;
};

const MockProfile: React.FC<MockProfileProps> = ({ links }) => {
  const items: [string, string][] = [
    ['Monetized Course', links.education],
    ['Webinar + Brand Collab', links.collabs],
    ['Consulting Calendar', links.consulting],
    ['UGC Rate Card', links.ugc],
  ];

  return (
    <View style={styles.mockProfile}>
      <View style={styles.mockAvatar}>
        <Text style={styles.mockAvatarText}>RC</Text>
      </View>

      <Text style={styles.mockName}>Rigi Creator Studio</Text>
      <Text style={styles.mockSub}>
        Courses, consults, collabs, and UGC menu
      </Text>

      {items.map(([label, value]) => (
        <TouchableOpacity key={label} style={styles.mockLink} activeOpacity={0.7}>
          <Text style={styles.mockLinkTitle}>{label}</Text>
          <Text style={styles.mockLinkValue} numberOfLines={1}>
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function CreatorCenter() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  const [links, setLinks] = useState<LinksState>(INITIAL_LINKS);
  const [focusedField, setFocusedField] = useState<LinkKey | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [comment, setComment] = useState<string>(
    'Send me the webinar bonus',
  );
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    '$ waiting for webhook payload...',
    'Graph API sandbox connected.',
  ]);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const updateLink = (field: LinkKey, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Curved App Header */}
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
              accessibilityLabel="Instagram"
            >
              <Instagram size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('CreatorNotification')}
              accessibilityLabel="Notifications"
            >
              <Bell size={wp(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER */}
        <View style={styles.heroBlock}>
          <View style={styles.heroIcon}>
            <Sparkles size={wp(22)} color={colors.secondary} />
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>MONETIZATION ENGINE</Text>
            <Text style={styles.title}>Creator Center</Text>
            <Text style={styles.subtitle}>
              Configure offers, preview your micro-site, and test Meta automations.
            </Text>
          </View>
        </View>

        {/* LINK BUILDER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <WalletCards size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>
              Link-In-Bio Digital Forge
            </Text>
          </View>

          {(Object.keys(INITIAL_LINKS) as LinkKey[]).map((field) => (
            <View key={field} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {LINK_LABELS[field]}
              </Text>

              <TextInput
                value={links[field]}
                onChangeText={(v) => updateLink(field, v)}
                onFocus={() => setFocusedField(field)}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#94A3B8"
                style={[
                  styles.formInput,
                  focusedField === field && styles.formInputFocused,
                ]}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => setPreviewOpen((p) => !p)}
            activeOpacity={0.8}
          >
            <ExternalLink size={wp(16)} color={colors.white} />
            <Text style={styles.previewToggleText}>
              {previewOpen
                ? 'Hide Live Preview'
                : 'Open Live Mock Preview'}
            </Text>
          </TouchableOpacity>

          {previewOpen && <MockProfile links={links} />}
        </View>

        {/* META AUTOMATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BadgeCheck size={wp(19)} color={colors.info} />
            <Text style={styles.sectionTitle}>
              Meta Instagram Graph Automation
            </Text>
          </View>

          {PERMISSIONS.map((p) => (
            <View key={p} style={styles.permissionRow}>
              <CheckCircle2 size={wp(18)} color={colors.success} />
              <Text style={styles.permissionText}>{p}</Text>
              <Text style={styles.permissionBadge}>ACTIVE</Text>
            </View>
          ))}

          {/* TERMINAL */}
          <View style={styles.terminalBlock}>
            <View style={styles.terminalTop}>
              <Terminal size={wp(16)} color="#38BDF8" />
              <Text style={styles.terminalTitle}>
                Webhook Testing Shell
              </Text>
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Mock user comment"
              placeholderTextColor="#64748B"
              style={styles.commentInput}
            />

            <TouchableOpacity
              style={styles.runButton}
              onPress={runHook}
              activeOpacity={0.8}
            >
              <Play size={wp(15)} color={colors.white} />
              <Text style={styles.runButtonText}>
                Run Hook Emulation
              </Text>
            </TouchableOpacity>

            <View style={styles.logs}>
              {terminalLines.map((line, i) => (
                <Text key={i} style={styles.logLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(110),
  },

  // Curved Header Styles matching CreatorHome/CreatorWebinar
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
  },
  greetingSub: {
    fontSize: fp(12),
    color: colors.muted,
    fontWeight: '500',
  },
  greeting: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Hero section
  heroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: '#eaecef',
    padding: wp(16),
    marginVertical: hp(16),
  },
  heroIcon: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(12),
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  heroCopy: { flex: 1 },
  kicker: {
    color: colors.seconday,
    fontSize: fp(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: '#0F172A',
    fontSize: fp(20),
    fontWeight: '800',
    marginTop: hp(2),
  },
  subtitle: {
    color: '#64748b',
    fontSize: fp(11.5),
    marginTop: hp(2),
    lineHeight: fp(16),
  },

  // Cards
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(16),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(16),
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: fp(15),
    fontWeight: '800',
    flex: 1,
  },

  inputGroup: { marginBottom: hp(12) },
  inputLabel: {
    color: '#475467',
    fontSize: fp(11.5),
    fontWeight: '700',
    marginBottom: hp(6),
  },
  formInput: {
    minHeight: hp(46),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    paddingHorizontal: wp(14),
    fontSize: fp(13.5),
  },
  formInputFocused: {
    borderColor: colors.secondary,
    backgroundColor: colors.white,
  },

  previewToggle: {
    minHeight: hp(44),
    borderRadius: wp(12),
    backgroundColor: colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginTop: hp(8),
  },
  previewToggleText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(13.5),
  },

  // Live Preview Mock
  mockProfile: {
    marginTop: hp(16),
    backgroundColor: '#F8FAFC',
    borderRadius: wp(20),
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: wp(16),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mockAvatar: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 2,
  },
  mockAvatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: fp(18),
  },
  mockName: {
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: fp(16),
    marginTop: hp(8),
  },
  mockSub: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: fp(11.5),
    marginTop: hp(2),
    marginBottom: hp(12),
  },
  mockLink: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(12),
    marginTop: hp(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'column',
  },
  mockLinkTitle: {
    color: '#0F172A',
    fontSize: fp(12.5),
    fontWeight: '700',
  },
  mockLinkValue: {
    color: '#64748b',
    fontSize: fp(11),
    marginTop: hp(1),
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    gap: wp(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permissionText: {
    color: '#334155',
    flex: 1,
    fontSize: fp(12),
    fontWeight: '600',
  },
  permissionBadge: {
    color: '#16A34A',
    fontSize: fp(10),
    fontWeight: '800',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
    overflow: 'hidden',
  },

  // Terminal
  terminalBlock: {
    backgroundColor: '#0F172A',
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: wp(14),
    marginTop: hp(8),
  },
  terminalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(12),
  },
  terminalTitle: {
    color: '#38BDF8',
    fontSize: fp(12),
    fontWeight: '800',
  },
  commentInput: {
    minHeight: hp(42),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: '#334155',
    color: colors.white,
    backgroundColor: '#1E293B',
    paddingHorizontal: wp(12),
    fontSize: fp(12.5),
    marginBottom: hp(10),
  },
  runButton: {
    minHeight: hp(40),
    borderRadius: wp(10),
    backgroundColor: colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginBottom: hp(12),
  },
  runButtonText: {
    color: colors.white,
    fontSize: fp(12.5),
    fontWeight: '700',
  },
  logs: {
    gap: hp(6),
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: hp(10),
  },
  logLine: {
    color: '#34D399',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    fontSize: fp(11),
    lineHeight: fp(15),
  },
});