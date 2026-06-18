import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
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
} from 'lucide-react-native';

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

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */

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

/* ─────────────────────────────────────────
   INITIAL DATA
───────────────────────────────────────── */

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

/* ─────────────────────────────────────────
   MOCK PROFILE
───────────────────────────────────────── */

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
        <TouchableOpacity key={label} style={styles.mockLink}>
          <Text style={styles.mockLinkTitle}>{label}</Text>
          <Text style={styles.mockLinkValue} numberOfLines={1}>
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */

export default function CreatorCenter() {
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={token.bg} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* HERO */}
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

        {/* LINK BUILDER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <WalletCards size={wp(19)} color={token.orange} />
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
                placeholderTextColor={token.muted}
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
          >
            <ExternalLink size={wp(16)} color={token.ink} />
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
            <BadgeCheck size={wp(19)} color={token.blue} />
            <Text style={styles.sectionTitle}>
              Meta Instagram Graph Automation
            </Text>
          </View>

          {PERMISSIONS.map((p) => (
            <View key={p} style={styles.permissionRow}>
              <CheckCircle2 size={wp(18)} color={token.green} />
              <Text style={styles.permissionText}>{p}</Text>
              <Text style={styles.permissionBadge}>ACTIVE</Text>
            </View>
          ))}

          {/* TERMINAL */}
          <View style={styles.terminalBlock}>
            <View style={styles.terminalTop}>
              <Terminal size={wp(16)} color={token.greenText} />
              <Text style={styles.terminalTitle}>
                Webhook Testing Shell
              </Text>
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Mock user comment"
              placeholderTextColor={token.muted}
              style={styles.commentInput}
            />

            <TouchableOpacity
              style={styles.runButton}
              onPress={runHook}
            >
              <Play size={wp(15)} color={token.ink} />
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
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: token.bg },
  content: { paddingHorizontal: wp(16), paddingBottom: hp(110) },

  heroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(18),
  },
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
  },
  title: {
    color: token.ink,
    fontSize: fp(24),
    fontWeight: '900',
  },
  subtitle: {
    color: token.soft,
    fontSize: fp(12),
  },

  sectionCard: {
    backgroundColor: token.card,
    borderWidth: 1,
    borderColor: token.border,
    borderRadius: wp(8),
    padding: wp(14),
    marginBottom: hp(12),
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(12),
  },

  sectionTitle: {
    color: token.ink,
    fontSize: fp(15),
    fontWeight: '900',
    flex: 1,
  },

  inputGroup: { marginBottom: hp(10) },
  inputLabel: {
    color: token.soft,
    fontSize: fp(11),
    fontWeight: '800',
    marginBottom: hp(6),
  },
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
  previewToggleText: {
    color: token.ink,
    fontWeight: '900',
    fontSize: fp(13),
  },

  mockProfile: {
    marginTop: hp(12),
    backgroundColor: '#F7F8FA',
    borderRadius: wp(8),
    padding: wp(14),
  },
  mockAvatar: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(8),
    backgroundColor: token.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  mockAvatarText: {
    color: token.ink,
    fontWeight: '900',
    fontSize: fp(18),
  },
  mockName: {
    color: '#111',
    fontWeight: '900',
    textAlign: 'center',
    fontSize: fp(18),
  },
  mockSub: {
    color: '#555',
    textAlign: 'center',
    fontSize: fp(11),
  },
  mockLink: {
    backgroundColor: '#111',
    borderRadius: wp(8),
    padding: wp(12),
    marginTop: hp(8),
  },
  mockLinkTitle: {
    color: token.ink,
    fontSize: fp(13),
    fontWeight: '900',
  },
  mockLinkValue: {
    color: '#D1D5DB',
    fontSize: fp(11),
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090909',
    borderRadius: wp(8),
    padding: wp(10),
    marginBottom: hp(8),
    gap: wp(8),
  },
  permissionText: {
    color: token.soft,
    flex: 1,
    fontSize: fp(12),
    fontWeight: '700',
  },
  permissionBadge: {
    color: token.green,
    fontSize: fp(10),
    fontWeight: '900',
  },

  terminalBlock: {
    backgroundColor: token.terminal,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: '#202020',
    padding: wp(12),
  },

  terminalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(10),
  },

  terminalTitle: {
    color: token.greenText,
    fontSize: fp(12),
    fontWeight: '900',
  },

  commentInput: {
    minHeight: hp(42),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: '#222',
    color: token.ink,
    paddingHorizontal: wp(10),
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

  runButtonText: {
    color: token.ink,
    fontSize: fp(12),
    fontWeight: '900',
  },

  logs: { gap: hp(5) },
  logLine: {
    color: '#9FE8B5',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    fontSize: fp(11),
  },
});