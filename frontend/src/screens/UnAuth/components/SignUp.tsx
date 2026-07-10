import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { Controller, useForm } from 'react-hook-form';
import { signUp } from '../../../store/UserSlice';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { MoveRight, AlertTriangle, Check } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import { navigationRef } from '../../../navigation/navigationRef';

const BUSINESS_ROLE_OPTIONS = [
  { label: 'Brand', value: 'BRAND' },
  { label: 'Agency', value: 'AGENCY' },
];

const SignUp = ({ selectedType, setActive }) => {
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);

  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dob: '',
      businessRole: 'BRAND',
      companyName: '',
    },
  });

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const onSubmit = data => {
    setLoading(true);
    const effectiveRole = isBusinessAccount ? data.businessRole : selectedType;

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      user_type: effectiveRole,
      ...(isBusinessAccount ? { company_name: data.companyName } : {}),
    };

    dispatch(signUp(payload))
      .unwrap()
      .then(() => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
          position: 'bottom',
        });

        if (['BRAND', 'AGENCY'].includes(effectiveRole)) {
          setTimeout(() => {
            navigationRef.current?.navigate('LoginScreen');
          }, 250);
          return;
        }

        setActive(1);
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          text1: err?.message || 'Something went wrong',
        });
      })
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setActive(2);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => backHandler.remove();
    }, [setActive]),
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sign Up</Text>

      {selectedType === 'CREATOR' ? (
        <View style={styles.warningBox}>
          <AlertTriangle size={18} color="#FFC107" />
          <Text style={styles.warningText}>
            Please enter your exact Full Name and Date of Birth as per your PAN
            card. These details cannot be changed later.
          </Text>
        </View>
      ) : null}

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Please enter your full name' }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Enter full name"
            placeholderTextColor={colors.white}
            value={value}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      {/* DOB */}
      <Text style={styles.label}>Date of Birth</Text>
      <Controller
        control={control}
        name="dob"
        rules={{ required: 'Please select date of birth' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TouchableOpacity
              style={[
                styles.input,
                { justifyContent: 'center' },
                error && { borderColor: 'red' },
              ]}
              onPress={showDatePicker}
            >
              <Text style={{ color: colors.white }}>
                {value || 'Select Date'}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              maximumDate={new Date()}
              onConfirm={date => {
                const formattedDate = `${date.getFullYear()}-${String(
                  date.getMonth() + 1,
                ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                onChange(formattedDate);
                hideDatePicker();
              }}
              onCancel={hideDatePicker}
            />
          </>
        )}
      />

      {/* Email */}
      <Text style={styles.label}>Email Address</Text>
      <Controller
        name="email"
        control={control}
        rules={{
          required: 'Please enter your email',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Enter valid email',
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Enter email"
            placeholderTextColor={colors.white}
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        )}
      />

      {/* Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <Controller
        name="phone"
        control={control}
        rules={{
          required: 'Enter phone number',
          pattern: {
            value: /^\d{10}$/,
            message: 'Enter valid 10-digit number',
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Enter phone number"
            placeholderTextColor={colors.white}
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
            style={styles.input}
          />
        )}
      />

      <TouchableOpacity
        style={styles.checkboxRow}
        activeOpacity={0.85}
        onPress={() => setIsBusinessAccount(prev => !prev)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isBusinessAccount }}
      >
        <View
          style={[
            styles.checkbox,
            isBusinessAccount && styles.checkboxChecked,
          ]}
        >
          {isBusinessAccount ? (
            <Check size={wp(14)} color={colors.primary} strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.checkboxLabel}>Are you a Brand or Agency?</Text>
      </TouchableOpacity>

      {isBusinessAccount ? (
        <>
          <Text style={styles.label}>Business Role</Text>
          <Controller
            control={control}
            name="businessRole"
            rules={{ required: 'Select Brand or Agency' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Dropdown
                style={[styles.dropdown, error && styles.errorBorder]}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                itemTextStyle={styles.dropdownItem}
                containerStyle={styles.dropdownContainer}
                data={BUSINESS_ROLE_OPTIONS}
                labelField="label"
                valueField="value"
                value={value}
                placeholder="Select role"
                onChange={item => onChange(item.value)}
              />
            )}
          />

          <Text style={styles.label}>Company Name</Text>
          <Controller
            name="companyName"
            control={control}
            rules={{
              validate: value =>
                !isBusinessAccount || value?.trim()?.length > 0
                  ? true
                  : 'Company name is required',
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextInput
                placeholder="Enter company name"
                placeholderTextColor={colors.white}
                value={value}
                onChangeText={onChange}
                style={[styles.input, error && styles.errorBorder]}
              />
            )}
          />
        </>
      ) : null}

      {/* Button */}
      <TouchableOpacity
        style={styles.btnHeader}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.btnHeaderText}>Create Account</Text>
            <MoveRight color={colors.primary} />
          </>
        )}
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(50),
    paddingBottom: hp(40),
    paddingHorizontal: wp(20),
    flexGrow: 1,
  },

  title: {
    fontSize: fp(35),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },

  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: wp(8),
    padding: wp(10),
    marginBottom: hp(15),
    borderLeftWidth: wp(4),
    borderLeftColor: '#FFC107',
    gap: wp(8),
  },

  warningText: {
    color: '#FFC107',
    fontSize: fp(13),
    flex: 1,
    lineHeight: fp(18),
  },

  label: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.white,
    marginBottom: hp(6),
    marginTop: hp(10),
  },

  input: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    backgroundColor: 'grey',
    borderWidth: wp(1.5),
    marginBottom: hp(4),
    borderColor: colors.white,
    color: colors.white,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    marginTop: hp(10),
  },

  checkbox: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(6),
    borderWidth: wp(1.5),
    borderColor: colors.white,
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },

  checkboxLabel: {
    flex: 1,
    color: colors.white,
    fontSize: fp(14),
    fontWeight: '500',
  },

  dropdown: {
    height: hp(44),
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    backgroundColor: 'grey',
    borderWidth: wp(1.5),
    borderColor: colors.white,
    marginBottom: hp(4),
  },

  dropdownContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: colors.white,
    borderRadius: wp(8),
  },

  dropdownPlaceholder: {
    color: colors.white,
    fontSize: fp(14),
  },

  dropdownSelected: {
    color: colors.white,
    fontSize: fp(14),
  },

  dropdownItem: {
    color: colors.white,
    fontSize: fp(14),
  },

  errorBorder: {
    borderColor: colors.error,
  },

  btnHeader: {
    backgroundColor: colors.white,
    padding: wp(12),
    borderRadius: wp(8),
    marginTop: hp(25),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(10),
  },

  btnHeaderText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fp(16),
  },
});
