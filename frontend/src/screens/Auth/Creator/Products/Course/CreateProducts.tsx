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
  ImagePlus,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const HORIZONTAL_PAD = wp(16);

const CreateProducts = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.faaAiBg, colors.faaAiCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerWrapper, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLogoWrap}>
            <BrainCircuit size={wp(22)} color={colors.faaAiPrimary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Faah-AI</Text>
            <Text style={styles.headerSub}>Your AI Creator Assistant</Text>
          </View>
        </View>
        <View style={styles.headerAccentLine} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Coming Soon Banner */}
        <View style={styles.aiBannerSection}>
          <LinearGradient
            colors={[colors.faaAiBg, colors.faaAiCard, '#0F3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiBanner}
          >
            <View style={styles.aiBannerGlow} />

            <View style={styles.aiBannerHeader}>
              <View style={styles.aiComingSoonBadge}>
                <Sparkles size={wp(12)} color={colors.faaAiPrimary} />
                <Text style={styles.aiComingSoonText}>COMING SOON</Text>
              </View>
            </View>

            <View style={styles.aiBannerContent}>
              <View style={styles.aiBotIconWrap}>
                <BrainCircuit size={wp(40)} color={colors.faaAiPrimary} />
              </View>
              <Text style={styles.aiBannerTitle}>
                AI-Powered{'\n'}Creator
              </Text>
              <Text style={styles.aiBannerSubtitle}>
                We're building something incredible. Generate stunning thumbnails, course descriptions, and more — all powered by AI.
              </Text>
            </View>

            <View style={styles.aiStatsRow}>
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>10x</Text>
                <Text style={styles.aiStatLabel}>Faster</Text>
              </View>
              <View style={styles.aiStatDivider} />
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>AI</Text>
                <Text style={styles.aiStatLabel}>Powered</Text>
              </View>
              <View style={styles.aiStatDivider} />
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>0</Text>
                <Text style={styles.aiStatLabel}>Effort</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* AI Features */}
        <Text style={styles.aiFeaturesTitle}>What Faa-AI will do for you</Text>

        <View style={styles.aiFeatureCard}>
          <LinearGradient
            colors={[colors.faaAiBg, colors.faaAiCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiFeatureInner}
          >
            <View style={styles.aiFeatureIconWrap}>
              <ImagePlus size={wp(22)} color={colors.faaAiPrimary} />
            </View>
            <View style={styles.aiFeatureContent}>
              <Text style={styles.aiFeatureLabel}>AI Thumbnail Generator</Text>
              <Text style={styles.aiFeatureDesc}>
                Create eye-catching thumbnails instantly. Just enter your topic and let AI design it.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.aiFeatureCard}>
          <LinearGradient
            colors={[colors.faaAiBg, '#1E3A5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiFeatureInner}
          >
            <View style={styles.aiFeatureIconWrap}>
              <FileText size={wp(22)} color={colors.faaAiBlue} />
            </View>
            <View style={styles.aiFeatureContent}>
              <Text style={styles.aiFeatureLabel}>AI Description Writer</Text>
              <Text style={styles.aiFeatureDesc}>
                Auto-generate compelling course descriptions that attract students and boost sales.
              </Text>
            </View>
          </LinearGradient>
        </View>
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
  aiBannerSection: {},
  aiBanner: {
    borderRadius: wp(24),
    padding: wp(24),
    overflow: 'hidden',
  },
  aiBannerGlow: {
    position: 'absolute',
    top: -wp(40),
    right: -wp(40),
    width: wp(160),
    height: wp(160),
    borderRadius: wp(80),
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  aiBannerHeader: {
    alignItems: 'flex-start',
    marginBottom: hp(20),
  },
  aiComingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: wp(14),
    paddingVertical: hp(6),
    borderRadius: wp(20),
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  aiComingSoonText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.faaAiPrimary,
    letterSpacing: 1.5,
  },
  aiBannerContent: {
    alignItems: 'center',
    marginBottom: hp(24),
  },
  aiBotIconWrap: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  aiBannerTitle: {
    fontSize: fp(28),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: fp(34),
    marginBottom: hp(10),
  },
  aiBannerSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: fp(20),
    paddingHorizontal: wp(8),
  },
  aiStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: wp(16),
    paddingVertical: hp(16),
  },
  aiStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  aiStatValue: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.faaAiPrimary,
  },
  aiStatLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: hp(2),
  },
  aiStatDivider: {
    width: 1,
    height: hp(32),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // AI Features
  aiFeaturesTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.heading,
    marginTop: hp(24),
    marginBottom: hp(14),
  },
  aiFeatureCard: {
    marginBottom: hp(10),
    borderRadius: wp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  aiFeatureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(16),
    padding: wp(16),
  },
  aiFeatureIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  aiFeatureContent: {
    flex: 1,
  },
  aiFeatureLabel: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  aiFeatureDesc: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: fp(17),
  },
});
