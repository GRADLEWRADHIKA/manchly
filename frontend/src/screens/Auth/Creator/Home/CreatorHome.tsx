import React, { useState } from 'react';
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
  DollarSign,
  BellDot,
  IndianRupee,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import KycCard from './KeyCard';
import AppHeader from '../../../../components/AppHeader';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../../theme/theme';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const [active, setActive] = useState(true);
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const quickStats = [
    {
      label: 'Active Courses',
      value: '12',
      icon: <BookOpen size={24} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '5.2K',
      icon: <Users size={24} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '94%',
      icon: <Award size={24} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹12.5K',
      icon: <TrendingUp size={24} color={colors.golden} />,
    },
  ];

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />

      <View
        style={[
          styles.mainHeader,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <View style={styles.mainHead}>
          <View>
            <Image
              source={{ uri: user?.profile_image }}
              style={styles.avatar}
            />
          </View>
          <View>
            <Text style={styles.firstPara}>Hello,</Text>
            <Text style={styles.secPara}>{user?.name}</Text>
          </View>
        </View>
        <View>
          <BellDot width={22} height={22} color={colors.white} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        {/* <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            A Manch for every Creator...
          </Text>
        </View> */}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.statsGrid}>
            {active ? (
              <KycCard />
            ) : (
              quickStats?.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={styles.statIcon}>{stat?.icon}</View>
                  <Text style={styles.statValue}>{stat?.value}</Text>
                  <Text style={styles.statLabel}>{stat?.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          {/* <Text style={styles.sectionTitle}>Quick Actions</Text> */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRight]}
              onPress={() => {
                Toast.show({
                  type: 'info',
                  text1: 'Feature Coming Soon 🚀',
                  text2: 'This feature is currently under development.',
                  position: 'top',
                });
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
              onPress={() => navigation.navigate('CreateCourse')}
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
          <View style={styles.withdrawLeft}>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>₹ *****</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  mainHead: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  firstPara: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '400',
  },
  secPara: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  welcomeSection: {
    padding: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    // fontWeight: '200',
    marginBottom: 25,
    color: colors.text,
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
    // Shadow for iOS
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Shadow for Android
    elevation: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Shadow for Android
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
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  withdrawCard: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    elevation: 5,
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  withdrawLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  withdrawAmount: {
    color: colors.primary,
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.white,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.lightGrey,
    marginRight: 12,
  },
});
