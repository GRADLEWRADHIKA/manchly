import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Sparkles,
  ArrowLeft,
  Search,
  FileText,
  HelpCircle,
  Share2,
  Mail,
  ClipboardCheck,
  Lightbulb,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const HORIZONTAL_PAD = wp(16);

const AI_FEATURES = [
  {
    icon: FileText,
    label: 'AI Lesson Script Writer',
    desc: 'Generate full lesson scripts with key points, examples, and speaker notes.',
    color: '#A78BFA',
  },
  {
    icon: HelpCircle,
    label: 'AI Quiz Generator',
    desc: 'Create quizzes from your lesson content with multiple-choice questions and explanations.',
    color: '#F472B6',
  },
  {
    icon: Share2,
    label: 'AI Social Posts',
    desc: 'Generate ready-to-post content for Twitter, LinkedIn, Instagram & WhatsApp.',
    color: '#34D399',
  },
  {
    icon: Mail,
    label: 'AI Email Series',
    desc: 'Auto-generate confirmation, reminder, and post-event email sequences.',
    color: '#FBBF24',
  },
  {
    icon: ClipboardCheck,
    label: 'AI Session Prep',
    desc: 'Get a prep checklist, questions to ask, potential directions & red flags before sessions.',
    color: '#FB923C',
  },
  {
    icon: Lightbulb,
    label: 'AI Product Suggestions',
    desc: 'Get AI-powered ideas for new courses, webinars, and sessions based on your expertise.',
    color: '#2DD4BF',
  },
  {
    icon: Sparkles,
    label: 'AI Content Enhancer',
    desc: 'Improve your existing descriptions and content with AI-powered suggestions.',
    color: '#E879F9',
  },
  {
    icon: FileText,
    label: 'AI Landing Copy',
    desc: 'Generate compelling landing page copy that converts visitors into students.',
    color: '#38BDF8',
  },
];

const CreateProducts = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={wp(20)} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manchly AI</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Sparkles size={wp(12)} color={colors.golden} />
            <Text style={styles.heroBadgeText}>CREATIVE INTELLIGENCE</Text>
          </View>
          <Text style={styles.heroTitle}>Ask Manchly AI</Text>
          <Text style={styles.heroSubtitle}>
            Ask Manchly AI to generate content, analyze data, or organize your
            workflow.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a tool or task..."
            placeholderTextColor="rgba(255,255,255,0.35)"
          />
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
            <Search size={wp(18)} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* AI Tool Cards */}
        <View style={styles.toolListSection}>
          <TouchableOpacity style={styles.toolCard} activeOpacity={0.85}>
            <View style={styles.toolIconWrap}>
              <FileText size={wp(20)} color={colors.golden} />
            </View>
            <Text style={styles.toolTitle}>Lesson Script Writer</Text>
            <Text style={styles.toolDesc}>
              Turn your topic into a structured, ready-to-record lesson
              script.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} activeOpacity={0.85}>
            <View style={styles.toolIconWrap}>
              <HelpCircle size={wp(20)} color={colors.golden} />
            </View>
            <Text style={styles.toolTitle}>Quiz Generator</Text>
            <Text style={styles.toolDesc}>
              Instantly create quizzes from your course content to test
              student understanding.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} activeOpacity={0.85}>
            <View style={styles.toolIconWrap}>
              <Share2 size={wp(20)} color={colors.golden} />
            </View>
            <Text style={styles.toolTitle}>Social Posts</Text>
            <Text style={styles.toolDesc}>
              Generate ready-to-share captions and posts to promote your
              courses.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} activeOpacity={0.85}>
            <View style={styles.toolIconWrap}>
              <Mail size={wp(20)} color={colors.golden} />
            </View>
            <Text style={styles.toolTitle}>Email Series</Text>
            <Text style={styles.toolDesc}>
              Draft a multi-part email sequence to nurture and convert your
              leads.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(14),
  },
  backBtn: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
  },
  headerSpacer: {
    width: wp(38),
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: hp(12),
    paddingBottom: hp(40),
  },

  // Hero
  heroSection: {
    marginBottom: hp(20),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(6),
    marginBottom: hp(12),
  },
  heroBadgeText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.golden,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: fp(30),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(10),
  },
  heroSubtitle: {
    fontSize: fp(13.5),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: fp(20),
  },

  // Search bar
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(24),
  },
  searchInput: {
    flex: 1,
    height: hp(50),
    backgroundColor: '#14141F',
    borderRadius: wp(14),
    paddingHorizontal: wp(16),
    fontSize: fp(14),
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchBtn: {
    width: wp(50),
    height: hp(50),
    borderRadius: wp(14),
    backgroundColor: colors.golden,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tool list
  toolListSection: {
    gap: hp(12),
  },
  toolCard: {
    backgroundColor: '#151515',
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  toolIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,182,6,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  toolTitle: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  toolDesc: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: fp(17),
  },
});