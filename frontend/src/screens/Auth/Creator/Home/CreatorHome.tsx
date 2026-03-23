import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Play,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Bell,
  UserCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';

const DARK = '#111111';
const DARK_CARD = '#1c1c1e';
const DARK_BORDER = '#2c2c2e';
const DARK_MUTED = '#999999';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const quickStats = [
    {
      label: 'Active Courses',
      value: '0',
      icon: <BookOpen size={wp(20)} color="#60A5FA" />,
      accent: '#60A5FA',
    },
    {
      label: 'Students',
      value: '0',
      icon: <Users size={wp(20)} color="#F472B6" />,
      accent: '#F472B6',
    },
    {
      label: 'Completion',
      value: '0%',
      icon: <Award size={wp(20)} color="#34D399" />,
      accent: '#34D399',
    },
    {
      label: 'Revenue',
      value: '₹0',
      icon: <TrendingUp size={wp(20)} color="#FBBF24" />,
      accent: '#FBBF24',
    },
  ];

  const handleKycGuard = (screen: string) => {
    if (user?.kyc_verified) {
      navigation.navigate(screen);
    } else {
      Toast.show({
        type: 'error',
        text1: 'KYC Required',
        text2: 'Please complete your KYC first',
        position: 'top',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.greetingSub}>Welcome back</Text>
              <Text style={styles.greeting}>{displayName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={wp(20)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KYC or Dashboard */}
        {user?.kyc_verified ? (
          <>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: stat.accent + '15' }]}>
                    {stat.icon}
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <KycCard />
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => handleKycGuard('CreateWebinar')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FF4D4D20' }]}>
              <Play size={wp(22)} color="#FF4D4D" fill="#FF4D4D" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Go Live</Text>
              <Text style={styles.actionDesc}>Start a webinar</Text>
            </View>
            <ChevronRight size={wp(18)} color={DARK_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => handleKycGuard('CreateCourse')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#8B5CF620' }]}>
              <BookOpen size={wp(22)} color="#8B5CF6" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>New Course</Text>
              <Text style={styles.actionDesc}>Create content</Text>
            </View>
            <ChevronRight size={wp(18)} color={DARK_MUTED} />
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Sparkles size={wp(16)} color="#FBBF24" />
          <Text style={styles.tipText}>
            Tip: Creators who go live weekly get 3x more engagement!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  headerWrapper: {
    backgroundColor: DARK,
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
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    borderWidth: 2,
    borderColor: DARK_BORDER,
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: DARK_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK_BORDER,
  },
  greetingSub: {
    fontSize: fp(12),
    color: DARK_MUTED,
    fontWeight: '500',
  },
  greeting: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: DARK_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_BORDER,
  },

  scrollContent: {
    paddingBottom: hp(30),
  },

  // Section
  sectionTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    marginBottom: hp(12),
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    rowGap: hp(10),
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  statValue: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: hp(2),
  },

  // Quick Actions
  actionsRow: {
    paddingHorizontal: wp(16),
    gap: hp(10),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  actionIconWrap: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
  },
  actionDesc: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },

  // Tip
  tipCard: {
    marginHorizontal: wp(16),
    marginTop: hp(20),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9E7',
    borderRadius: wp(12),
    padding: wp(14),
    gap: wp(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: {
    flex: 1,
    fontSize: fp(13),
    color: colors.text,
    lineHeight: fp(18),
    fontWeight: '500',
  },
});
