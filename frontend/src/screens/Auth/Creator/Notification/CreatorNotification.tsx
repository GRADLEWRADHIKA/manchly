import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  Bell,
  BellRing,
  Megaphone,
  Sparkles,
  Clock,
  Rocket,
  MessageCircle,
  TrendingUp,
} from 'lucide-react-native';

const DARK_CARD = '#1c1c1e';
const DARK_BORDER = '#2c2c2e';

const CreatorNotification = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Notifications" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming Soon Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <BellRing size={wp(38)} color="#3B82F6" />
            </View>
            <View style={styles.floatingBadge1}>
              <Sparkles size={wp(14)} color="#FBBF24" />
            </View>
            <View style={styles.floatingBadge2}>
              <Megaphone size={wp(14)} color="#EC4899" />
            </View>
          </View>

          <Text style={styles.heroTitle}>Notifications Coming Soon</Text>
          <Text style={styles.heroDesc}>
            We're building a smart notification system to keep you updated on
            everything that matters for your creator journey.
          </Text>
        </View>

        {/* What to Expect */}
        <Text style={styles.sectionTitle}>What to expect</Text>

        <View style={styles.featureList}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#3B82F620' }]}>
              <TrendingUp size={wp(20)} color="#3B82F6" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Sales & Revenue Alerts</Text>
              <Text style={styles.featureDesc}>
                Get notified instantly when someone purchases your course or
                webinar.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
              <MessageCircle size={wp(20)} color="#10B981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Student Interactions</Text>
              <Text style={styles.featureDesc}>
                Know when students ask questions or leave reviews on your
                content.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#F59E0B20' }]}>
              <Clock size={wp(20)} color="#F59E0B" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Webinar Reminders</Text>
              <Text style={styles.featureDesc}>
                Automatic reminders before your scheduled webinars go live.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#EC489920' }]}>
              <Rocket size={wp(20)} color="#EC4899" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Platform Updates</Text>
              <Text style={styles.featureDesc}>
                Stay informed about new features and tools to grow your
                audience.
              </Text>
            </View>
          </View>
        </View>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Bell size={wp(18)} color="#3B82F6" />
          <Text style={styles.statusText}>
            This feature is under development. We'll notify you as soon as it's
            ready!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorNotification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: wp(24),
    paddingTop: hp(32),
    paddingBottom: hp(24),
  },
  iconCircleOuter: {
    position: 'relative',
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.cCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  iconCircleInner: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  floatingBadge1: {
    position: 'absolute',
    top: hp(2),
    right: -wp(4),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floatingBadge2: {
    position: 'absolute',
    bottom: hp(2),
    left: -wp(4),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroTitle: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.cText,
    textAlign: 'center',
    marginBottom: hp(8),
  },
  heroDesc: {
    fontSize: fp(14),
    color: colors.cTextSecondary,
    textAlign: 'center',
    lineHeight: fp(21),
    paddingHorizontal: wp(8),
  },

  // Section
  sectionTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.cText,
    marginHorizontal: wp(16),
    marginTop: hp(8),
    marginBottom: hp(12),
  },

  // Feature cards
  featureList: {
    paddingHorizontal: wp(16),
    gap: hp(10),
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cCard,
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
    padding: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  featureIcon: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.cText,
  },
  featureDesc: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    marginTop: hp(2),
    lineHeight: fp(17),
  },

  // Status Banner
  statusBanner: {
    marginHorizontal: wp(16),
    marginTop: hp(20),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cAccentMuted,
    borderRadius: wp(12),
    padding: wp(14),
    gap: wp(10),
    borderWidth: 1,
    borderColor: colors.cAccent + '30',
  },
  statusText: {
    flex: 1,
    fontSize: fp(13),
    color: colors.cAccentLight,
    lineHeight: fp(18),
    fontWeight: '500',
  },
});
