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
import KycCard from './KeyCard';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserIcon from './component/UserIcon';
import Toast from 'react-native-toast-message';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const quickStats = [
    {
      label: 'Active Courses',
      value: '0',
      icon: <BookOpen size={26} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '0',
      icon: <Users size={26} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '0%',
      icon: <Award size={26} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹0',
      icon: <TrendingUp size={26} color={colors.golden} />,
    },
  ];

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />

      <View
        style={[
          styles.mainHeader,
          { paddingTop: insets.top + 10, backgroundColor: colors.primary },
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
                    ? user.name.charAt(0).toUpperCase() +
                    user.name.slice(1)
                    : 'User'}{' '}
                  👋
                </Text>
                <Text style={styles.firstPara}>Welcome back</Text>
              </View>
            </View>

            <BellDot size={22} color={colors.primary} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {user?.kyc_verified ? (
          <>
            <Text style={styles.sectionTitle}>Dashboard</Text>

            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <LinearGradient
                  key={index}
                  colors={['#ffffff', '#f4f6f8']}
                  style={styles.statCard}
                >
                  <View>
                    {stat?.icon}
                  </View>

                  <Text style={styles.statValue}>
                    {stat?.value}
                  </Text>

                  <Text style={styles.statLabel}>
                    {stat?.label}
                  </Text>
                </LinearGradient>
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
                <Play size={24} color={colors.primary} />
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
                <BookOpen size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>Create Course</Text>
              <Text style={styles.actionSubtitle}>Build new content</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.withdrawCard}>
          <View>
            <Text style={styles.withdrawLabel}>
              Withdrawable Balance
            </Text>
            <Text style={styles.withdrawAmount}>₹ *****</Text>
          </View>

          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
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
    paddingVertical: 12,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  mainHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
  },

  secPara: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  firstPara: {
    fontSize: 13,
    color: colors.primary,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 20,
    color: colors.text,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  statCard: {
    width: '48%',
    borderRadius: 20,
    paddingVertical: 22,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 6,
  },

  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  actionsSection: {
    padding: 16,
  },

  actionsGrid: {
    flexDirection: 'row',
  },

  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
  },

  actionCardRight: {
    marginRight: 12,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  withdrawCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
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
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },

  withdrawBtnText: {
    color: colors.white,
    fontWeight: '800',
  },
});
