import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  ArrowLeft,
  BarChart3,
  ArrowUp,
  AlertTriangle,
  CreditCard,
  X,
  Wallet,
  Landmark,
  FileText,
  Info,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { formatINR } from '../../../components/FormField';
import ListRow from '../Creator/Stats/components/ListRow';
import {
  getKycStatus,
  getWallet,
  getBankAccount,
  getEarningsBreakdown,
  addBankAccount,
  requestWithdrawal,
  verifyKycComplete,
} from '../../../store/SettlementSlice';

const WalletCreator: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const { kycStatus, wallet, bankAccount, earningsBreakdown } = useSelector(
    (state: any) => state.settlementReducer,
  );

  const [loading, setLoading] = useState(false);

  // Modals state
  const [showKycModal, setShowKycModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Form states
  const [pan, setPan] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      dispatch(getKycStatus()),
      dispatch(getWallet()),
      dispatch(getBankAccount()),
      dispatch(getEarningsBreakdown()),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const kycVerified =
    !!kycStatus?.verified || kycStatus?.kyc_status === 'COMPLETED';

  // Optional MoM growth badge — only renders if the backend actually sends this field
  const growthPercent = earningsBreakdown?.growth_percentage;

  const handleWithdraw = () => {
    if (!kycVerified) {
      Toast.show({
        type: 'error',
        text1: 'KYC Required',
        text2: 'Please complete your KYC verification first.',
      });
      return;
    }
    if (!bankAccount) {
      Toast.show({
        type: 'error',
        text1: 'Bank Details Required',
        text2: 'Please link your bank account first.',
      });
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleComingSoon = (label: string) => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: `${label} will be available soon`,
      position: 'top',
    });
  };

  const submitWithdrawal = () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }
    if (amt > (wallet?.balance || 0)) {
      Toast.show({ type: 'error', text1: 'Insufficient balance' });
      return;
    }

    setLoading(true);
    dispatch(requestWithdrawal(amt))
      .unwrap()
      .then(() => {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        dispatch(getWallet());
      })
      .finally(() => setLoading(false));
  };

  const submitKyc = () => {
    if (!pan || !fullName || !dob) {
      Toast.show({ type: 'error', text1: 'All KYC fields are required' });
      return;
    }

    setLoading(true);
    dispatch(
      verifyKycComplete({
        pan_number: pan,
        name: fullName,
        dob: dob,
      }),
    )
      .unwrap()
      .then(() => {
        setShowKycModal(false);
        setPan('');
        setFullName('');
        setDob('');
        dispatch(getKycStatus());
      })
      .catch((err: any) => {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: err?.message || 'Invalid PAN details',
        });
      })
      .finally(() => setLoading(false));
  };

  const submitBank = () => {
    if (!bankName || !accountHolder || !accountNumber || !ifsc) {
      Toast.show({ type: 'error', text1: 'All bank fields are required' });
      return;
    }

    setLoading(true);
    dispatch(
      addBankAccount({
        bank_name: bankName,
        account_holder: accountHolder,
        account_number: accountNumber,
        ifsc: ifsc,
      }),
    )
      .unwrap()
      .then(() => {
        setShowBankModal(false);
        setBankName('');
        setAccountHolder('');
        setAccountNumber('');
        setIfsc('');
        dispatch(getBankAccount());
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Navigation Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Wallet & Settlements</Text>
          <Text style={styles.headerSubtitle}>
            Track your earnings and manage payouts
          </Text>
        </View>
        {/* Spacer to balance the back button so title stays centered */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Balance Block */}
        <View style={styles.balanceBlock}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <View style={styles.balanceIconWrap}>
                <Wallet size={wp(20)} color={colors.gold || '#F0C040'} />
              </View>
              <View style={styles.balanceInfo}>
                <View style={styles.balanceLabelRow}>
                  <Text style={styles.balanceLabel}>Total Balance</Text>
                  <Info size={wp(11)} color="rgba(255,255,255,0.4)" />
                </View>
                <Text style={styles.balanceAmount}>
                  {formatINR(wallet?.wallet?.available_balance || 0)}
                </Text>
                {growthPercent !== undefined && growthPercent !== null && (
                  <View style={styles.growthBadge}>
                    <TrendingUp size={wp(10)} color="#22C55E" />
                    <Text style={styles.growthText}>
                      {growthPercent > 0 ? '+' : ''}
                      {growthPercent}% from last month
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handleWithdraw}
                activeOpacity={0.8}
                style={styles.withdrawBtnWrap}
              >
                <LinearGradient
                  colors={['#F3C36B', '#D49A3D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.withdrawPillGradient}
                >
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>
                  {formatINR(earningsBreakdown?.net_earnings || 0)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>All Time Earnings</Text>
                <Text style={styles.statValue}>
                  {formatINR(earningsBreakdown?.total_earnings || 0)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Last Payout</Text>
                <Text style={styles.statValue}>
                  {formatINR(earningsBreakdown?.last_payout || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compliance warnings */}
        {!kycVerified && (
          <View style={styles.complianceCard}>
            <AlertTriangle size={20} color={colors.gold || '#F0C040'} />
            <View style={styles.complianceInfo}>
              <Text style={styles.complianceTitle}>
                KYC Verification Required
              </Text>
              <Text style={styles.complianceText}>
                Verify your PAN to enable withdrawal transfers.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.complianceBtn}
              onPress={() => setShowKycModal(true)}
            >
              <Text style={styles.complianceBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>
        )}

       

        {/* Bank Account registration */}
        {!bankAccount ? (
          <View style={styles.complianceCard}>
            <CreditCard size={20} color={colors.white || '#FFFFFF'} />
            <View style={styles.complianceInfo}>
              <Text style={styles.complianceTitle}>Bank Account Missing</Text>
              <Text style={styles.complianceText}>
                Add a destination bank account to withdraw earnings.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.complianceBtn}
              onPress={() => setShowBankModal(true)}
            >
              <Text style={styles.complianceBtnText}>Link Bank</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bankDetailsCard}>
            <View style={styles.bankHeaderRow}>
              <CreditCard size={16} color={colors.gold || '#F0C040'} />
              <Text style={styles.bankTitle}>Linked Bank Details</Text>
            </View>
            <Text style={styles.bankName}>{bankAccount.bank_name}</Text>
            <Text style={styles.bankNumber}>
              Account: ****{bankAccount.account_number?.slice(-4)} (
              {bankAccount.account_holder})
            </Text>
            <Text style={styles.bankIfsc}>IFSC: {bankAccount.ifsc}</Text>
          </View>
        )}

        {/* Recent Transactions List */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => handleComingSoon('Transaction History')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {wallet?.transactions && wallet.transactions.length > 0 ? (
            wallet.transactions.map((tx: any, index: number) => {
              const isDebit = (tx.net_amount ?? tx.amount ?? 0) < 0;
              const amountValue = Math.abs(tx.net_amount ?? tx.amount ?? 0);

              return (
                <View key={tx.id || index.toString()}>
                  <View style={styles.txRow}>
                    <View
                      style={[
                        styles.txIconCircle,
                        {
                          backgroundColor: isDebit
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(34,197,94,0.12)',
                        },
                      ]}
                    >
                      {isDebit ? (
                        <Landmark size={16} color="rgba(255,255,255,0.7)" />
                      ) : (
                        <ArrowUp
                          size={16}
                          color="#22C55E"
                          style={{ transform: [{ rotate: '180deg' }] }}
                        />
                      )}
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txMeta}>
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {', '}
                        {new Date(tx.created_at).toLocaleTimeString('en-IN', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        { color: isDebit ? '#EF4444' : '#22C55E' },
                      ]}
                    >
                      {isDebit ? '-' : '+'}
                      {formatINR(amountValue)}
                    </Text>
                  </View>
                  {index < wallet.transactions.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No transactions recorded yet.</Text>
          )}
        </View>

        {/* Settlement History Link */}
        <TouchableOpacity
          style={styles.settlementLink}
          onPress={() => navigation.navigate('SettlementHistory')}
          activeOpacity={0.8}
        >
          <View style={styles.settlementLeft}>
            <FileText size={wp(15)} color={colors.gold || '#F0C040'} />
            <Text style={styles.settlementLinkText}>
              View Settlement History
            </Text>
          </View>
          <ChevronRight size={wp(16)} color={colors.gold || '#F0C040'} />
        </TouchableOpacity>
      </ScrollView>

      {/* KYC MODAL */}
      <Modal visible={showKycModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PAN KYC Compliance</Text>
              <TouchableOpacity onPress={() => setShowKycModal(false)}>
                <X size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="PAN Number"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={pan}
              onChangeText={setPan}
              autoCapitalize="characters"
            />
            <TextInput
              placeholder="Full Name as per PAN"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              placeholder="DOB (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={dob}
              onChangeText={setDob}
            />

            <TouchableOpacity style={styles.modalBtn} onPress={submitKyc}>
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.modalBtnText}>Submit Details</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LINK BANK MODAL */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Bank Credentials</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <X size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Bank Name"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={bankName}
              onChangeText={setBankName}
            />
            <TextInput
              placeholder="Account Holder Name"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
            <TextInput
              placeholder="Account Number"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="IFSC Code"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={ifsc}
              onChangeText={setIfsc}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.modalBtn} onPress={submitBank}>
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.modalBtnText}>Register Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WITHDRAW MODAL */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Available balance: {formatINR(wallet?.balance || 0)}
            </Text>

            <TextInput
              placeholder="Enter Payout Amount (INR)"
              placeholderTextColor={colors.textSecondary}
              style={styles.modalInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={submitWithdrawal}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.modalBtnText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(14),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: wp(36),
  },
  headerTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(3),
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(28),
  },
  balanceBlock: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  balanceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(18),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.35)',
    padding: wp(16),
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(12),
  },
  balanceIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: 'rgba(240,192,64,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    marginBottom: hp(6),
  },
  balanceLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  balanceAmount: {
    fontSize: fp(28),
    fontWeight: '800',
    color: colors.white || '#FFFFFF',
    lineHeight: fp(32),
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(6),
  },
  growthText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#22C55E',
  },
  withdrawBtnWrap: {
    borderRadius: wp(14),
    overflow: 'hidden',
  },
  withdrawPillGradient: {
    paddingHorizontal: wp(18),
    paddingVertical: hp(11),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: {
    color: colors.primary || '#1A1A1A',
    fontSize: fp(13),
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(18),
    paddingTop: hp(14),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: 0.5,
    height: hp(28),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: wp(10),
  },
  statLabel: {
    fontSize: fp(10.5),
    color: 'rgba(255,255,255,0.5)',
    marginBottom: hp(4),
  },
  statValue: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    padding: wp(14),
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.3)',
  },
  complianceInfo: {
    flex: 1,
    marginLeft: wp(10),
    marginRight: wp(6),
  },
  complianceTitle: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
  complianceText: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(2),
  },
  complianceBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: wp(12),
    paddingVertical: hp(7),
    borderRadius: wp(14),
  },
  complianceBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: fp(11),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: wp(16),
    marginTop: hp(14),
    gap: wp(10),
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: hp(14),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(84),
  },
  quickActionIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(10),
    backgroundColor: 'rgba(240,192,64,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(8),
  },
  quickActionLabel: {
    fontSize: fp(10.5),
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    lineHeight: fp(14),
  },
  bankDetailsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    padding: wp(16),
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(8),
  },
  bankTitle: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
  bankName: {
    fontSize: fp(14),
    color: colors.white,
    fontWeight: '600',
  },
  bankNumber: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(2),
  },
  bankIfsc: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(2),
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  transactionsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    padding: wp(16),
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(10),
  },
  cardHeaderTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  viewAllText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.gold || '#F0C040',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
  },
  txIconCircle: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(2),
  },
  txMeta: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.55)',
  },
  txAmount: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: fp(13),
    textAlign: 'center',
    marginVertical: hp(20),
  },
  settlementLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: wp(18),
    marginHorizontal: wp(16),
    marginTop: hp(14),
    borderRadius: wp(26),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.4)',
    backgroundColor: 'rgba(240,192,64,0.08)',
  },
  settlementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  settlementLinkText: {
    color: colors.gold || '#F0C040',
    fontSize: fp(14),
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    padding: wp(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
  modalSub: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    marginBottom: hp(12),
  },
  modalInput: {
    height: hp(48),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(8),
    paddingHorizontal: wp(12),
    color: colors.white,
    backgroundColor: colors.inputBg,
    marginBottom: hp(12),
    fontSize: fp(14),
  },
  modalBtn: {
    height: hp(46),
    backgroundColor: colors.gold,
    borderRadius: wp(23),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(6),
  },
  modalBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fp(14),
  },
});