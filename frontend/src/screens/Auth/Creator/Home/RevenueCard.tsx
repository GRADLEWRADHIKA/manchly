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

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.sectionPadding}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueHeader}>
          <View>
            <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
            <Text style={styles.revenueAmount}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              {walletLoading ? '...' : `${formatAmount(totalRevenueAmount)}`}
            </Text>
          </View>
          <View style={styles.growingBadge}>
            <TrendingUp size={wp(14)} color={colors.white} />
            <Text style={styles.growingText}>Growing</Text>
          </View>
        </View>

        <View style={styles.revenueDivider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <BookOpen size={wp(14)} color={colors.white} />
            </View>
            <Text style={styles.statValue}>
              {creatorStats?.statistics?.courses_sold ?? 0}
            </Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Users size={wp(14)} color={colors.white} />
            </View>
            <Text style={styles.statValue}>
              {creatorStats?.statistics?.total_enrollments ?? 0}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Award size={wp(14)} color={colors.white} />
            </View>
            <Text style={styles.statValue}>
              {creatorWebinarStats?.statistics?.webinars_sold ?? 0}
            </Text>
            <Text style={styles.statLabel}>Webinars</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Phone size={wp(14)} color={colors.white} />
            </View>
            <Text style={styles.statValue}>
              {sessionStats?.total_sessions ?? 0}
            </Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default memo(RevenueCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  revenueCard: {
    borderRadius: wp(16),
    padding: wp(16),
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginBottom: hp(2),
  },
  growingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },
  growingText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.white,
  },
  revenueAmount: {
    fontSize: fp(28),
    fontWeight: '800',
    color: colors.white,
  },
  rupeeSymbol: {
    fontSize: fp(18),
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: hp(10),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrap: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  statValue: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(2),
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: hp(40),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
