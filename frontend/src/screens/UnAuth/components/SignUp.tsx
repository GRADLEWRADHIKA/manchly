import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import colors from '../../../utils/colors';
import { Controller, useForm } from 'react-hook-form';
import { signUp } from '../../../store/UserSlice';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { MoveRight } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <Text style={styles.label}>Full Name</Text>
      <Controller
        name="name"
        control={control}
        rules={{
          required: 'Please enter your full name',
        }}
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
                {value ? value : 'Select Date'}
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
            style={styles.input}
          />
        )}
      />

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
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.btnHeaderText}>Create Account</Text>
            <MoveRight />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 35,
    fontWeight: '600',
    color: colors.white,
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
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  btnHeaderText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 16,
  },
});
