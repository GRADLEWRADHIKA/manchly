import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Settings,
  Coins,
  BarChart3,
  ArrowUp,
  ArrowUpRight,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { formatINR } from '../../../components/FormField';
import ListRow from '../Creator/Stats/components/ListRow';

interface EarningsRow {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  subLabel: string;
  amount: number;
}

interface TransactionItem {
  id: string;
  initials: string;
  title: string;
  date: string;
  amount: number;
}

const WalletCreator: React.FC = () => {
  const navigation = useNavigation<any>();

  // Earnings data mapping array
  const earningsData: EarningsRow[] = [
    {
      id: 'net_earnings',
      icon: Coins,
      label: 'Net Earnings',
      subLabel: 'This month',
      amount: 12400.0,
    },
    {
      id: 'total_earnings',
      icon: BarChart3,
      label: 'Total Earnings',
      subLabel: 'All time',
      amount: 165000.0,
    },
    {
      id: 'last_payout',
      icon: ArrowUp,
      label: 'Last Payout',
      subLabel: 'Previous',
      amount: 20200.0,
    },
  ];

  // Transactions list mapping array
  const transactions: TransactionItem[] = [
    {
      id: 'tx1',
      initials: 'UI',
      title: 'Task: Mastering UI Design',
      date: 'Today, 11:30 AM',
      amount: 12900.0,
    },
    {
      id: 'tx2',
      initials: 'VR',
      title: 'Sale: Advanced VR Webinar',
      date: 'Yesterday, 4:00 PM',
      amount: 495.0,
    },
    {
      id: 'tx3',
      initials: 'MS',
      title: '1:1 Mentorship Session',
      date: '28 Jun, 2:30 PM',
      amount: 5418.0,
    },
    {
      id: 'tx4',
      initials: 'MS',
      title: '1:1 Mentorship Session',
      date: '24 Jun, 9:00 AM',
      amount: 2418.0,
    },
  ];

  const handleWithdraw = () => {
    Toast.show({
      type: 'success',
      text1: 'Withdrawal Initiated',
      text2: 'Funds transfer request sent to your registered bank account.',
      position: 'bottom',
    });
  };

  const handleDeposit = () => {
    Toast.show({
      type: 'info',
      text1: 'Deposit Feature',
      text2: 'Add funds option coming soon.',
      position: 'bottom',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg || '#0F0F0F'} />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Toast.show({ type: 'info', text1: 'Wallet Settings' })}
          activeOpacity={0.8}
        >
          <Settings size={20} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Balance Block */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>{formatINR(24850.0)}</Text>

          {/* Action Pills */}
          <View style={styles.actionPillsContainer}>
            <TouchableOpacity
              style={[styles.actionPill, styles.withdrawPill]}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, styles.depositPill]}
              onPress={handleDeposit}
              activeOpacity={0.8}
            >
              <Text style={styles.depositText}>Deposit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.earningsCard}>
          {earningsData.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <View key={item.id} style={styles.earningRowContainer}>
                <View style={styles.earningRow}>
                  {/* Icon Left in goldDim circle */}
                  <View style={styles.iconCircle}>
                    <IconComponent size={16} color={colors.gold || '#F0C040'} />
                  </View>

                  {/* Label + Sub-label */}
                  <View style={styles.labelCol}>
                    <Text style={styles.earningLabel}>{item.label}</Text>
                    <Text style={styles.earningSubLabel}>{item.subLabel}</Text>
                  </View>

                  {/* Amount right-aligned */}
                  <Text style={styles.earningAmount}>{formatINR(item.amount)}</Text>
                </View>
                {index < earningsData.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => Toast.show({ type: 'info', text1: 'Full history coming soon' })}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions list mapping */}
          {transactions.map((tx, index) => (
            <ListRow
              key={tx.id}
              title={tx.title}
              meta={tx.date}
              avatarInitials={tx.initials}
              trailingType="percentage"
              trailingText={`+${formatINR(tx.amount)}`}
              showDivider={index < transactions.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletCreator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#2A2A2C',
  },
  backButton: {
    padding: wp(4),
  },
  headerTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  settingsButton: {
    padding: wp(4),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(24),
  },
  balanceBlock: {
    alignItems: 'center',
    paddingVertical: hp(24),
  },
  balanceLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    letterSpacing: 0.8,
    marginBottom: hp(6),
  },
  balanceAmount: {
    fontSize: fp(32),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
    textAlign: 'center',
  },
  actionPillsContainer: {
    flexDirection: 'row',
    marginTop: hp(16),
    width: '100%',
    paddingHorizontal: wp(16),
    gap: wp(12),
  },
  actionPill: {
    flex: 1,
    height: hp(40),
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawPill: {
    backgroundColor: colors.gold || '#F0C040',
  },
  depositPill: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  withdrawText: {
    color: '#000000',
    fontSize: fp(13),
    fontWeight: '700',
  },
  depositText: {
    color: colors.white || '#FFFFFF',
    fontSize: fp(13),
    fontWeight: '600',
  },
  earningsCard: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(16),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    marginBottom: hp(12),
  },
  earningRowContainer: {
    width: '100%',
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldDim || 'rgba(240, 192, 64, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  labelCol: {
    flex: 1,
    justifyContent: 'center',
  },
  earningLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(2),
  },
  earningSubLabel: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
  },
  earningAmount: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border || '#2A2A2C',
    width: '100%',
  },
  transactionsCard: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(16),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  listTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  viewAllText: {
    fontSize: fp(12),
    color: colors.gold || '#F0C040',
    fontWeight: '600',
  },
});
