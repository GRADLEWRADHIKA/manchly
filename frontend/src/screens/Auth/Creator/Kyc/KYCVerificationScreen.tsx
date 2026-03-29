import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, User, Calendar, CreditCard, Info } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import CustomTextInput from '../../../../components/CustomInput';
import { verifyPAN } from '../../../../store/UserSlice';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const KYCVerificationScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: user?.name || '',
      dob: user?.dob || '',
      pan_number: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      pan_number: data?.pan_number,
      user_name: data?.full_name,
      user_dob: data?.dob,
    };
    dispatch(verifyPAN(payload))
      .unwrap()
      .then((response: any) => {
        const verified = response?.data?.verified;
        if (verified) {
          reset();
          navigation.goBack();
          Toast.show({
            type: 'success',
            text1: response?.message || 'KYC verified successfully',
            position: 'bottom',
          });
        } else {
          const reason =
            response?.data?.failure_reason ||
            'PAN details do not match your information';
          Toast.show({
            type: 'error',
            text1: 'Verification Failed',
            text2: reason,
            position: 'bottom',
          });
        }
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: 'Something went wrong. Please try again.',
          position: 'bottom',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="KYC Verification" />

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
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={styles.shieldIconWrapper}>
              <Shield size={wp(28)} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>Verify Your Identity</Text>
            <Text style={styles.headerSubtitle}>
              Complete your KYC by verifying your PAN card details. This helps
              us ensure a safe and trusted platform.
            </Text>
          </LinearGradient>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Info size={wp(16)} color={colors.info} />
            <Text style={styles.infoBannerText}>
              Your name and date of birth must match exactly as on your PAN
              card.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Full Name Field */}
            <Controller
              name="full_name"
              control={control}
              rules={{
                required: 'Full name is required',
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
                    <User size={wp(14)} color={colors.textSecondary} />
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <Text style={styles.labelHint}>(as per PAN card)</Text>
                  </View>
                  <CustomTextInput
                    placeholder="Enter Full Name"
                    value={value}
                    onChange={(text: any) => {
                      const nameText =
                        typeof text === 'string'
                          ? text
                          : text?.nativeEvent?.text || '';
                      onChange(nameText);
                    }}
                    disabled={true}
                    onBlur={onBlur}
                    inputContainerStyle={[
                      styles.input,
                      styles.disabledInput,
                      error ? styles.inputError : null,
                    ]}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Date of Birth Field */}
            <Controller
              name="dob"
              control={control}
              rules={{
                required: 'Date of birth is required',
              }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => {
                const [showPicker, setShowPicker] = useState(false);
                const dobDate = value ? new Date(value) : new Date(2000, 0, 1);

                return (
                  <View style={styles.fieldWrapper}>
                    <View style={styles.labelRow}>
                      <Calendar size={wp(14)} color={colors.textSecondary} />
                      <Text style={styles.inputLabel}>Date of Birth</Text>
                      <Text style={styles.labelHint}>(as per PAN card)</Text>
                    </View>
                    <TouchableOpacity
                      disabled={true}
                      onPress={() => setShowPicker(true)}
                      style={[
                        styles.input,
                        styles.datePickerButton,
                        styles.disabledInput,
                        error ? styles.inputError : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.datePickerText,
                          !value && styles.placeholderText,
                        ]}
                      >
                        {value ? value : 'Select Date of Birth (YYYY-MM-DD)'}
                      </Text>
                    </TouchableOpacity>
                    {showPicker && (
                      <DateTimePicker
                        value={dobDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(_event, selectedDate) => {
                          setShowPicker(false);
                          if (selectedDate) {
                            const formattedDate = selectedDate
                              .toISOString()
                              .split('T')[0];
                            onChange(formattedDate);
                          }
                        }}
                      />
                    )}
                    {error && (
                      <Text style={styles.errorText}>{error.message}</Text>
                    )}
                  </View>
                );
              }}
            />

            {/* PAN Number Field */}
            <Controller
              name="pan_number"
              control={control}
              rules={{
                required: 'PAN number is required',
                pattern: {
                  value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                  message: 'Invalid PAN format (e.g., ABCDE1234F)',
                },
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <View style={styles.fieldWrapper}>
                  <View style={styles.labelRow}>
                    <CreditCard size={wp(14)} color={colors.textSecondary} />
                    <Text style={styles.inputLabel}>PAN Number</Text>
                  </View>
                  <CustomTextInput
                    placeholder="e.g., ABCDE1234F"
                    value={value}
                    onChange={(text: any) => {
                      const panText =
                        typeof text === 'string'
                          ? text
                          : text?.nativeEvent?.text || '';
                      onChange(panText.toUpperCase());
                    }}
                    onBlur={onBlur}
                    inputContainerStyle={[
                      styles.input,
                      error ? styles.inputError : null,
                    ]}
                    maxLength={10}
                    autoCapitalize="characters"
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                  {value.length > 0 && value.length < 10 && !error && (
                    <Text style={styles.charCount}>{value.length}/10</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              disabled={loading}
              style={[
                styles.verifyButton,
                loading && styles.verifyButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.verifyButtonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify PAN</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Shield size={wp(12)} color={colors.textSecondary} />
            <Text style={styles.footerText}>
              Your data is encrypted and securely processed. We do not store
              your PAN details beyond verification.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default KYCVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(30),
  },
  // Header Card
  headerCard: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    padding: wp(24),
    alignItems: 'center',
  },
  shieldIconWrapper: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(8),
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: fp(19),
  },
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(10),
    paddingVertical: hp(10),
    paddingHorizontal: wp(14),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    fontSize: fp(12),
    color: colors.info,
    marginLeft: wp(10),
    flex: 1,
    lineHeight: fp(17),
  },
  // Form
  formSection: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    padding: wp(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldWrapper: {
    marginBottom: hp(16),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  inputLabel: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    marginLeft: wp(6),
  },
  labelHint: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginLeft: wp(4),
  },
  input: {
    borderRadius: wp(10),
    paddingHorizontal: wp(14),
    height: hp(48),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: colors.error,
    fontSize: fp(12),
    marginTop: hp(4),
    marginLeft: wp(4),
  },
  charCount: {
    fontSize: fp(11),
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: hp(4),
  },
  datePickerButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  datePickerText: {
    fontSize: fp(14),
    color: colors.text,
  },
  placeholderText: {
    color: '#999',
  },
  // Button
  buttonContainer: {
    paddingHorizontal: wp(16),
    marginTop: hp(20),
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(12),
    paddingVertical: hp(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: fp(16),
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(24),
    marginTop: hp(20),
  },
  footerText: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginLeft: wp(6),
    flex: 1,
    lineHeight: fp(16),
  },
});
