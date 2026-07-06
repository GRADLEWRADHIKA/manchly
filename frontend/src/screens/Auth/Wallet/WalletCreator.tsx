import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  ArrowLeft,
  Settings,
  Coins,
  BarChart3,
  ArrowUp,
  AlertTriangle,
  CreditCard,
  X,
  Check,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
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
import { getCreatorSales } from '../../../store/PaymentSlice';

const WalletCreator: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const { kycStatus, wallet, bankAccount, earningsBreakdown } = useSelector(
    (state: any) => state.settlementReducer,
  );
  const { sales } = useSelector((state: any) => state.paymentReducer);

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
      dispatch(getCreatorSales()),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const kycVerified = kycStatus?.status === 'COMPLETED';

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

  // Earning details from server or fallback
  const earningsData = [
    {
      id: 'net_earnings',
      icon: Coins,
      label: 'Net Earnings',
      subLabel: 'This month',
      amount: earningsBreakdown?.net_earnings || 0,
    },
    {
      id: 'total_earnings',
      icon: BarChart3,
      label: 'Total Earnings',
      subLabel: 'All time',
      amount: earningsBreakdown?.total_earnings || 0,
    },
    {
      id: 'last_payout',
      icon: ArrowUp,
      label: 'Last Payout',
      subLabel: 'Previous',
      amount: earningsBreakdown?.last_payout || 0,
    },
  ];

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
        <Text style={styles.headerTitle}>Wallet & Settlements</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={loadData}
          activeOpacity={0.8}
        >
          <Settings size={20} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Balance Block */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE AVAILABLE</Text>
          <Text style={styles.balanceAmount}>{formatINR(wallet?.balance || 0)}</Text>

          {/* Action Pills */}
          <View style={styles.actionPillsContainer}>
            <TouchableOpacity
              style={[styles.actionPill, styles.withdrawPill]}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <Text style={styles.withdrawText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compliance warnings */}
        {!kycVerified && (
          <View style={styles.complianceCard}>
            <AlertTriangle size={20} color={colors.gold || '#F0C040'} />
            <View style={styles.complianceInfo}>
              <Text style={styles.complianceTitle}>KYC Verification Required</Text>
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
              Account: ****{bankAccount.account_number?.slice(-4)} ({bankAccount.account_holder})
            </Text>
            <Text style={styles.bankIfsc}>IFSC: {bankAccount.ifsc}</Text>
          </View>
        )}

        {/* Earnings Breakdown */}
        <View style={styles.earningsCard}>
          <Text style={styles.cardHeaderTitle}>Earnings Summary</Text>
          {earningsData.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <View key={item.id} style={styles.earningRowContainer}>
                <View style={styles.earningRow}>
                  <View style={styles.iconCircle}>
                    <IconComponent size={16} color={colors.gold || '#F0C040'} />
                  </View>

                  <View style={styles.labelCol}>
                    <Text style={styles.earningLabel}>{item.label}</Text>
                    <Text style={styles.earningSubLabel}>{item.subLabel}</Text>
                  </View>

                  <Text style={styles.earningAmount}>{formatINR(item.amount)}</Text>
                </View>
                {index < earningsData.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Recent Transactions List */}
        <View style={styles.transactionsCard}>
          <Text style={styles.cardHeaderTitle}>Sales & Revenue Logs</Text>

          {sales && sales.length > 0 ? (
            sales.map((tx: any, index: number) => (
              <ListRow
                key={tx.id || index.toString()}
                title={tx.course?.title || tx.webinar?.title || tx.title || 'Product Sale'}
                meta={new Date(tx.created_at).toLocaleDateString()}
                avatarInitials="TX"
                trailingType="percentage"
                trailingText={`+${formatINR(tx.amount || 0)}`}
                showDivider={index < sales.length - 1}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No sales recorded yet.</Text>
          )}
        </View>
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

            <TouchableOpacity style={styles.modalBtn} onPress={submitWithdrawal}>
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.modalBtnText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawPill: {
    backgroundColor: colors.gold || '#F0C040',
  },
  withdrawText: {
    color: '#000000',
    fontSize: fp(14),
    fontWeight: '700',
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(14),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: '#EF444430',
    marginBottom: hp(12),
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
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  complianceBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: 15,
  },
  complianceBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: fp(11),
  },
  bankDetailsCard: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(16),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
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
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  bankIfsc: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(2),
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
  cardHeaderTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(10),
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
  emptyText: {
    color: colors.textSecondary,
    fontSize: fp(13),
    textAlign: 'center',
    marginVertical: hp(20),
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: wp(20),
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  modalInput: {
    height: hp(48),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: wp(12),
    color: colors.white,
    backgroundColor: colors.inputBg,
    marginBottom: hp(12),
    fontSize: fp(14),
  },
  modalBtn: {
    height: hp(46),
    backgroundColor: colors.gold,
    borderRadius: 23,
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
