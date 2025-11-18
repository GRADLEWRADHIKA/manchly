// Wallet.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from 'react-native';
import {
  Users,
  CreditCard,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../utils/colors';
import AppHeader from '../../../components/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const initialTransactions = [
  {
    id: 't1',
    type: 'course',
    title: 'React Native Basics',
    buyers: 0,
    amount: 0,
    date: '2025-09-28',
  },
  {
    id: 't2',
    type: 'webinar',
    title: 'Advanced JS Webinar',
    buyers: 0,
    amount: 0,
    date: '2025-09-21',
  },
  {
    id: 't3',
    type: 'course',
    title: 'TypeScript Mastery',
    buyers: 0,
    amount: 0,
    date: '2025-08-13',
  },
  {
    id: 't4',
    type: 'course',
    title: 'UI Patterns',
    buyers: 0,
    amount: 0,
    date: '2025-07-02',
  },
];

const WalletCreator = () => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [withdrawableBalance, setWithdrawableBalance] = useState(
    initialTransactions.reduce((s, t) => s + (t.amount ?? 0), 0),
  );
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const insets = useSafeAreaInsets();

  const totals = useMemo(() => {
    const totalBuyers = transactions.reduce((s, t) => s + (t.buyers ?? 0), 0);
    const totalCourseBuyers = transactions
      .filter(t => t.type === 'course')
      .reduce((s, t) => s + (t.buyers ?? 0), 0);
    const totalWebinarBuyers = transactions
      .filter(t => t.type === 'webinar')
      .reduce((s, t) => s + (t.buyers ?? 0), 0);
    const courseIncome = transactions
      .filter(t => t.type === 'course')
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const webinarIncome = transactions
      .filter(t => t.type === 'webinar')
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const totalIncome = courseIncome + webinarIncome;
    return {
      totalBuyers,
      totalCourseBuyers,
      totalWebinarBuyers,
      courseIncome,
      webinarIncome,
      totalIncome,
    };
  }, [transactions]);

  const handleWithdraw = () => {
    if (withdrawableBalance <= 0) {
      Toast.show({
        type: 'info',
        text1: 'Nothing to withdraw',
        text2: 'Your balance is zero.',
      });
      return;
    }

    setIsWithdrawing(true);

    setTimeout(() => {
      const amount = withdrawableBalance;
      setWithdrawableBalance(0);

      const newTx = {
        id: `w_${Date.now()}`,
        type: 'withdraw',
        title: 'Withdrawal to bank',
        buyers: 0,
        amount: -amount,
        date: new Date().toISOString().slice(0, 10),
      };
      setTransactions(prev => [newTx, ...prev]);

      setIsWithdrawing(false);

      Toast.show({
        type: 'success',
        text1: 'Withdraw successful',
        text2: `₹${amount.toLocaleString()} credited to your bank account.`,
      });
    }, 1500);
  };

  const renderStatCard = (icon, label, value, sub) => (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>****</Text>
      {sub ? <Text style={styles.statSub}>****</Text> : null}
    </View>
  );

  const renderTransaction = ({ item }) => {
    const isWithdraw = item.type === 'withdraw';
    return (
      <View style={styles.txRow}>
        <View style={styles.txLeft}>
          <View
            style={[
              styles.txBadge,
              isWithdraw ? styles.withdrawBadge : styles.incomeBadge,
            ]}
          >
            <Text style={styles.txBadgeText}>
              {isWithdraw ? 'W' : item.type === 'webinar' ? 'WB' : 'C'}
            </Text>
          </View>
        </View>
        <View style={styles.txMiddle}>
          <Text style={styles.txTitle}>{item.title}</Text>
          <Text style={styles.txMeta}>
            {item.buyers
              ? `${item.buyers} buyer${item.buyers > 1 ? 's' : ''} • `
              : ''}
            {item.date}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              isWithdraw ? styles.txAmountNegative : styles.txAmountPositive,
            ]}
          >
            {isWithdraw
              ? `-₹${Math.abs(item.amount).toLocaleString()}`
              : `₹${item.amount.toLocaleString()}`}
          </Text>
          <ArrowUpRight width={14} height={14} color={colors.primary} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* <AppHeader title="My Wallet" /> */}
      <View
        style={[
          styles.mainHeader,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <ImageBackground
          source={require('../../../image/background.png')}
          resizeMode="cover"
          style={styles.headerBg}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>My Wallet</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSub}>Overview of earnings & buyers</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {renderStatCard(
            <Users width={18} height={18} color={colors.primary} />,
            'Total Buyers',
            `${totals.totalBuyers}`,
            `Courses ${totals.totalCourseBuyers} • Webinars ${totals.totalWebinarBuyers}`,
          )}
          {renderStatCard(
            <CreditCard width={18} height={18} color={colors.primary} />,
            'Total Income',
            `₹${totals.totalIncome.toLocaleString()}`,
            `Course ₹${totals.courseIncome.toLocaleString()} • Webinar ₹${totals.webinarIncome.toLocaleString()}`,
          )}
        </View>

        {/* Withdrawable balance and action */}
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            {/* <DollarSign width={22} height={22} color="#fff" /> */}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>
                ₹****
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.withdrawBtn,
              withdrawableBalance <= 0 || isWithdrawing
                ? styles.withdrawBtnDisabled
                : null,
            ]}
            // onPress={handleWithdraw}
            disabled={withdrawableBalance <= 0 || isWithdrawing}
            activeOpacity={0.8}
          >
            {isWithdrawing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Transactions list */}
        {/* <View style={styles.txListHeader}>
          <Text style={styles.txListTitle}>History</Text>
          <Text style={styles.txListSub}>{transactions.length} records</Text>
        </View> */}

        {/* <FlatList
          data={transactions}
          keyExtractor={t => t.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.txList}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No transactions found</Text>
          }
        /> */}
      </View>

      <Toast />
    </View>
  );
};

export default WalletCreator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  headerSub: {
    marginTop: 4,
    color: '#666',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    marginRight: 8,
    minHeight: 92,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statTop: { flexDirection: 'row', alignItems: 'center' },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6FBFF',
    marginRight: 10,
  },
  statLabel: { fontWeight: '700' },
  statValue: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#111' },
  statSub: { marginTop: 4, color: '#666', fontSize: 12 },

  withdrawCard: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3
  },
  withdrawLeft: { flexDirection: 'row', alignItems: 'center' },
  withdrawLabel: { color: colors.primary, fontWeight: '700' },
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
  withdrawBtnDisabled: { opacity: 0.6 },
  withdrawBtnText: { fontWeight: '800', color: colors.white },

  txListHeader: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txListTitle: { fontWeight: '800', fontSize: 16 },
  txListSub: { color: '#888' },

  txList: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  txLeft: {
    width: 40,
    alignItems: 'center',
  },
  txBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeBadge: { backgroundColor: '#e8f9f0' },
  withdrawBadge: { backgroundColor: '#fceaea' },
  txBadgeText: { fontWeight: '800', color: '#333' },

  txMiddle: { flex: 1, paddingHorizontal: 8 },
  txTitle: { fontWeight: '700' },
  txMeta: { color: '#777', marginTop: 4, fontSize: 12 },

  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '800' },
  txAmountPositive: { color: '#116530' },
  txAmountNegative: { color: '#8b0000' },

  sep: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 6 },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 16,
    // paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  headerBg: {
    width: '100%',
    // paddingTop: 10,
    // paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 17,
  },
  mainHead: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  firstPara: { color: colors.primary, fontSize: 14, fontWeight: '400' },
  secPara: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  greetingText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
});
