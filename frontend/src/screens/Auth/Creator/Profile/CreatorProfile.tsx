import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { User2, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../components/CustomInput';
import { updateProfile } from '../../../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../../store/Common';

const CreatorProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const [imageAdd, setImageAdd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
      name: user?.name || '',
    },
  });

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
        profile_image: imageAdd || user?.profile_image,
      };

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

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Creator Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE IMAGE */}
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={uploading ? undefined : imagePicker}
          disabled={uploading}
        >
          <View style={styles.imageWrapper}>
            {uploading ? (
              <ActivityIndicator color={colors.white} size="large" />
            ) : user?.profile_image || imageAdd ? (
              <Image
                source={{ uri: imageAdd || user?.profile_image }}
                style={styles.profileImage}
              />
            ) : (
              <User2 size={wp(50)} color={colors.white} />
            )}
            <View style={styles.cameraIcon}>
              <Camera size={wp(16)} color={colors.white} />
            </View>
          </View>
          <Text style={styles.uploadText}>Change Profile Picture</Text>
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

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <Controller
          name="email"
          control={control}
          render={({ field: { value } }) => (
            <CustomTextInput
              value={value}
              disabled
              inputContainerStyle={[styles.input, styles.disabledInput]}
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
              inputContainerStyle={[styles.input, styles.disabledInput]}
            />
          )}
        />

        {/* KYC STATUS */}
        <View style={styles.kycCard}>
          <Text style={styles.kycLabel}>KYC Status</Text>
          <Text
            style={[
              styles.kycStatus,
              { color: user?.kyc_verified ? colors.success : colors.error },
            ]}
          >
            {user?.kyc_verified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>

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
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(20),
    paddingBottom: hp(40),
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: hp(25),
  },
  imageWrapper: {
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  profileImage: {
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(2),
    borderColor: colors.white,
  },
  uploadText: {
    fontSize: fp(14),
    color: colors.primary,
    fontWeight: '500',
  },
  label: {
    marginTop: hp(10),
    marginBottom: hp(6),
    fontSize: fp(14),
    fontWeight: '500',
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
  bioInput: {
    height: hp(100),
    alignItems: 'flex-start',
    paddingVertical: hp(10),
  },
  disabledInput: {
    backgroundColor: colors.surface,
  },
  kycCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(16),
    padding: wp(14),
    borderRadius: wp(8),
    backgroundColor: colors.surface,
  },
  kycLabel: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.text,
  },
  kycStatus: {
    fontSize: fp(14),
    fontWeight: '700',
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
