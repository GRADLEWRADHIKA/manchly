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
        position: 'top',
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
        position: 'top',
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
        position: 'top',
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
        position: 'top',
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
        <AppHeaderWithBack title="Bank Details" bgColor="transparent" />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.golden} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Bank Details" bgColor="transparent" />

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
          {/* Subtitle */}
          <Text style={styles.headerSubtitle}>
            Securely manage your withdrawal settings and bank information.
          </Text>

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
                  <CreditCard size={wp(16)} color={colors.golden} />
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
                  <Building2 size={wp(16)} color={colors.golden} />
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
                  <User size={wp(16)} color={colors.golden} />
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
                      <ActivityIndicator size="small" color={colors.black} />
                    ) : (
                      <>
                        <ShieldCheck size={wp(16)} color={colors.black} />
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
                <Info size={wp(16)} color={colors.gold} />
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
                      <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
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
                      <Text style={styles.inputLabel}>
                        CONFIRM ACCOUNT NUMBER
                      </Text>
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
                      <Text style={styles.inputLabel}>IFSC CODE</Text>
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
                      <Text style={styles.inputLabel}>ACCOUNT HOLDER NAME</Text>
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
                    <LinearGradient
                      colors={['#F3C36B', '#D49A3D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color={colors.black} />
                      ) : (
                        <Text style={styles.saveBtnText}>
                          {bankAccount ? 'Update Account' : 'Save Account'}
                        </Text>
                      )}
                    </LinearGradient>
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
                { backgroundColor: 'rgba(240,192,64,0.12)' },
              ]}
            >
              <ShieldCheck size={wp(32)} color={colors.gold} />
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
                    : colors.golden,
                },
              ]}
              onPress={() => setShowResultModal(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalCloseBtnText,
                  !verificationResult?.bank_verification?.verified && {
                    color: colors.black,
                  },
                ]}
              >
                Done
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
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

  // Header subtitle (replaces old gradient header card)
  headerSubtitle: {
    fontSize: fp(13),
    color: colors.micButtonGolden,
    textAlign: 'center',
    lineHeight: fp(18),
    marginHorizontal: wp(24),
    marginTop: hp(16),
    marginBottom: hp(4),
  },

  // Bank Card
  bankCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: colors.white,
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
    backgroundColor: 'rgba(255,182,6,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  bankInfoContent: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: fp(11),
    color: colors.micButtonGolden,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: hp(2),
  },
  bankInfoValue: {
    fontSize: fp(15),
    color: colors.white,
    fontWeight: '600',
  },
  bankDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: wp(48),
  },
  bankActions: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(18),
    paddingTop: hp(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  editBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.golden,
  },
  editBtnText: {
    color: colors.golden,
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
    backgroundColor: colors.golden,
    gap: wp(6),
  },
  verifyBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: fp(14),
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(10),
    backgroundColor: 'rgba(240,192,64,0.08)',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    padding: wp(14),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.gold,
    lineHeight: fp(17),
    fontWeight: '500',
  },

  // Form
  formSection: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldWrapper: {
    marginBottom: hp(16),
  },
  inputLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.micButtonGolden,
    letterSpacing: 0.6,
    marginBottom: hp(6),
  },
  input: {
    height: hp(48),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
  },
  disabledInput: {
    backgroundColor: '#0a0a0f',
    borderColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cancelBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(14),
  },
  saveBtn: {
    flex: 2,
    height: hp(48),
    borderRadius: wp(12),
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: fp(15),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(20),
    paddingVertical: hp(28),
    paddingHorizontal: wp(24),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: colors.white,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(20),
  },
  modalDetail: {
    backgroundColor: colors.primary,
    borderRadius: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    width: '100%',
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalDetailLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginBottom: hp(2),
  },
  modalDetailValue: {
    fontSize: fp(15),
    color: colors.white,
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