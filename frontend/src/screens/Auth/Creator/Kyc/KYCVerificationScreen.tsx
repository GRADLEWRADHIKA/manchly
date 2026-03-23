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
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import CustomTextInput from '../../../../components/CustomInput';
import { verifyPAN } from '../../../../store/UserSlice';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

const KYCVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer
  );

  const [loading, setLoading] = useState(false)

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

  const onSubmit = (data) => {
    setLoading(true)
    const payload = {
      pan_number: data?.pan_number,
      user_name: data?.full_name,
      user_dob: data?.dob
    };
    dispatch(verifyPAN(payload))
      .unwrap()
      .then(response => {
        reset();
        Toast.show({
          type: 'success',
          text1: response?.message,
          position: 'bottom',
        });
        setLoading(false);
      })
      .catch(error => {
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="KYC Verification" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        <View style={styles.infoCard}>
          <Shield size={wp(24)} color={colors.primary} />
          <Text style={styles.infoTitle}>Verify Your Identity</Text>
          <Text style={styles.infoText}>
            Enter your details and PAN number to verify your identity. We'll match them with your PAN card information.
          </Text>
        </View>

        <View style={styles.stepContainer}>

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
                  disabled={true}
                  onBlur={onBlur}
                  inputContainerStyle={[
                    styles.input,
                    { borderColor: error ? 'red' : colors.borderColor },
                  ]}
                />
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
                    disabled={true}
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
                </>
              );
            }}
          />

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
                <Text style={styles.inputLabel}>Enter your 10-digit PAN number</Text>
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
              </>
            )}
          />

          <TouchableOpacity
            disabled={loading}
            style={styles.verifyButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.verifyButtonText}>{loading ? <ActivityIndicator color={colors.white} size={'small'} /> : 'Verify PAN'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
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
    borderRadius: wp(12),
    padding: wp(20),
    margin: wp(16),
    alignItems: 'center',
    borderWidth: wp(1),
    borderColor: 'green',
  },
  statusTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: 'green',
    marginTop: hp(12),
  },
  statusText: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginTop: hp(8),
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(16),
    margin: wp(16),
    marginBottom: hp(8),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.text,
    marginLeft: wp(12),
    flex: 1,
  },
  infoText: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginTop: hp(4),
    marginLeft: wp(36),
    flex: 1,
  },
  stepContainer: {
    padding: wp(16),
  },
  stepTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(4),
  },
  stepSubtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginBottom: hp(20),
  },
  input: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    backgroundColor: colors.white,
    borderWidth: wp(1),
    marginBottom: hp(8),
  },
  errorText: {
    color: 'red',
    fontSize: fp(12),
    marginBottom: hp(12),
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: wp(10),
    paddingVertical: hp(14),
    alignItems: 'center',
    marginTop: hp(8),
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: fp(16),
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(16),
    marginTop: hp(16),
    marginBottom: hp(20),
  },
  detailsTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(16),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  detailLabel: {
    fontSize: fp(14),
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  matchContainer: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(16),
    marginBottom: hp(20),
  },
  matchTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(16),
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchLabel: {
    fontSize: fp(14),
    color: colors.text,
    marginLeft: wp(8),
  },
  matchStatus: {
    fontSize: fp(14),
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
    borderRadius: wp(8),
    padding: wp(12),
    marginTop: hp(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: fp(13),
    color: '#856404',
    marginLeft: wp(8),
    flex: 1,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderRadius: wp(8),
    padding: wp(12),
    marginTop: hp(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successText: {
    fontSize: fp(13),
    color: '#155724',
    marginLeft: wp(8),
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(8),
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: wp(10),
    paddingVertical: hp(14),
    alignItems: 'center',
    borderWidth: wp(1),
    borderColor: colors.borderColor,
  },
  backButtonText: {
    color: colors.text,
    fontSize: fp(16),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: wp(10),
    paddingVertical: hp(14),
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: fp(16),
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(8),
    marginTop: hp(12),
  },
  datePickerButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  datePickerText: {
    fontSize: fp(14),
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(8),
    padding: wp(12),
    marginBottom: hp(16),
  },
  summaryTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(8),
  },
  summaryText: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginBottom: hp(4),
  },
});