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
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { User2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../components/CustomInput';
import { updateProfile } from '../../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import DocumentPicker, { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../store/Common';

const UserProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const [imageAdd, setImageAdd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  console.log('----user------', user)

  const imagePicker = async () => {
    try {
      const res = await pick({
        type: [types.images],
      });

      if (!res || res.length === 0) return;

      const picked = {
        uri: res[0].uri,
        type: res[0].type,
        name: res[0].name,
        size: res[0].size,
      };

      pickImageUpload(picked);
    } catch (err: any) {
      console.error('Document Picker Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Image Picker Error',
        text2: 'Unable to pick the image. Please try again.',
        position: 'bottom',
      });
    }
  };

  const pickImageUpload = async (file: any) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name || 'upload.jpg',
      });

      const res: any = await dispatch(uploadShipDoc(formData)).unwrap();
      const newData = res?.data?.url;
      setImageAdd(newData);

      Toast.show({
        type: 'success',
        text1: 'Image uploaded successfully',
        position: 'bottom',
      });
    } catch (err: any) {
      console.error('Image Upload Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Please try again later.',
        position: 'bottom',
      });
    } finally {
      setUploading(false);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: user?.email,
      phone: user?.phone,
      name: user?.name,
    },
  });

  const onUpdate = async (data: any) => {
    if (uploading) {
      Toast.show({
        type: 'info',
        text1: 'Please wait',
        text2: 'Image is still uploading...',
        position: 'bottom',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: data?.name || user?.name,
        profile_image: imageAdd || user?.profile_image,
      };

      const response = await dispatch(updateProfile(payload)).unwrap();
      console.log('----response----', response);

      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully',
        position: 'bottom',
      });

      navigation.goBack();
      reset();
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Something went wrong. Please try again.',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="My Profile" />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={uploading ? undefined : imagePicker}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.uploadingView}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          ) : user?.profile_image || imageAdd ? (
            <Image
              source={{ uri: imageAdd || user?.profile_image }}
              style={styles.profileImage}
            />
          ) : (
            <User2 size={50} color={colors.text} />
          )}

          {!uploading && (
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Full Name</Text>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Please enter your name' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <CustomTextInput
              placeholder="Enter Full Name"
              inputContainerStyle={[
                styles.input,
                { borderColor: error ? 'red' : colors.borderColor },
              ]}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Email Address</Text>
        <Controller
          name="email"
          control={control}
          render={({ field: { value } }) => (
            <CustomTextInput
              placeholder="Enter Email Address"
              keyboardType="email-address"
              inputContainerStyle={[
                styles.input,
                { borderColor: colors.borderColor },
              ]}
              disabled
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Phone Number</Text>
        <Controller
          name="phone"
          control={control}
          render={({ field: { value } }) => (
            <CustomTextInput
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
              inputContainerStyle={[
                styles.input,
                { borderColor: colors.borderColor },
              ]}
              disabled
              value={value}
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}
            disabled={loading || uploading}
          >
            <Text style={[styles.buttonText, { color: colors.black }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.updateButton,
              (loading || uploading) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit(onUpdate)}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadingView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: colors.lightGrey,
    borderWidth: 1,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    flex: 0.48,
    height: 44,
    borderRadius: 8,
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
    fontSize: 16,
  },
});
