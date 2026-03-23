import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  MessageCircle,
  Search,
  Send,
  Users,
  Sparkles,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const CreatorChat = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Chats</Text>
            <TouchableOpacity style={styles.searchBtn}>
              <Search size={wp(20)} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Coming Soon Content */}
      <View style={styles.content}>
        {/* Illustration area */}
        <View style={styles.illustrationWrap}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <MessageCircle size={wp(40)} color={colors.primary} />
            </View>
          </View>
          <View style={styles.floatingBadge1}>
            <Send size={wp(14)} color={colors.info} />
          </View>
          <View style={styles.floatingBadge2}>
            <Sparkles size={wp(14)} color={colors.golden} />
          </View>
        </View>

        <Text style={styles.comingTitle}>Chat is Coming Soon</Text>
        <Text style={styles.comingDesc}>
          Connect directly with your students, answer questions, and build your
          community — all within the app.
        </Text>

        {/* Feature preview cards */}
        <View style={styles.featureList}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#EEF2FF' }]}>
              <MessageCircle size={wp(18)} color={colors.info} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Direct Messaging</Text>
              <Text style={styles.featureDesc}>
                1-on-1 chat with your enrolled students
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#ECFDF5' }]}>
              <Users size={wp(18)} color={colors.accent} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Group Discussions</Text>
              <Text style={styles.featureDesc}>
                Create course-specific group chats
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
              <Send size={wp(18)} color={colors.golden} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Broadcast Updates</Text>
              <Text style={styles.featureDesc}>
                Send announcements to all your students
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CreatorChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerWrapper: {
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: wp(20),
    paddingVertical: hp(14),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.primary,
  },
  searchBtn: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(24),
    paddingTop: hp(36),
  },

  // Illustration
  illustrationWrap: {
    position: 'relative',
    marginBottom: hp(24),
  },
  iconCircleOuter: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  floatingBadge1: {
    position: 'absolute',
    top: hp(2),
    right: -wp(6),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.white,
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
    left: -wp(6),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  comingTitle: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: hp(8),
  },
  comingDesc: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(28),
    paddingHorizontal: wp(8),
  },

  // Feature cards
  featureList: {
    width: '100%',
    gap: hp(10),
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  featureIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
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
    color: colors.text,
  },
  featureDesc: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
});
