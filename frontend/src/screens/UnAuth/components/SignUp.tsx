import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Dimensions
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
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
            navigationRef.current?.navigate('UserBottomTab', {
              screen: 'BrandMarketplace',
            });
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
    <View style={styles.screen}>
      <Image
        source={require('../../../image/boarding.jpg')}
        style={styles.heroImage}
        resizeMode="cover"
      />

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
        <Text style={styles.label}>FULL NAME</Text>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Please enter your full name' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter full name"
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />

        {/* DOB */}
        <Text style={styles.label}>DATE OF BIRTH</Text>
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
                  error && styles.errorBorder,
                ]}
                onPress={showDatePicker}
              >
                <Text style={value ? styles.inputValueText : styles.inputPlaceholderText}>
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
        <Text style={styles.label}>EMAIL ADDRESS</Text>
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
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />

        {/* Phone */}
        <Text style={styles.label}>PHONE NUMBER</Text>
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
              placeholderTextColor={colors.textMuted}
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
              <Check size={wp(14)} color={colors.black} strokeWidth={3} />
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>Are you a Brand or Agency?</Text>
        </TouchableOpacity>

        {isBusinessAccount ? (
          <>
            <Text style={styles.label}>BUSINESS ROLE</Text>
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

            <Text style={styles.label}>COMPANY NAME</Text>
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
                  placeholderTextColor={colors.textMuted}
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
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <LinearGradient
            colors={['#F7D488', '#EBA83F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnHeader}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.btnHeaderText}>Create Account</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  screen: {
    height: SCREEN_HEIGHT,
    backgroundColor: colors.black,
  },
  heroImage: {
    width: '100%',
    height: hp(230),
    backgroundColor: colors.black,
  },

  scrollFlex: {
    flex: 1,
  },

  container: {
    backgroundColor: '#141414',
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    marginTop: -hp(24),
    paddingTop: hp(28),
    paddingBottom: hp(40),
    paddingHorizontal: wp(20),
    flexGrow: 1,
  },

  title: {
    fontSize: fp(30),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(16),
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
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.micButtonGolden,
    letterSpacing: 0.6,
    marginBottom: hp(7),
    marginTop: hp(14),
    textTransform: 'uppercase',
  },

  input: {
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    height: hp(46),
    backgroundColor: '#1E1E1E',
    borderWidth: 0,
    marginBottom: hp(4),
    color: colors.white,
  },
  inputValueText: {
    fontSize: fp(14),
    color: colors.white,
  },
  inputPlaceholderText: {
    fontSize: fp(14),
    color: colors.textMuted,
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
    borderColor: colors.micButtonGolden,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.golden,
    borderColor: colors.golden,
  },

  checkboxLabel: {
    flex: 1,
    color: colors.white,
    fontSize: fp(14),
    fontWeight: '500',
  },

  dropdown: {
    height: hp(46),
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    backgroundColor: '#1E1E1E',
    borderWidth: 0,
    marginBottom: hp(4),
  },

  dropdownContainer: {
    backgroundColor: '#1E1E1E',
    borderColor: colors.border,
    borderRadius: wp(8),
  },

  dropdownPlaceholder: {
    color: colors.textMuted,
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
    borderWidth: wp(1.5),
    borderColor: colors.error,
  },

 btnHeader: {
    padding: wp(14),
    borderRadius: wp(10),
    marginTop: hp(28),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnHeaderText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: fp(16),
  },
});