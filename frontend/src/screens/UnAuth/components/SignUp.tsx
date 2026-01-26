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
import { Controller, useForm } from 'react-hook-form';
import { signUp } from '../../../store/UserSlice';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { MoveRight } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from '@react-navigation/native';

const SignUp = ({ selectedType, setActive }) => {
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

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
    },
  });

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const onSubmit = data => {
    setLoading(true);

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      user_type: selectedType,
    };
    // console.log('---payload--', payload)
    // return
    dispatch(signUp(payload))
      .unwrap()
      .then(() => {
        reset();
        setActive(1);
        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
          position: 'bottom',
        });
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

      // Add the listener and store the subscription
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Cleanup function
      return () => backHandler.remove();
    }, [setActive]), // Add setActive to dependencies
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sign Up</Text>

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
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    flexGrow: 1,
  },

  title: {
    fontSize: 35,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: 'grey',
    borderWidth: 1.5,
    marginBottom: 4,
    borderColor: colors.white,
    color: colors.white,
  },

  btnHeader: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  btnHeaderText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
