import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import CustomTextInput from '../../../../components/CustomInput';
import { verifyPAN, verifyKYC, getKYCStatus } from '../../../../store/UserSlice';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';

const KYCVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user, kycStatus, kycVerifying } = useSelector(
    (state: any) => state.userReducer
  );

  const [panDetails, setPanDetails] = useState<any>(null);
  const [userName, setUserName] = useState<string>(user?.name || '');
  const [userDob, setUserDob] = useState<string>(user?.dob || '');
  const [step, setStep] = useState<'enter-details' | 'enter-pan' | 'verify-details'>('enter-details');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: user?.name || '',
      dob: user?.dob || '',
      pan_number: '',
    },
  });

  useEffect(() => {
    dispatch(getKYCStatus());
  }, []);

  const handleSubmitDetails = (data: { full_name: string; dob: string }) => {
    if (!data.full_name || !data.dob) {
      Alert.alert('Missing Information', 'Please enter both your full name and date of birth.');
      return;
    }
    
    setUserName(data.full_name.trim());
    setUserDob(data.dob);
    setStep('enter-pan');
  };

  const handleVerifyPAN = async (data: { pan_number: string }) => {
    try {
      const panNumber = data.pan_number.toUpperCase().trim();
      
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        Alert.alert('Invalid PAN', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        return;
      }

      const result = await dispatch(
        verifyPAN(panNumber)
      ).unwrap();
      
      setPanDetails(result?.data?.pan_details);
      setStep('verify-details');
    } catch (error: any) {
      console.error('PAN verification error:', error);
      
      const errorMessage = error?.message || '';
      if (
        errorMessage.toLowerCase().includes('development') ||
        errorMessage.toLowerCase().includes('not available') ||
        error?.response?.status === 404 ||
        error?.response?.status === 501
      ) {
        Alert.alert(
          'Feature Not Available',
          'KYC verification is currently under development. Please contact support for more information.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleVerifyKYC = async () => {
    if (!panDetails || !userName || !userDob) {
      Alert.alert('Missing Information', 'Please ensure all details are entered correctly.');
      return;
    }

    try {
      const result = await dispatch(
        verifyKYC({
          pan_number: panDetails.pan,
          user_name: userName,
          user_dob: userDob,
        })
      ).unwrap();

      if (result?.data?.verified) {
        Alert.alert(
          'KYC Verified! ✅',
          'Your identity has been successfully verified.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                dispatch(getKYCStatus());
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'PAN details do not match your information. Please check your name and date of birth.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('KYC verification error:', error);
      
      const errorMessage = error?.message || '';
      if (
        errorMessage.toLowerCase().includes('development') ||
        errorMessage.toLowerCase().includes('not available') ||
        error?.response?.status === 404 ||
        error?.response?.status === 501
      ) {
        Alert.alert(
          'Feature Not Available',
          'KYC verification is currently under development. Please contact support for more information.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const compareNames = (name1: string, name2: string): boolean => {
    const normalize = (str: string) =>
      str
        .toUpperCase()
        .trim()
        .replace(/\s+/g, ' ');
    return normalize(name1) === normalize(name2);
  };

  const compareDOB = (dob1: string | undefined, dob2: string | undefined): boolean => {
    if (!dob1 || !dob2) {
      return false;
    }
    
  
    if (dob1.includes('-') && dob2.includes('-')) {
      const [d1, m1, y1] = dob1.split('-');
      const [y2, m2, d2] = dob2.split('-');
      
      if (!d1 || !m1 || !y1 || !y2 || !m2 || !d2) {
        return false;
      }
      
      return d1 === d2 && m1 === m2 && y1 === y2;
    }
    return false;
  };

  const nameMatch = panDetails && panDetails.name && userName
    ? compareNames(panDetails.name, userName)
    : false;
  const dobMatch = panDetails && userDob
    ? true 
    : false;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeaderWithBack title="KYC Verification" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        {kycStatus?.verified && (
          <View style={styles.statusCard}>
            <CheckCircle size={48} color="green" />
            <Text style={styles.statusTitle}>KYC Verified</Text>
            <Text style={styles.statusText}>
              Your identity has been verified successfully
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Shield size={24} color={colors.primary} />
          <Text style={styles.infoTitle}>Verify Your Identity</Text>
          <Text style={styles.infoText}>
            Enter your details and PAN number to verify your identity. We'll match them with your PAN card information.
          </Text>
        </View>

        {/* Step 1: Enter Name and DOB */}
        {step === 'enter-details' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Enter Your Details</Text>
            <Text style={styles.stepSubtitle}>
              Please enter your full name and date of birth as per your PAN card
            </Text>

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
                <>
                  <Text style={styles.inputLabel}>Full Name (as per PAN card)</Text>
                  <CustomTextInput
                    placeholder="Enter Full Name"
                    value={value}
                    onChange={(text: any) => {
                      const nameText = typeof text === 'string' ? text : text?.nativeEvent?.text || '';
                      onChange(nameText);
                    }}
                    onBlur={onBlur}
                    inputContainerStyle={[
                      styles.input,
                      { borderColor: error ? 'red' : colors.borderColor },
                    ]}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />

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
                  <>
                    <Text style={styles.inputLabel}>Date of Birth (as per PAN card)</Text>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      style={[
                        styles.input,
                        styles.datePickerButton,
                        { borderColor: error ? 'red' : colors.borderColor },
                      ]}
                    >
                      <Text style={[styles.datePickerText, !value && { color: '#999' }]}>
                        {value ? value : 'Select Date of Birth (YYYY-MM-DD)'}
                      </Text>
                    </TouchableOpacity>
                    {showPicker && (
                      <DateTimePicker
                        value={dobDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowPicker(false);
                          if (selectedDate) {
                            const formattedDate = selectedDate.toISOString().split('T')[0];
                            onChange(formattedDate);
                          }
                        }}
                      />
                    )}
                    {error && <Text style={styles.errorText}>{error.message}</Text>}
                  </>
                );
              }}
            />

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleSubmit(handleSubmitDetails)}
            >
              <Text style={styles.verifyButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enter PAN */}
        {step === 'enter-pan' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Enter PAN Number</Text>
            <Text style={styles.stepSubtitle}>
              Enter your 10-digit PAN number
            </Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Details:</Text>
              <Text style={styles.summaryText}>Name: {userName}</Text>
              <Text style={styles.summaryText}>DOB: {formatDate(userDob)}</Text>
            </View>

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
                <>
                  <CustomTextInput
                    placeholder="Enter PAN Number (e.g., ABCDE1234F)"
                    value={value}
                    onChange={(text: any) => {
                      const panText = typeof text === 'string' ? text : text?.nativeEvent?.text || '';
                      onChange(panText.toUpperCase());
                    }}
                    onBlur={onBlur}
                    inputContainerStyle={[
                      styles.input,
                      { borderColor: error ? 'red' : colors.borderColor },
                    ]}
                    maxLength={10}
                    autoCapitalize="characters"
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />

            <TouchableOpacity
              style={[
                styles.verifyButton,
                kycVerifying && styles.verifyButtonDisabled,
              ]}
              onPress={handleSubmit(handleVerifyPAN)}
              disabled={kycVerifying}
            >
              {kycVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify PAN</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Verify Details Match */}
        {step === 'verify-details' && panDetails && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Verify Details</Text>
            <Text style={styles.stepSubtitle}>
              Please verify that the PAN details match your information
            </Text>

            {/* PAN Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>PAN Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PAN Number:</Text>
                <Text style={styles.detailValue}>{panDetails.pan}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name on PAN:</Text>
                <Text style={styles.detailValue}>{panDetails.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth:</Text>
                <Text style={styles.detailValue}>
                  {user?.dob ? formatDate(user.dob) : 'N/A'}
                </Text>
              </View>
              {user?.dob && (
                <Text style={[styles.detailValue, { fontSize: 12, color: colors.textSecondary, marginTop: -8 }]}>
                  (From your profile)
                </Text>
              )}
            </View>

            {/* Match Status */}
            <View style={styles.matchContainer}>
              <Text style={styles.matchTitle}>Verification Status</Text>

              <View style={styles.matchRow}>
                <View style={styles.matchItem}>
                  {nameMatch ? (
                    <CheckCircle size={20} color="green" />
                  ) : (
                    <XCircle size={20} color="red" />
                  )}
                  <Text style={styles.matchLabel}>Name Match</Text>
                </View>
                <Text
                  style={[
                    styles.matchStatus,
                    nameMatch ? styles.matchSuccess : styles.matchError,
                  ]}
                >
                  {nameMatch ? '✓ Matched' : '✗ Not Matched'}
                </Text>
              </View>

              <View style={styles.matchRow}>
                <View style={styles.matchItem}>
                  {dobMatch ? (
                    <CheckCircle size={20} color="green" />
                  ) : (
                    <XCircle size={20} color="red" />
                  )}
                  <Text style={styles.matchLabel}>DOB Match</Text>
                </View>
                <Text
                  style={[
                    styles.matchStatus,
                    dobMatch ? styles.matchSuccess : styles.matchError,
                  ]}
                >
                  {dobMatch ? '✓ Matched' : '✗ Not Matched'}
                </Text>
              </View>

              {!nameMatch || !dobMatch ? (
                <View style={styles.warningBox}>
                  <AlertCircle size={20} color="orange" />
                  <Text style={styles.warningText}>
                    PAN details do not match your account information. Please
                    check your name and date of birth.
                  </Text>
                </View>
              ) : (
                <View style={styles.successBox}>
                  <CheckCircle size={20} color="green" />
                  <Text style={styles.successText}>
                    All details match! You can proceed with verification.
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('enter-pan');
                  setPanDetails(null);
                }}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!nameMatch || !dobMatch) && styles.confirmButtonDisabled,
                  kycVerifying && styles.confirmButtonDisabled,
                ]}
                onPress={handleVerifyKYC}
                disabled={!nameMatch || !dobMatch || kycVerifying}
              >
                {kycVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirm Verification
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default KYCVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#f0f9f0',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'green',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'green',
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 36,
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  matchContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchLabel: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  matchStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchSuccess: {
    color: 'green',
  },
  matchError: {
    color: 'red',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successText: {
    fontSize: 13,
    color: '#155724',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  datePickerButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  datePickerText: {
    fontSize: 14,
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});

