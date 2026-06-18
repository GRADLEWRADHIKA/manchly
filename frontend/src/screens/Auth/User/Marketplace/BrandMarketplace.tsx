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
  BriefcaseBusiness,
  ChevronDown,
  Instagram,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { fp, hp, wp } from '../../../utils/responsive';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */

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
  orange: '#F97316',
  green: '#16A34A',
  greenText: '#DCFCE7',
  blue: '#2563EB',
  blueText: '#DBEAFE',
  terminal: '#0A0A0A',
};

/* ─────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────── */

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
];

/* ─────────────────────────────────────────
   ATOMS
───────────────────────────────────────── */

const Metric: React.FC<MetricProps> = ({ label, value }) => (
  <View style={s.metricBox}>
    <Text style={s.metricValue}>{value}</Text>
    <Text style={s.metricLabel}>{label}</Text>
  </View>
);

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

/* ─────────────────────────────────────────
   INSPECTOR DRAWER
───────────────────────────────────────── */

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
      <TouchableOpacity style={s.scrimTouch} onPress={onClose} />
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
              <X size={18} color={token.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView>
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

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */

export default function BrandMarketplace() {
  const [query, setQuery] = useState<string>('');
  const [activeNiche, setActiveNiche] = useState<string>('Finance');
  const [sebiOnly, setSebiOnly] = useState<boolean>(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(
    null,
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
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={token.bg} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.feedContent}
        ListHeaderComponent={
          <View>
            <View style={s.heroBlock}>
              <View style={s.heroIcon}>
                <BriefcaseBusiness size={22} color={token.ink} />
              </View>
              <View style={s.heroCopy}>
                <Text style={s.title}>Brand Marketplace</Text>
              </View>
            </View>

            <View style={s.searchBox}>
              <Search size={18} color={token.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search creator"
                placeholderTextColor={token.muted}
                style={s.searchInput}
              />
            </View>

            <View style={s.switchRow}>
              <Text style={s.switchTitle}>SEBI Only</Text>
              <Switch value={sebiOnly} onValueChange={setSebiOnly} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.creatorCard}
            onPress={() => setSelectedCreator(item)}
          >
            <Text style={s.creatorName}>{item.name}</Text>
            <Text style={s.creatorBio}>{item.bio}</Text>

            <View style={s.actionRow}>
              <TouchableOpacity onPress={() => openWhatsApp(item)}>
                <Text>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openInstagram(item)}>
                <Text>Instagram</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <InspectorDrawer
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: token.bg },
  feedContent: { padding: 16 },

  heroBlock: { flexDirection: 'row', marginBottom: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    backgroundColor: token.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCopy: { marginLeft: 10 },

  title: { color: token.ink, fontSize: 20, fontWeight: '900' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: token.card,
    padding: 10,
    marginBottom: 12,
  },
  searchInput: { color: token.ink, marginLeft: 8, flex: 1 },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchTitle: { color: token.ink },

  creatorCard: {
    backgroundColor: token.card,
    padding: 12,
    marginBottom: 12,
  },
  creatorName: { color: token.ink, fontWeight: '900' },
  creatorBio: { color: token.soft, marginTop: 4 },

  actionRow: { flexDirection: 'row', marginTop: 10, gap: 10 },

  metricBox: {
    padding: 8,
    backgroundColor: token.bg,
    borderWidth: 1,
    borderColor: token.border,
  },
  metricValue: { color: token.ink },
  metricLabel: { color: token.muted },

  tableBlock: { marginTop: 10 },
  tableTitle: { color: token.orange, fontWeight: '900' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tableLabel: { color: token.soft },
  tableValue: { color: token.ink },

  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scrimTouch: { flex: 1 },
  drawer: { backgroundColor: token.card, padding: 12, maxHeight: '80%' },
  drawerHandle: { height: 4, width: 40, backgroundColor: '#444' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  drawerTitle: { color: token.ink, fontSize: 18 },
  drawerSub: { color: token.muted },
  closeBtn: { padding: 6 },
});