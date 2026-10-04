import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles, Rocket } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

// AI Modal components
import CoursePlannerModal from '../../../../components/ai/CoursePlanner';

// ── Tool cards data ──────────────────────────────────────────────────────────
const AI_TOOLS = [
   {
    id: 'course-planner',
    icon: Rocket,
    title: 'AI Course Planner',
    description: 'Turn any niche into a full go-to-market plan — curriculum, ads, and revenue forecast.',
  },
];

// ── Reusable Tool Card ───────────────────────────────────────────────────────
const ToolCard = ({ icon: Icon, title, description, onPress }: any) => (
  <TouchableOpacity
    style={styles.toolCard}
    activeOpacity={0.75}
    onPress={onPress}
  >
    <View style={styles.toolIconWrap}>
      <Icon size={wp(22)} color={colors.white} />
    </View>
    <Text style={styles.toolTitle}>{title}</Text>
    <Text style={styles.toolDescription}>{description}</Text>
  </TouchableOpacity>
);

// ── Main Screen ──────────────────────────────────────────────────────────────
const AskManchlyAI = () => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const filteredTools = AI_TOOLS.filter(
    tool =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const closeModal = () => setActiveModal(null);

  return (
    <View style={styles.container}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.brandTitle}>Manchly AI</Text>
      </View>

      {/* ── Scrollable Content ──────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Badge */}
        <View style={styles.badgeRow}>
          <Sparkles size={wp(14)} color={colors.gold} fill={colors.gold} />
          <Text style={styles.badgeText}>CREATIVE INTELLIGENCE</Text>
        </View>

        {/* Hero Heading */}
        <Text style={styles.heroTitle}>Ask Manchly AI</Text>
        <Text style={styles.heroSubtitle}>
          Ask Manchly AI to generate content, analyze data, or organize your workflow.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a tool or task..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchIconBtn} activeOpacity={0.75}>
            <Search size={18} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* Tool Cards */}
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              onPress={() => setActiveModal(tool.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tools match "{searchQuery}"</Text>
          </View>
        )}
      </ScrollView>
      <CoursePlannerModal visible={activeModal === 'course-planner'} onClose={closeModal} />
    </View>
    
  );
};

export default AskManchlyAI;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(40),
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: 'transparent',
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },

  // Hero Header
  badgeRow: {
    marginTop: hp(20),
    marginBottom: hp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
  },
  badgeText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: fp(30),
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(10),
  },
  heroSubtitle: {
    fontSize: fp(14),
    color: '#D9C7A3',
    lineHeight: fp(21),
    textAlign: 'center',
    marginBottom: hp(22),
    paddingHorizontal: wp(8),
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: wp(16),
    paddingLeft: wp(16),
    paddingRight: wp(8),
    height: hp(56),
    marginBottom: hp(22),
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: fp(14),
  },
  searchIconBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: '#F5D98F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(8),
  },

  // Tool Card
  toolCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(22),
    padding: wp(20),
    marginBottom: hp(14),
  },
  toolIconWrap: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(14),
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  toolTitle: {
    fontSize: fp(17),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },
  toolDescription: {
    fontSize: fp(13),
    color: '#D9C7A3',
    lineHeight: fp(19),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(40),
  },
  emptyStateText: {
    fontSize: fp(14),
    color: '#D9C7A3',
    textAlign: 'center',
  },
});
