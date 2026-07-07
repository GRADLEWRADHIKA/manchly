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
import { useNavigation } from '@react-navigation/native';
import {
  Menu,
  Bell,
  Search,
  FileText,
  HelpCircle,
  Share2,
  Mail,
  Calendar,
  Lightbulb,
  Wand2,
  Type,
  BookOpen,
  Tv,
  Sparkles,
  UserCircle2,
  ShieldCheck,
  ScrollText,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

// AI Modal components
import LessonScriptModal from '../../../../components/ai/LessonScriptModal';
import QuizModal from '../../../../components/ai/QuizModal';
import SocialPostsModal from '../../../../components/ai/SocialPostsModal';
import EmailSeriesModal from '../../../../components/ai/EmailSeriesModal';
import PrepChecklistModal from '../../../../components/ai/PrepChecklistModal';
import ProductSuggestionsModal from '../../../../components/ai/ProductSuggestionsModal';
import LandingCopyModal from '../../../../components/ai/LandingCopyModal';
import TitleSuggestionsModal from '../../../../components/ai/TitleSuggestionsModal';
import CourseMetaModal from '../../../../components/ai/CourseMetaModal';
import WebinarDescribeModal from '../../../../components/ai/WebinarDescribeModal';
import EnhanceTextModal from '../../../../components/ai/EnhanceTextModal';
import ExpertBioModal from '../../../../components/ai/ExpertBioModal';
import ModerateModal from '../../../../components/ai/ModerateModal';
import LessonSummaryModal from '../../../../components/ai/LessonSummaryModal';

// ── Tool cards data ──────────────────────────────────────────────────────────
const AI_TOOLS = [
  {
    id: 'lesson-script',
    icon: FileText,
    title: 'Lesson Script Writer',
    description: 'Generate structured educational scripts with clear learning outcomes.',
  },
  {
    id: 'quiz',
    icon: HelpCircle,
    title: 'Quiz Generator',
    description: 'Turn any content into engaging assessments and interactive quizzes.',
  },
  {
    id: 'social-posts',
    icon: Share2,
    title: 'Social Posts',
    description: 'Create viral-ready content for LinkedIn, X, and Instagram in seconds.',
  },
  {
    id: 'email-series',
    icon: Mail,
    title: 'Email Series',
    description: 'Draft high-converting nurture sequences and newsletters.',
  },
  {
    id: 'session-prep',
    icon: Calendar,
    title: 'Session Prep',
    description: 'Organize agendas and talking points for your next workshop.',
  },
  {
    id: 'product-suggestion',
    icon: Lightbulb,
    title: 'Product Suggestion',
    description: 'Discover digital product ideas based on your audience needs.',
  },
  {
    id: 'content-enhancer',
    icon: Wand2,
    title: 'Content Enhancer',
    description: 'Refine and polish your existing drafts for maximum impact.',
  },
  {
    id: 'landing-copy',
    icon: Type,
    title: 'Landing Copy',
    description: 'Write persuasive headlines and copy for landing pages that sell.',
  },
  {
    id: 'course-meta',
    icon: BookOpen,
    title: 'Course Meta Generator',
    description: 'Generate title, description, curriculum, and learning outcomes for a course.',
  },
  {
    id: 'webinar-describe',
    icon: Tv,
    title: 'Webinar Description',
    description: 'Create a compelling description, tagline, and takeaways for webinars.',
  },
  {
    id: 'webinar-enhance',
    icon: Sparkles,
    title: 'Webinar Enhancer',
    description: 'Polish webinar titles, descriptions, and outcomes for better conversions.',
  },
  {
    id: 'expert-bio',
    icon: UserCircle2,
    title: 'Expert Bio Writer',
    description: 'Generate a professional short and full bio for your expert profile.',
  },
  {
    id: 'session-enhance',
    icon: Wand2,
    title: 'Session Enhancer',
    description: 'Enhance session headlines, bios, and product descriptions.',
  },
  {
    id: 'moderate',
    icon: ShieldCheck,
    title: 'Content Moderator',
    description: 'Check if your content is safe to publish — detects hate, spam, and more.',
  },
  {
    id: 'lesson-summary',
    icon: ScrollText,
    title: 'Lesson Summarizer',
    description: 'Condense long lesson content into key points and action items.',
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
      <Icon size={wp(20)} color={colors.textSecondary} />
    </View>
    <View style={styles.toolContent}>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolDescription}>{description}</Text>
    </View>
  </TouchableOpacity>
);

// ── Main Screen ──────────────────────────────────────────────────────────────
const AskManchlyAI = () => {
  const navigation = useNavigation<any>();
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
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('CreatorSetting')}
        >
          <Menu size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>Manchly AI</Text>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('CreatorNotification')}
        >
          <Bell size={22} color={colors.textPrimary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Content ──────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Badge */}
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>{'\u2726'}  CREATIVE INTELLIGENCE</Text>
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
            <Search size={16} color={colors.black} />
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

      {/* ── AI Modals ──────────────────────────────────────────────────── */}
      <LessonScriptModal visible={activeModal === 'lesson-script'} onClose={closeModal} topic="" />
      <QuizModal visible={activeModal === 'quiz'} onClose={closeModal} topic="" />
      <SocialPostsModal visible={activeModal === 'social-posts'} onClose={closeModal} webinarTitle="" />
      <EmailSeriesModal visible={activeModal === 'email-series'} onClose={closeModal} webinarTitle="" />
      <PrepChecklistModal visible={activeModal === 'session-prep'} onClose={closeModal} productTitle="" />
      <ProductSuggestionsModal visible={activeModal === 'product-suggestion'} onClose={closeModal} expertise="" />
      <LandingCopyModal visible={activeModal === 'content-enhancer'} onClose={closeModal} title="" description="" price={0} />
      <LandingCopyModal visible={activeModal === 'landing-copy'} onClose={closeModal} title="" description="" price={0} />
      <TitleSuggestionsModal visible={activeModal === 'title-suggestions'} onClose={closeModal} topic="" type="webinar" />

      {/* New modals */}
      <CourseMetaModal visible={activeModal === 'course-meta'} onClose={closeModal} />
      <WebinarDescribeModal visible={activeModal === 'webinar-describe'} onClose={closeModal} />
      <EnhanceTextModal visible={activeModal === 'webinar-enhance'} onClose={closeModal} endpoint="/ai/webinar/enhance" label="Webinar Enhancer" />
      <ExpertBioModal visible={activeModal === 'expert-bio'} onClose={closeModal} />
      <EnhanceTextModal visible={activeModal === 'session-enhance'} onClose={closeModal} endpoint="/ai/session/enhance" label="Session Enhancer" />
      <ModerateModal visible={activeModal === 'moderate'} onClose={closeModal} />
      <LessonSummaryModal visible={activeModal === 'lesson-summary'} onClose={closeModal} />
    </View>
  );
};

export default AskManchlyAI;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(40),
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  iconButton: {
    padding: wp(6),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(6),
    right: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.gold,
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: -0.5,
  },

  // Hero Header
  badgeRow: {
    marginTop: hp(20),
    marginBottom: hp(10),
  },
  badgeText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: fp(26),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  heroSubtitle: {
    fontSize: fp(13),
    color: colors.textSecondary,
    lineHeight: fp(19),
    marginBottom: hp(20),
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: wp(14),
    height: hp(48),
    marginBottom: hp(20),
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fp(14),
  },
  searchIconBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(8),
  },

  // Tool Card
  toolCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: wp(14),
    marginBottom: hp(10),
  },
  toolIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    marginTop: hp(2),
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(4),
  },
  toolDescription: {
    fontSize: fp(12),
    color: colors.textSecondary,
    lineHeight: fp(17),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(40),
  },
  emptyStateText: {
    fontSize: fp(14),
    color: colors.textMuted,
    textAlign: 'center',
  },
});
