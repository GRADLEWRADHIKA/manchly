import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { instance } from '../../../utils/AxiosInstance';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const fmt = (n: number) => {
  const val = Math.round(n * 100) / 100;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const Earnings = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, bankRes] = await Promise.all([
        instance.get('settlements/wallet').catch(() => null),
        instance.get('settlements/bank-account').catch(() => null),
      ]);
      setWalletData(walletRes?.data?.data?.wallet || null);
      setBankAccount(bankRes?.data?.data?.bankAccount || null);
      setTransactions(walletRes?.data?.data?.transactions || []);
    } catch (err) {
      console.log('Earnings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Earnings" />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.info} />
        </View>
      </View>
    );
  }

  const availableBalance = walletData?.available_balance || 0;
  const totalEarnings = walletData?.total_net_earnings || 0;
  const pendingSettlement = walletData?.pending_settlement || 0;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Earnings" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Withdrawable Balance</Text>
              <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                {fmt(availableBalance)}
              </Text>
            </View>
            <View style={styles.walletIconWrap}>
              <Wallet size={wp(24)} color={colors.white} />
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              availableBalance <= 0 && styles.withdrawDisabled,
            ]}
            disabled={availableBalance <= 0}
            onPress={() => navigation.navigate('WalletScreen')}>
            <Text style={styles.withdrawText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp size={wp(18)} color={colors.accent} />
            <Text style={styles.statValue}>{fmt(totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={wp(18)} color={colors.secondary} />
            <Text style={styles.statValue}>{fmt(pendingSettlement)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Bank Account */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
        </View>
        {bankAccount ? (
          <View style={styles.bankCard}>
            <View style={styles.bankIconWrap}>
              <CreditCard size={wp(20)} color={colors.info} />
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankName}>
                {bankAccount.bank_name || 'Bank Account'}
              </Text>
              <Text style={styles.bankNumber}>
                ••••{bankAccount.account_number?.slice(-4)}
              </Text>
              <Text style={styles.bankIfsc}>{bankAccount.ifsc_code}</Text>
            </View>
            {bankAccount.is_verified ? (
              <CheckCircle size={wp(18)} color={colors.accent} />
            ) : (
              <AlertCircle size={wp(18)} color={colors.secondary} />
            )}
          </View>
        ) : (
          <View style={styles.emptyBankCard}>
            <CreditCard size={wp(40)} color={colors.muted} />
            <Text style={styles.emptyBankText}>No bank account added</Text>
            <TouchableOpacity
              style={styles.addBankButton}
              onPress={() => navigation.navigate('BankAccountScreen')}>
              <Text style={styles.addBankText}>ADD BANK DETAILS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        {transactions.length > 0 ? (
          transactions.slice(0, 10).map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor:
                      tx.type === 'CREDIT' ? '#DCFCE7' : '#FEE2E2',
                  },
                ]}>
                {tx.type === 'CREDIT' ? (
                  <ArrowDownLeft size={wp(16)} color={colors.accent} />
                ) : (
                  <ArrowUpRight size={wp(16)} color={colors.error} />
                )}
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {tx.title}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === 'CREDIT' ? colors.accent : colors.error },
                ]}>
                {tx.type === 'CREDIT' ? '+' : '-'}
                {fmt(tx.net_amount)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyTx}>
            <Text style={styles.emptyTxText}>No transactions yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Earnings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: wp(16),
    paddingBottom: hp(40),
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(16),
    padding: wp(20),
    marginBottom: hp(16),
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  balanceLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: hp(4),
  },
  balanceAmount: {
    fontSize: fp(32),
    fontWeight: '800',
    color: colors.white,
  },
  walletIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawButton: {
    backgroundColor: colors.white,
    borderRadius: wp(10),
    paddingVertical: hp(12),
    alignItems: 'center',
  },
  withdrawDisabled: {
    opacity: 0.5,
  },
  withdrawText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(16),
    alignItems: 'center',
    gap: hp(6),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: hp(10),
  },
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(16),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bankIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.text,
  },
  bankNumber: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  bankIfsc: {
    fontSize: fp(11),
    color: colors.muted,
    marginTop: hp(1),
  },
  emptyBankCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(24),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: hp(10),
  },
  emptyBankText: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  addBankButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: wp(10),
    paddingVertical: hp(10),
    paddingHorizontal: wp(20),
  },
  addBankText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fp(13),
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  txIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  txDate: {
    fontSize: fp(11),
    color: colors.muted,
    marginTop: hp(2),
  },
  txAmount: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  emptyTx: {
    alignItems: 'center',
    padding: wp(24),
    backgroundColor: colors.white,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTxText: {
    fontSize: fp(14),
    color: colors.muted,
  },
});
