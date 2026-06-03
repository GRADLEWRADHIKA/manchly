import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  Landmark,
  CreditCard,
  Building2,
  User,
  ShieldCheck,
  ShieldX,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import CustomTextInput from '../../../../components/CustomInput';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { instance } from '../../../../utils/AxiosInstance';
import { verifyBankAccount } from '../../../../services/KYCService';

interface BankAccount {
  id: string;
  account_number: string;
  ifsc_code: string;
  beneficiary_name: string;
  account_type: string;
  is_verified: boolean;
}

interface FormData {
  account_number: string;
  confirm_account_number: string;
  ifsc_code: string;
  beneficiary_name: string;
}

const BankDetails = () => {
  const { user } = useSelector((state: any) => state.userReducer);

  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAccountNumber, setVerifyAccountNumber] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      account_number: '',
      confirm_account_number: '',
      ifsc_code: '',
      beneficiary_name: user?.name || '',
    },
  });

  const accountNumber = watch('account_number');

  const fetchBankAccount = async () => {
    try {
      setFetchLoading(true);
      const response = await instance.get('settlements/bank-account');
      const data = response?.data?.data?.bankAccount;
      if (data) {
        setBankAccount(data);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.log('Error fetching bank account:', error);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const onSaveBank = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        account_number: data.account_number,
        ifsc_code: data.ifsc_code.toUpperCase(),
        beneficiary_name: data.beneficiary_name,
      };

      await instance.post('settlements/bank-account', payload);

      Toast.show({
        type: 'success',
        text1: 'Bank account saved successfully',
        position: 'bottom',
      });

      setIsEditing(false);
      reset();
      await fetchBankAccount();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Failed to save bank account';
      Toast.show({
        type: 'error',
        text1: msg,
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  const onVerifyBank = async () => {
    if (!bankAccount || !verifyAccountNumber) return;

    if (verifyAccountNumber.length < 8 || verifyAccountNumber.length > 18) {
      Toast.show({
        type: 'error',
        text1: 'Account number must be 8-18 digits',
        position: 'bottom',
      });
      return;
    }

    setVerifying(true);
    setVerificationResult(null);
    setShowVerifyModal(false);
    try {
      const result = await verifyBankAccount({
        account_number: verifyAccountNumber,
        ifsc_code: bankAccount.ifsc_code,
        account_holder_name: bankAccount.beneficiary_name,
      });

      setVerificationResult(result.data);
      setShowResultModal(true);
      setVerifyAccountNumber('');

      if (result.data?.bank_verification?.verified) {
        await fetchBankAccount();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error?.message || 'Verification failed',
        position: 'bottom',
      });
    } finally {
      setVerifying(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    if (bankAccount) {
      setValue('ifsc_code', bankAccount.ifsc_code);
      setValue('beneficiary_name', bankAccount.beneficiary_name);
      setValue('account_number', '');
      setValue('confirm_account_number', '');
    }
  };

  if (fetchLoading) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Bank Details" />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.cAccent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Bank Details" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Card */}
          <LinearGradient
            colors={['#1A1A2E', '#1E1E3A', '#2A1A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.headerIconWrap}>
              <Landmark size={wp(28)} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>Bank Account</Text>
            <Text style={styles.headerSubtitle}>
              Add and verify your bank account to receive payouts directly to
              your bank.
            </Text>
          </LinearGradient>

          {/* Existing Bank Account Display */}
          {bankAccount && !isEditing ? (
            <View style={styles.bankCard}>
              <View style={styles.bankCardHeader}>
                <Text style={styles.bankCardTitle}>Saved Account</Text>
                <View
                  style={[
                    styles.verifiedBadge,
                    {
                      backgroundColor: bankAccount.is_verified
                        ? colors.success + '15'
                        : colors.secondary + '15',
                      borderColor: bankAccount.is_verified
                        ? colors.success + '40'
                        : colors.secondary + '40',
                    },
                  ]}
                >
                  {bankAccount.is_verified ? (
                    <ShieldCheck size={wp(12)} color={colors.success} />
                  ) : (
                    <ShieldX size={wp(12)} color={colors.secondary} />
                  )}
                  <Text
                    style={[
                      styles.verifiedBadgeText,
                      {
                        color: bankAccount.is_verified
                          ? colors.success
                          : colors.secondary,
                      },
                    ]}
                  >
                    {bankAccount.is_verified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
              </View>

              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoIcon}>
                  <CreditCard size={wp(16)} color={colors.cAccentLight} />
                </View>
                <View style={styles.bankInfoContent}>
                  <Text style={styles.bankInfoLabel}>Account Number</Text>
                  <Text style={styles.bankInfoValue}>
                    {bankAccount.account_number}
                  </Text>
                </View>
              </View>

              <View style={styles.bankDivider} />

              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoIcon}>
                  <Building2 size={wp(16)} color={colors.cAccentLight} />
                </View>
                <View style={styles.bankInfoContent}>
                  <Text style={styles.bankInfoLabel}>IFSC Code</Text>
                  <Text style={styles.bankInfoValue}>
                    {bankAccount.ifsc_code}
                  </Text>
                </View>
              </View>

              <View style={styles.bankDivider} />

              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoIcon}>
                  <User size={wp(16)} color={colors.cAccentLight} />
                </View>
                <View style={styles.bankInfoContent}>
                  <Text style={styles.bankInfoLabel}>Beneficiary Name</Text>
                  <Text style={styles.bankInfoValue}>
                    {bankAccount.beneficiary_name}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.bankActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={startEditing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Edit Details</Text>
                </TouchableOpacity>

                {!bankAccount.is_verified && (
                  <TouchableOpacity
                    style={[styles.verifyBtn, verifying && { opacity: 0.6 }]}
                    onPress={() => {
                      setVerifyAccountNumber('');
                      setShowVerifyModal(true);
                    }}
                    disabled={verifying}
                    activeOpacity={0.7}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <ShieldCheck size={wp(16)} color={colors.white} />
                        <Text style={styles.verifyBtnText}>Verify Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <>
              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Info size={wp(16)} color={colors.cAccentLight} />
                <Text style={styles.infoBannerText}>
                  Enter your bank account details carefully. The account must be
                  in your name for verification.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.formSection}>
                {/* Account Number */}
                <Controller
                  name="account_number"
                  control={control}
                  rules={{
                    required: 'Account number is required',
                    minLength: {
                      value: 8,
                      message: 'Account number must be at least 8 digits',
                    },
                    maxLength: {
                      value: 18,
                      message: 'Account number must be at most 18 digits',
                    },
                    pattern: {
                      value: /^\d+$/,
                      message: 'Account number must contain only digits',
                    },
                  }}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <CreditCard
                          size={wp(14)}
                          color={colors.cTextSecondary}
                        />
                        <Text style={styles.inputLabel}>Account Number</Text>
                      </View>
                      <CustomTextInput
                        placeholder="Enter Account Number"
                        value={value}
                        onChange={(text: any) => {
                          const t =
                            typeof text === 'string'
                              ? text
                              : text?.nativeEvent?.text || '';
                          onChange(t.replace(/\D/g, ''));
                        }}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        inputContainerStyle={[
                          styles.input,
                          error ? styles.inputError : null,
                        ]}
                      />
                      {error && (
                        <Text style={styles.errorText}>{error.message}</Text>
                      )}
                    </View>
                  )}
                />

                {/* Confirm Account Number */}
                <Controller
                  name="confirm_account_number"
                  control={control}
                  rules={{
                    required: 'Please confirm your account number',
                    validate: (value: string) =>
                      value === accountNumber || 'Account numbers do not match',
                  }}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <CreditCard
                          size={wp(14)}
                          color={colors.cTextSecondary}
                        />
                        <Text style={styles.inputLabel}>
                          Confirm Account Number
                        </Text>
                      </View>
                      <CustomTextInput
                        placeholder="Re-enter Account Number"
                        value={value}
                        onChange={(text: any) => {
                          const t =
                            typeof text === 'string'
                              ? text
                              : text?.nativeEvent?.text || '';
                          onChange(t.replace(/\D/g, ''));
                        }}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        inputContainerStyle={[
                          styles.input,
                          error ? styles.inputError : null,
                        ]}
                      />
                      {error && (
                        <Text style={styles.errorText}>{error.message}</Text>
                      )}
                    </View>
                  )}
                />

                {/* IFSC Code */}
                <Controller
                  name="ifsc_code"
                  control={control}
                  rules={{
                    required: 'IFSC code is required',
                    pattern: {
                      value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                      message: 'Invalid IFSC code format (e.g. SBIN0001234)',
                    },
                  }}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <Building2
                          size={wp(14)}
                          color={colors.cTextSecondary}
                        />
                        <Text style={styles.inputLabel}>IFSC Code</Text>
                      </View>
                      <CustomTextInput
                        placeholder="e.g. SBIN0001234"
                        value={value}
                        onChange={(text: any) => {
                          const t =
                            typeof text === 'string'
                              ? text
                              : text?.nativeEvent?.text || '';
                          onChange(t.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        }}
                        onBlur={onBlur}
                        autoCapitalize="characters"
                        maxLength={11}
                        inputContainerStyle={[
                          styles.input,
                          error ? styles.inputError : null,
                        ]}
                      />
                      {error && (
                        <Text style={styles.errorText}>{error.message}</Text>
                      )}
                    </View>
                  )}
                />

                {/* Beneficiary Name */}
                <Controller
                  name="beneficiary_name"
                  control={control}
                  rules={{
                    required: 'Beneficiary name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  }}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View style={styles.fieldWrapper}>
                      <View style={styles.labelRow}>
                        <User size={wp(14)} color={colors.cTextSecondary} />
                        <Text style={styles.inputLabel}>Beneficiary Name</Text>
                      </View>
                      <CustomTextInput
                        placeholder="Account holder name"
                        value={value}
                        disabled
                        inputContainerStyle={[
                          styles.input,
                          styles.disabledInput,
                        ]}
                      />
                      {error && (
                        <Text style={styles.errorText}>{error.message}</Text>
                      )}
                    </View>
                  )}
                />

                {/* Buttons */}
                <View style={styles.formButtons}>
                  {bankAccount && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setIsEditing(false);
                        reset();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      saving && { opacity: 0.6 },
                      !bankAccount && { flex: 1 },
                    ]}
                    onPress={handleSubmit(onSaveBank)}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {bankAccount ? 'Update Account' : 'Save Account'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verify Account Number Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalIconWrap,
                { backgroundColor: colors.info + '15' },
              ]}
            >
              <ShieldCheck size={wp(32)} color={colors.cAccentLight} />
            </View>
            <Text style={styles.modalTitle}>Verify Bank Account</Text>
            <Text style={styles.modalMessage}>
              Enter your full account number to verify your bank account.
            </Text>
            <View style={styles.verifyInputWrap}>
              <CustomTextInput
                placeholder="Enter Account Number"
                value={verifyAccountNumber}
                onChange={(text: any) => {
                  const t =
                    typeof text === 'string'
                      ? text
                      : text?.nativeEvent?.text || '';
                  setVerifyAccountNumber(t.replace(/\D/g, ''));
                }}
                keyboardType="numeric"
                inputContainerStyle={styles.input}
              />
            </View>
            <View style={styles.verifyModalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowVerifyModal(false);
                  setVerifyAccountNumber('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  !verifyAccountNumber && { opacity: 0.5 },
                ]}
                onPress={onVerifyBank}
                disabled={!verifyAccountNumber}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Result Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {verificationResult?.bank_verification?.verified ? (
              <>
                <View
                  style={[
                    styles.modalIconWrap,
                    { backgroundColor: colors.success + '15' },
                  ]}
                >
                  <CheckCircle2 size={wp(36)} color={colors.success} />
                </View>
                <Text style={styles.modalTitle}>Account Verified</Text>
                <Text style={styles.modalMessage}>
                  Your bank account has been successfully verified.
                </Text>
                {verificationResult?.bank_verification
                  ?.beneficiary_name_with_bank && (
                  <View style={styles.modalDetail}>
                    <Text style={styles.modalDetailLabel}>
                      Name as per bank
                    </Text>
                    <Text style={styles.modalDetailValue}>
                      {
                        verificationResult.bank_verification
                          .beneficiary_name_with_bank
                      }
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.modalIconWrap,
                    { backgroundColor: colors.error + '15' },
                  ]}
                >
                  <XCircle size={wp(36)} color={colors.error} />
                </View>
                <Text style={styles.modalTitle}>Verification Failed</Text>
                <Text style={styles.modalMessage}>
                  {verificationResult?.bank_verification?.error_msg ||
                    'Bank account could not be verified. Please check your details and try again.'}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: verificationResult?.bank_verification
                    ?.verified
                    ? colors.success
                    : colors.cAccent,
                },
              ]}
              onPress={() => setShowResultModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BankDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  headerCard: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    padding: wp(20),
    alignItems: 'center',
  },
  headerIconWrap: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(6),
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: fp(18),
  },

  // Bank Card
  bankCard: {
    backgroundColor: colors.cCard,
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    padding: wp(16),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  bankCardTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.cText,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(16),
    borderWidth: 1,
  },
  verifiedBadgeText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  bankInfoIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    backgroundColor: colors.cCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  bankInfoContent: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    fontWeight: '500',
    marginBottom: hp(2),
  },
  bankInfoValue: {
    fontSize: fp(15),
    color: colors.cText,
    fontWeight: '600',
  },
  bankDivider: {
    height: 1,
    backgroundColor: colors.cBorder,
    marginLeft: wp(48),
  },
  bankActions: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(18),
    paddingTop: hp(16),
    borderTopWidth: 1,
    borderTopColor: colors.cBorder,
  },
  editBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cCardLight,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  editBtnText: {
    color: colors.cText,
    fontWeight: '600',
    fontSize: fp(14),
  },
  verifyBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cAccent,
    gap: wp(6),
  },
  verifyBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(14),
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(10),
    backgroundColor: colors.cAccentMuted,
    marginHorizontal: wp(16),
    marginTop: hp(16),
    padding: wp(14),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.cAccent + '30',
  },
  infoBannerText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.cAccentLight,
    lineHeight: fp(17),
    fontWeight: '500',
  },

  // Form
  formSection: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    backgroundColor: colors.cCard,
    borderRadius: wp(16),
    padding: wp(16),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  fieldWrapper: {
    marginBottom: hp(16),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(6),
  },
  inputLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.cText,
  },
  input: {
    height: hp(48),
    borderWidth: 1,
    borderColor: colors.cBorder,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    backgroundColor: colors.cInputBg,
  },
  disabledInput: {
    backgroundColor: colors.cCardLight,
    borderColor: colors.cCardLight,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fp(11),
    marginTop: hp(4),
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(8),
  },
  cancelBtn: {
    flex: 1,
    height: hp(48),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cCardLight,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  cancelBtnText: {
    color: colors.cText,
    fontWeight: '600',
    fontSize: fp(14),
  },
  saveBtn: {
    flex: 2,
    height: hp(48),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cAccent,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalContainer: {
    backgroundColor: colors.cCard,
    borderRadius: wp(20),
    paddingVertical: hp(28),
    paddingHorizontal: wp(24),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  modalIconWrap: {
    width: wp(68),
    height: wp(68),
    borderRadius: wp(34),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.cText,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: fp(14),
    color: colors.cTextSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(20),
  },
  modalDetail: {
    backgroundColor: colors.cCardLight,
    borderRadius: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    width: '100%',
    marginBottom: hp(20),
  },
  modalDetailLabel: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    fontWeight: '500',
    marginBottom: hp(2),
  },
  modalDetailValue: {
    fontSize: fp(15),
    color: colors.cText,
    fontWeight: '700',
  },
  verifyInputWrap: {
    width: '100%',
    marginBottom: hp(16),
  },
  verifyModalButtons: {
    flexDirection: 'row',
    gap: wp(10),
    width: '100%',
  },
  modalCloseBtn: {
    width: '100%',
    height: hp(48),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },
});
