import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Play,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  BellDot,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserIcon from './component/UserIcon';
import Toast from 'react-native-toast-message';
import DashboardCard from './component/DashboardCard';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const quickStats = [
    {
      label: 'Active Courses',
      value: '0',
      icon: <BookOpen size={wp(26)} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '0',
      icon: <Users size={wp(26)} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '0%',
      icon: <Award size={wp(26)} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹0',
      icon: <TrendingUp size={wp(26)} color={colors.golden} />,
    },
  ];

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />

      <View
        style={[
          styles.mainHeader,
          { paddingTop: insets.top + hp(10), backgroundColor: colors.primary },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#dcdcdc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBg}
        >
          <View style={styles.headerContent}>
            <View style={styles.mainHead}>
              {user?.profile_image ? (
                <Image
                  source={{ uri: user?.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <UserIcon />
              )}

              <View>
                <Text style={styles.secPara}>
                  Hi,{' '}
                  {user?.name
                    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                    : 'User'}{' '}
                  👋
                </Text>
                <Text style={styles.firstPara}>Welcome back</Text>
              </View>
            </View>

            <BellDot size={wp(22)} color={colors.primary} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {user?.kyc_verified ? (
          <>
            <Text style={styles.sectionTitle}>Dashboard</Text>

            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <DashboardCard
                  key={index}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </View>
          </>
        ) : (
          <KycCard />
        )}

        <View style={styles.actionsSection}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRight]}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateWebinar');
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'KYC Required',
                    text2: 'Please complete your KYC first',
                    position: 'top',
                  });
                }
              }}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Play size={wp(24)} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Start Live</Text>
              <Text style={styles.actionSubtitle}>Go live instantly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateCourse');
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'KYC Required',
                    text2: 'Please complete your KYC first',
                    position: 'top',
                  });
                }
              }}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.secondary}20` },
                ]}
              >
                <BookOpen size={wp(24)} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>Create Course</Text>
              <Text style={styles.actionSubtitle}>Build new content</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.withdrawCard}>
          <View>
            <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
            <Text style={styles.withdrawAmount}>₹ *****</Text>
          </View>

          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hp(30) }} />
      </ScrollView>
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mainHeader: {
    width: '100%',
  },

  headerBg: {
    paddingVertical: hp(12),
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    alignItems: 'center',
  },

  mainHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },

  avatar: {
    width: wp(54),
    height: hp(54),
    borderRadius: wp(27),
    backgroundColor: colors.primary,
  },

  secPara: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.primary,
  },

  firstPara: {
    fontSize: fp(13),
    color: colors.primary,
  },

  sectionTitle: {
    fontSize: fp(22),
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: hp(20),
    color: colors.text,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
  },

  statCard: {
    width: '48%',
    borderRadius: wp(20),
    paddingVertical: hp(22),
    marginBottom: hp(16),
    alignItems: 'center',
    elevation: 6,
  },

  iconWrapper: {
    width: wp(50),
    height: hp(50),
    borderRadius: wp(26),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
    elevation: 3,
  },

  statValue: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.text,
  },

  statLabel: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(4),
  },

  actionsSection: {
    padding: wp(16),
  },

  actionsGrid: {
    flexDirection: 'row',
  },

  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: wp(18),
    padding: wp(20),
    alignItems: 'center',
    elevation: 4,
  },

  actionCardRight: {
    marginRight: wp(12),
  },

  actionIcon: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },

  actionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
  },

  actionSubtitle: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },

  withdrawCard: {
    marginHorizontal: wp(16),
    marginTop: hp(10),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
  },

  withdrawLabel: {
    color: colors.primary,
    fontWeight: '700',
  },

  withdrawAmount: {
    color: colors.primary,
    fontSize: fp(18),
    fontWeight: '900',
    marginTop: hp(2),
  },

  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: wp(18),
    paddingVertical: hp(8),
    borderRadius: wp(10),
  },

  withdrawBtnText: {
    color: colors.white,
    fontWeight: '800',
  },
});
