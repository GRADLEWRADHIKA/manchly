import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  TrendingUp,
  BookOpen,
  Users,
  Award,
  Phone,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { getCreatorSales } from '../../../../store/PaymentSlice';
import { getCreatorCourseStats } from '../../../../store/CourseSlice';
import { getCreatorWebinarStats } from '../../../../store/WebinarSlice';
import { getSessionStats } from '../../../../store/SessionSlice';
import { instance } from '../../../../utils/AxiosInstance';

const RevenueCard = () => {
  const dispatch = useDispatch<any>();
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const { stats: sessionStats } = useSelector(
    (state: any) => state.sessionReducer,
  );
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const walletRes = await instance
        .get('settlements/wallet')
        .catch((e: any) => {
          console.log('Wallet API error:', e?.response?.status, e?.response?.data);
          return null;
        });
      setWalletData(walletRes?.data?.data?.wallet || null);
    } catch (error) {
      console.log('Error fetching wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, []),
  );

  useEffect(() => {
    dispatch(getCreatorSales({}));
    dispatch(getCreatorCourseStats());
    dispatch(getCreatorWebinarStats());
    dispatch(getSessionStats());
  }, []);

  const totalRevenueAmount = walletData?.total_net_earnings || 0;
  const totalSessions = sessionStats?.total_sessions ?? 0;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const statsData = [
    {
      icon: <BookOpen size={wp(14)} color={colors.white} />,
      value: creatorStats?.statistics?.courses_sold ?? 0,
      label: 'Courses',
      bgColor: '#16213E',
    },
    {
      icon: <Users size={wp(14)} color={colors.white} />,
      value: creatorStats?.statistics?.total_enrollments ?? 0,
      label: 'Students',
      bgColor: '#16213E',
    },
    {
      icon: <Award size={wp(14)} color={colors.white} />,
      value: creatorWebinarStats?.statistics?.webinars_sold ?? 0,
      label: 'Webinars',
      bgColor: '#16213E',
    },
    {
      icon: <Phone size={wp(14)} color={colors.white} />,
      value: totalSessions,
      label: 'Sessions',
      bgColor: '#16213E',
    },
  ];

  return (
    <View style={styles.sectionPadding}>
      <View style={styles.topRow}>
        {/* Revenue Card */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
          <Text style={styles.revenueAmount}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            {walletLoading ? '...' : formatAmount(totalRevenueAmount)}
          </Text>
          <View style={styles.growingBadge}>
            <TrendingUp size={wp(12)} color={colors.white} />
            <Text style={styles.growingText}>Growing</Text>
          </View>
        </LinearGradient>

        {/* Stats Card - 2x2 grid */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          {[0, 1].map(row => (
            <View key={row} style={styles.statsRow}>
              {statsData.slice(row * 2, row * 2 + 2).map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <View style={styles.statInner}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </View>
              ))}
              {row === 0 && <View style={styles.horizontalDivider} />}
            </View>
          ))}
          <View style={styles.verticalDivider} />
        </LinearGradient>
      </View>
    </View>
  );
};

export default memo(RevenueCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  topRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  revenueCard: {
    flex: 1,
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.cBorder,
    justifyContent: 'space-between',
  },
  revenueLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: hp(8),
  },
  revenueAmount: {
    fontSize: fp(32),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(10),
  },
  rupeeSymbol: {
    fontSize: fp(20),
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  growingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(4),
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },
  growingText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.white,
  },
  statsCard: {
    flex: 1,
    borderRadius: wp(16),
    padding: wp(4),
    borderWidth: 1,
    borderColor: colors.cBorder,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
  },
  statInner: {
    alignItems: 'center',
  },
  horizontalDivider: {
    position: 'absolute',
    bottom: 0,
    left: wp(16),
    right: wp(16),
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verticalDivider: {
    position: 'absolute',
    top: hp(12),
    bottom: hp(12),
    left: '50%' as any,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(2),
    fontWeight: '500',
  },
});
