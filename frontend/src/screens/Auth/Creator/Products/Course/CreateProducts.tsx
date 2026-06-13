import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Sparkles,
  BrainCircuit,
  FileText,
  Share2,
  Mail,
  Lightbulb,
  ClipboardCheck,
  HelpCircle,
  Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerWrapper, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLogoWrap}>
            <BrainCircuit size={wp(22)} color={colors.faaAiPrimary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Manchly-AI</Text>
            <Text style={styles.headerSub}>Your AI Creator Assistant</Text>
          </View>
        </View>
        <View style={styles.headerAccentLine} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroGlow} />

          <View style={styles.heroBadge}>
            <Zap size={wp(12)} color={colors.faaAiPrimary} fill={colors.faaAiPrimary} />
            <Text style={styles.heroBadgeText}>LIVE</Text>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBotIcon}>
              <BrainCircuit size={wp(28)} color={colors.faaAiPrimary} />
            </View>
            <Text style={styles.heroTitle}>
              AI-Powered{'\n'}Creator Tools
            </Text>
            <Text style={styles.heroSubtitle}>
              8 AI features to help you create courses, prep for sessions, and grow your audience — all built in.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>AI Tools</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Live</Text>
              <Text style={styles.statLabel}>& Ready</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Effort</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Features List */}
        <Text style={styles.featuresTitle}>What Manchly-AI does for you</Text>

        {AI_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={['#1A1A2E', '#16213E', '#0F3460']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.featureInner}
              >
                <View style={[styles.featureIconWrap, { backgroundColor: feature.color + '20' }]}>
                  <Icon size={wp(20)} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CreateProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerWrapper: {
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    gap: wp(12),
  },
  headerLogoWrap: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  headerSub: {
    fontSize: fp(11),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(1),
  },
  headerAccentLine: {
    height: 2,
    marginHorizontal: wp(16),
    marginBottom: hp(4),
    borderRadius: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: hp(20),
    paddingBottom: hp(40),
  },

  // Hero Banner
  heroBanner: {
    borderRadius: wp(20),
    padding: wp(18),
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -wp(40),
    right: -wp(40),
    width: wp(160),
    height: wp(160),
    borderRadius: wp(80),
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(4),
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: hp(12),
  },
  heroBadgeText: {
    fontSize: fp(9),
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: hp(16),
  },
  heroBotIcon: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  heroTitle: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: fp(28),
    marginBottom: hp(6),
  },
  heroSubtitle: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: fp(17),
    paddingHorizontal: wp(8),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: wp(12),
    paddingVertical: hp(10),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.faaAiPrimary,
  },
  statLabel: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: hp(2),
  },
  statDivider: {
    width: 1,
    height: hp(32),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Features
  featuresTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: hp(24),
    marginBottom: hp(14),
  },
  featureCard: {
    marginBottom: hp(10),
    borderRadius: wp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  featureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(16),
    padding: wp(16),
  },
  featureIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  featureDesc: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: fp(17),
  },
});
