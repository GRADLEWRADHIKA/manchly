import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import {
  Wallet,
  TrendingUp,
  Users,
  BookOpen,
  Presentation,
  ArrowDownToLine,
  ChevronRight,
  IndianRupee,
  Clock,
  Landmark,
  Info,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { instance } from '../../../utils/AxiosInstance';
import Toast from 'react-native-toast-message';

const WalletCreator = () => {
  const navigation = useNavigation<any>();
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, bankRes] = await Promise.all([
        instance.get('settlements/wallet'),
        instance.get('settlements/bank-account').catch(() => null),
      ]);
      const data = walletRes?.data?.data;
      setWalletData(data?.wallet || null);
      setTransactions(data?.transactions || []);
      setBankAccount(bankRes?.data?.data?.bankAccount || null);
    } catch (error) {
      console.log('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, []),
  );

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getT2Date = () => {
    const eta = new Date();
    let businessDays = 0;
    while (businessDays < 2) {
      eta.setDate(eta.getDate() + 1);
      const day = eta.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }
    return eta.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const pendingBalance = walletData?.available_balance || 0;
  const settledBalance = walletData?.withdrawn_amount || 0;
  const totalEarnings = walletData?.total_earnings || 0;
  const totalNetEarnings = walletData?.total_net_earnings || 0;

  const handleWithdraw = () => {
    if (!bankAccount) {
      Toast.show({
        type: 'error',
        text1: 'No Bank Account',
        text2: 'Please add and verify your bank account first',
        position: 'bottom',
      });
      navigation.navigate('BankDetails');
      return;
    }
    if (!bankAccount.is_verified) {
      Toast.show({
        type: 'error',
        text1: 'Bank Not Verified',
        text2: 'Please verify your bank account first',
        position: 'bottom',
      });
      navigation.navigate('BankDetails');
      return;
    }
    if (pendingBalance <= 0) {
      Toast.show({
        type: 'info',
        text1: 'No Balance',
        text2: 'You have no withdrawable balance at the moment',
        position: 'bottom',
      });
      return;
    }
    setShowWithdrawModal(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT';
    return (
      <View style={styles.txRow}>
        <View
          style={[
            styles.txIcon,
            {
              backgroundColor: isCredit
                ? colors.cSuccess + '15'
                : colors.cError + '15',
            },
          ]}
        >
          {isCredit ? (
            <ArrowDownLeft size={wp(16)} color={colors.cSuccess} />
          ) : (
            <ArrowUpRight size={wp(16)} color={colors.cError} />
          )}
        </View>
        <View style={styles.txContent}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
          <Text
            style={[
              styles.txStatus,
              {
                color:
                  item.status === 'SETTLED'
                    ? colors.cSuccess
                    : item.status === 'FAILED'
                    ? colors.cError
                    : colors.secondary,
              },
            ]}
          >
            {item.status_label}
          </Text>
        </View>
        <View style={styles.txAmountWrap}>
          <Text
            style={[
              styles.txAmount,
              { color: isCredit ? colors.cSuccess : colors.cError },
            ]}
          >
            {isCredit ? '+' : '-'}₹{formatAmount(item.net_amount)}
          </Text>
          <Text style={styles.txGross}>
            Gross: ₹{formatAmount(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="My Wallet" />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.cAccent} />
        </View>
      </View>
    );
  }

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
            colors={['#1E2038', '#222448', '#2A2455']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconWrap}>
                <Wallet size={wp(20)} color={colors.cText} />
              </View>
              <Text style={styles.balanceLabel}>Pending Settlement</Text>
            </View>
            <Text style={styles.balanceAmount}>
              ₹ {formatAmount(pendingBalance)}
            </Text>
            <Text style={styles.balanceHint}>
              Will be settled to your bank after T+2
            </Text>

            <TouchableOpacity
              style={styles.withdrawBtn}
              activeOpacity={0.8}
              onPress={handleWithdraw}
            >
              <ArrowDownToLine size={wp(16)} color={colors.cBg} />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Earnings Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.cAccent + '20' }]}>
              <TrendingUp size={wp(18)} color={colors.cAccentLight} />
            </View>
            <Text style={styles.statValue}>
              ₹ {formatAmount(totalEarnings)}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.cSuccess + '20' }]}>
              <CheckCircle2 size={wp(18)} color={colors.cSuccess} />
            </View>
            <Text style={styles.statValue}>
              ₹ {formatAmount(settledBalance)}
            </Text>
            <Text style={styles.statLabel}>Total Settled</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.golden + '20' }]}>
              <Clock size={wp(18)} color={colors.golden} />
            </View>
            <Text style={styles.statValue}>
              ₹ {formatAmount(pendingBalance)}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.secondary + '20' }]}>
              <IndianRupee size={wp(18)} color={colors.secondary} />
            </View>
            <Text style={styles.statValue}>
              ₹ {formatAmount(totalNetEarnings)}
            </Text>
            <Text style={styles.statLabel}>Net Earnings</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.txHeader}>
          <Text style={styles.sectionTitleOne}>Recent Transactions</Text>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.txSection}>
            {transactions.slice(0, 10).map((item: any, index: number) => (
              <View key={item.id || index}>{renderTransaction({ item })}</View>
            ))}
          </View>
        ) : (
          <View style={styles.txSection}>
            <View style={styles.txEmptyCard}>
              <IndianRupee size={wp(32)} color={colors.cTextMuted} />
              <Text style={styles.txEmptyTitle}>No transactions yet</Text>
              <Text style={styles.txEmptyDesc}>
                Your earnings from courses and webinars will appear here
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>
          Quick Actions
        </Text>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('BankDetails')}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: colors.cAccent + '20' }]}>
              <Landmark size={wp(18)} color={colors.cAccentLight} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Bank Account</Text>
              <Text style={styles.actionDesc}>Manage bank details</Text>
            </View>
          </View>
          <ChevronRight size={wp(18)} color={colors.cTextMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconWrap}>
              <Wallet size={wp(28)} color={colors.cAccent} />
            </View>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>

            <View style={styles.modalAmountCard}>
              <Text style={styles.modalAmountLabel}>Amount to be settled</Text>
              <Text style={styles.modalAmountValue}>
                ₹ {formatAmount(pendingBalance)}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Clock size={wp(16)} color={colors.cAccentLight} />
              <Text style={styles.modalInfoText}>
                Your money will be credited to your bank account by{' '}
                <Text style={{ fontWeight: '700' }}>{getT2Date()}</Text> (T+2
                settlement period).
              </Text>
            </View>

            {bankAccount && (
              <View style={styles.modalBankRow}>
                <Landmark size={wp(16)} color={colors.cTextSecondary} />
                <Text style={styles.modalBankText}>
                  Crediting to: {bankAccount.account_number} (
                  {bankAccount.ifsc_code})
                </Text>
              </View>
            )}

            <View style={styles.modalNoteRow}>
              <Info size={wp(14)} color={colors.secondary} />
              <Text style={styles.modalNoteText}>
                Settlements are processed automatically. Your earnings will be
                transferred after the T+2 settlement period.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWithdrawModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowWithdrawModal(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Settlement Scheduled',
                    text2: `₹${formatAmount(
                      pendingBalance,
                    )} will be credited by ${getT2Date()}`,
                    position: 'bottom',
                  });
                }}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={wp(16)} color={colors.cText} />
                <Text style={styles.modalConfirmText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WalletCreator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollContent: {
    paddingBottom: hp(30),
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(20),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.cAccent,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    color: colors.cText,
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
    backgroundColor: colors.cText,
    paddingVertical: hp(12),
    borderRadius: wp(12),
    gap: wp(8),
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.cBg,
    fontSize: fp(15),
  },

  // Section
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.cText,
    marginHorizontal: wp(16),
    marginTop: hp(24),
    marginBottom: hp(12),
  },
  sectionTitleOne: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.cText,
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
    backgroundColor: colors.cCard,
    borderRadius: wp(16),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
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
    color: colors.cText,
    marginBottom: hp(2),
  },
  statLabel: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
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
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cCard,
    marginHorizontal: wp(16),
    marginBottom: hp(8),
    padding: wp(14),
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  txIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  txContent: {
    flex: 1,
  },
  txTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.cText,
  },
  txDate: {
    fontSize: fp(11),
    color: colors.cTextMuted,
    marginTop: hp(2),
  },
  txStatus: {
    fontSize: fp(10),
    fontWeight: '600',
    marginTop: hp(2),
  },
  txAmountWrap: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  txGross: {
    fontSize: fp(10),
    color: colors.cTextMuted,
    marginTop: hp(2),
  },
  txEmptyCard: {
    backgroundColor: colors.cCard,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    padding: wp(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  txEmptyTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.cText,
    marginTop: hp(10),
  },
  txEmptyDesc: {
    fontSize: fp(13),
    color: colors.cTextSecondary,
    textAlign: 'center',
    marginTop: hp(4),
    lineHeight: fp(18),
  },

  // Quick Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cCard,
    marginHorizontal: wp(16),
    marginBottom: hp(10),
    padding: wp(14),
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
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
    color: colors.cText,
  },
  actionDesc: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    marginTop: hp(1),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(20),
  },
  modalContainer: {
    backgroundColor: colors.cCard,
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  modalIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: colors.cCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.cText,
    marginBottom: hp(16),
  },
  modalAmountCard: {
    backgroundColor: colors.cCardLight,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalAmountLabel: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
    marginBottom: hp(4),
  },
  modalAmountValue: {
    fontSize: fp(28),
    fontWeight: '900',
    color: colors.cText,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(10),
    backgroundColor: colors.cAccent + '15',
    padding: wp(12),
    borderRadius: wp(12),
    width: '100%',
    marginBottom: hp(10),
  },
  modalInfoText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.cAccentLight,
    lineHeight: fp(17),
    fontWeight: '500',
  },
  modalBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: colors.cCardLight,
    padding: wp(12),
    borderRadius: wp(10),
    width: '100%',
    marginBottom: hp(10),
  },
  modalBankText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  modalNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(8),
    padding: wp(12),
    width: '100%',
    marginBottom: hp(16),
  },
  modalNoteText: {
    flex: 1,
    fontSize: fp(11),
    color: colors.cTextSecondary,
    lineHeight: fp(16),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(10),
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cCardLight,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  modalCancelText: {
    color: colors.cText,
    fontWeight: '600',
    fontSize: fp(14),
  },
  modalConfirmBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cAccent,
    gap: wp(6),
  },
  modalConfirmText: {
    color: colors.cText,
    fontWeight: '700',
    fontSize: fp(14),
  },
});
