import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { User2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../components/CustomInput';
import { updateProfile } from '../../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../store/Common';
import DateTimePicker from 'react-native-modal-datetime-picker';

const UserProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const [imageAdd, setImageAdd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
      name: user?.name || '',
      dob: user?.dob || '',
    },
  });

  /* ================= IMAGE PICKER ================= */

  const imagePicker = async () => {
    try {
      const res = await pick({
        type: [types.images],
      });

      if (!res?.length) return;

      const file = {
        uri: res[0].uri,
        type: res[0].type,
        name: res[0].name || 'image.jpg',
      };

      uploadImage(file);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Image Picker Failed',
        position: 'bottom',
      });
    }
  };

  const uploadImage = async (file: any) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await dispatch(uploadShipDoc(formData)).unwrap();
      setImageAdd(res?.data?.url);

      Toast.show({
        type: 'success',
        text1: 'Image uploaded successfully',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Image upload failed',
        position: 'bottom',
      });
    } finally {
      setUploading(false);
    }
  };

  /* ================= UPDATE PROFILE ================= */

  const onUpdate = async (data: any) => {
    if (uploading) {
      Toast.show({
        type: 'info',
        text1: 'Image is uploading',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: data?.name,
        dob: data?.dob,
        profile_image: imageAdd || user?.profile_image,
      };

      // return

      await dispatch(updateProfile(payload)).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully',
        position: 'bottom',
      });

      navigation.goBack();
      reset();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="My Profile" />

      <View style={styles.content}>
        {/* PROFILE IMAGE */}
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={uploading ? undefined : imagePicker}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : user?.profile_image || imageAdd ? (
            <Image
              source={{ uri: imageAdd || user?.profile_image }}
              style={styles.profileImage}
            />
          ) : (
            <User2 size={50} color={colors.text} />
          )}

          <Text style={styles.uploadText}>Upload Profile Picture</Text>
        </TouchableOpacity>

        {/* NAME */}
        <Text style={styles.label}>Full Name</Text>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <CustomTextInput
              placeholder="Enter Full Name"
              value={value}
              onChange={onChange}
              inputContainerStyle={styles.input}
            />
          )}
        />

        {/* DOB */}
        <Text style={styles.label}>Date of Birth</Text>
        <Controller
          name="dob"
          control={control}
          render={({ field: { value, onChange } }) => (
            <>
              <TouchableOpacity
                style={[styles.input, styles.datePicker]}
                onPress={() => setShowDobPicker(true)}
              >
                <Text style={{ color: value ? colors.text : '#999' }}>
                  {value || 'Select Date of Birth'}
                </Text>
              </TouchableOpacity>

              <DateTimePicker
                isVisible={showDobPicker}
                mode="date"
                maximumDate={new Date()}
                onConfirm={(date) => {
                  setShowDobPicker(false);
                  const formatted = date.toISOString().split('T')[0];
                  onChange(formatted);
                }}
                onCancel={() => setShowDobPicker(false)}
              />
            </>
          )}
        />

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <Controller
          name="email"
          control={control}
          render={({ field: { value } }) => (
            <CustomTextInput
              value={value}
              disabled
              inputContainerStyle={styles.input}
            />
          )}
        />

        {/* PHONE */}
        <Text style={styles.label}>Phone</Text>
        <Controller
          name="phone"
          control={control}
          render={({ field: { value } }) => (
            <CustomTextInput
              value={value}
              disabled
              inputContainerStyle={styles.input}
            />
          )}
        />

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.black }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.updateButton,
              loading && { opacity: 0.6 },
            ]}
            onPress={handleSubmit(onUpdate)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default UserProfile;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: wp(20),
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: hp(25),
  },
  profileImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    marginBottom: hp(8),
  },
  uploadText: {
    fontSize: fp(14),
    color: colors.text,
  },
  label: {
    marginTop: hp(10),
    marginBottom: hp(6),
    fontSize: fp(14),
    color: colors.text,
  },
  input: {
    height: hp(44),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  datePicker: {
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: hp(30),
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    height: hp(44),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: colors.lightGrey,
  },
  updateButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
