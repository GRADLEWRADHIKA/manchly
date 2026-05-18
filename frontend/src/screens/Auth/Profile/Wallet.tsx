import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { instance } from '../../../utils/AxiosInstance';
import { useFocusEffect } from '@react-navigation/native';

const fmt = (n: number) => {
  const val = Math.round(n * 100) / 100;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  PENDING_SETTLEMENT: { color: colors.secondary, icon: Clock, label: 'Pending' },
  SETTLED: { color: colors.accent, icon: CheckCircle2, label: 'Settled' },
  FAILED: { color: colors.error, icon: XCircle, label: 'Failed' },
};

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await instance.get('settlements/wallet').catch(() => null);
      setWalletData(res?.data?.data?.wallet || null);
      setTransactions(res?.data?.data?.transactions || []);
    } catch (err) {
      console.log('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Wallet" />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.info} />
        </View>
      </View>
    );
  }

  const balance = walletData?.available_balance || 0;
  const totalEarnings = walletData?.total_net_earnings || 0;
  const pending = walletData?.pending_settlement || 0;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Wallet" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.walletBadge}>
              <WalletIcon size={wp(16)} color={colors.white} />
              <Text style={styles.walletBadgeText}>My Wallet</Text>
            </View>
            <TouchableOpacity onPress={fetchWallet}>
              <RefreshCw size={wp(18)} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(balance)}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ArrowDownLeft size={wp(18)} color={colors.accent} />
            <Text style={styles.statValue}>{fmt(totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={wp(18)} color={colors.secondary} />
            <Text style={styles.statValue}>{fmt(pending)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.length > 0 ? (
          transactions.map((tx: any) => {
            const status = statusConfig[tx.status] || statusConfig.PENDING_SETTLEMENT;
            const StatusIcon = status.icon;
            return (
              <View key={tx.id} style={styles.txCard}>
                <View
                  style={[
                    styles.txIconWrap,
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
                  <View style={styles.txMeta}>
                    <Text style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <View style={[styles.txStatusBadge, { backgroundColor: status.color + '20' }]}>
                      <StatusIcon size={wp(10)} color={status.color} />
                      <Text style={[styles.txStatusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
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
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <WalletIcon size={wp(40)} color={colors.muted} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your earnings will show up here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Wallet;

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
    borderRadius: wp(18),
    padding: wp(22),
    marginBottom: hp(16),
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
  },
  walletBadgeText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.white,
  },
  balanceLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: hp(4),
  },
  balanceAmount: {
    fontSize: fp(36),
    fontWeight: '800',
    color: colors.white,
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
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(12),
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  txIconWrap: {
    width: wp(38),
    height: wp(38),
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
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(3),
  },
  txDate: {
    fontSize: fp(11),
    color: colors.muted,
  },
  txStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  txStatusText: {
    fontSize: fp(9),
    fontWeight: '700',
  },
  txAmount: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(32),
    gap: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fp(13),
    color: colors.muted,
  },
});
