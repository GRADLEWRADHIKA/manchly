import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Wallet,
  TrendingUp,
  Users,
  IndianRupee,
  BookOpen,
  Presentation,
  ArrowDownToLine,
  History,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';

const WalletCreator = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="My Wallet" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={[colors.primary, '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconWrap}>
                <Wallet size={wp(20)} color={colors.white} />
              </View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>₹ *****</Text>
            <Text style={styles.balanceHint}>
              Tap withdraw to transfer to bank
            </Text>

            <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8}>
              <ArrowDownToLine size={wp(16)} color={colors.primary} />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Earnings Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <TrendingUp size={wp(18)} color={colors.info} />
            </View>
            <Text style={styles.statValue}>₹ ****</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Users size={wp(18)} color={colors.golden} />
            </View>
            <Text style={styles.statValue}>****</Text>
            <Text style={styles.statLabel}>Total Buyers</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <BookOpen size={wp(18)} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>₹ ****</Text>
            <Text style={styles.statLabel}>Course Income</Text>
          </View>
1
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FDF2F8' }]}>
              <Presentation size={wp(18)} color={colors.secondary} />
            </View>
            <Text style={styles.statValue}>₹ ****</Text>
            <Text style={styles.statLabel}>Webinar Income</Text>
          </View>
        </View>

        <View style={styles.txHeader}>
          <View style={styles.txHeaderLeft}>
            <Text style={styles.sectionTitleOne}>Recent Transactions</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txSection}>
          <View style={styles.txEmptyCard}>
            <IndianRupee size={wp(32)} color={colors.muted} />
            <Text style={styles.txEmptyTitle}>No transactions yet</Text>
            <Text style={styles.txEmptyDesc}>
              Your earnings from courses and webinars will appear here
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>
          Quick Actions
        </Text>
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <IndianRupee size={wp(18)} color={colors.info} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Payment Settings</Text>
              <Text style={styles.actionDesc}>Manage bank account & UPI</Text>
            </View>
          </View>
          <ChevronRight size={wp(18)} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <History size={wp(18)} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Transaction History</Text>
              <Text style={styles.actionDesc}>View all past transactions</Text>
            </View>
          </View>
          <ChevronRight size={wp(18)} color={colors.muted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default WalletCreator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: hp(30),
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(20),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  balanceGradient: {
    padding: wp(20),
    paddingBottom: wp(16),
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  balanceIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(10),
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fp(14),
    fontWeight: '500',
  },
  balanceAmount: {
    color: colors.white,
    fontSize: fp(32),
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: hp(4),
  },
  balanceHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fp(12),
    marginBottom: hp(16),
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: hp(12),
    borderRadius: wp(12),
    gap: wp(8),
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.primary,
    fontSize: fp(15),
  },

  // Section
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: wp(16),
    marginTop: hp(24),
    marginBottom: hp(12),
  },

  sectionTitleOne: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginVertical: hp(15),
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(12),
    gap: wp(10),
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.text,
    marginBottom: hp(2),
  },
  statLabel: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Transactions
  txSection: {
    marginTop: hp(4),
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(15),
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: colors.info,
    fontSize: fp(13),
    fontWeight: '600',
  },
  txEmptyCard: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    padding: wp(24),
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  txEmptyTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    marginTop: hp(10),
  },
  txEmptyDesc: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: hp(4),
    lineHeight: fp(18),
  },

  // Quick Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    marginBottom: hp(10),
    padding: wp(14),
    borderRadius: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  actionIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  actionDesc: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(1),
  },
});
