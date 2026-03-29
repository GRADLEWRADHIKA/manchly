import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import {
  User2,
  Camera,
  Mail,
  Phone,
  Pen,
  Lock,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../components/CustomInput';
import { updateProfile } from '../../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../store/Common';

const UserProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const [imageAdd, setImageAdd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'User';

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
        profile_image: imageAdd || user?.profile_image,
        user_type: user?.user_type,
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
      <AppHeaderWithBack title="My Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Pressable
            style={styles.avatarWrap}
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
                <User2 size={wp(44)} color={colors.white} />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Camera size={wp(14)} color={colors.white} />
            </View>
          </Pressable>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>

        {/* Form Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.formCard}>
          {/* NAME */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, { backgroundColor: '#EFF6FF' }]}>
              <Pen size={wp(16)} color={colors.info} strokeWidth={1.8} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Full Name</Text>
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
                    inputStyle={styles.inputText}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* EMAIL */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, { backgroundColor: colors.surface }]}>
              <Mail size={wp(16)} color={colors.muted} strokeWidth={1.8} />
            </View>
            <View style={styles.fieldContent}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.lockedBadge}>
                  <Lock size={wp(10)} color={colors.muted} />
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              </View>
              <Controller
                name="email"
                control={control}
                render={({ field: { value } }) => (
                  <CustomTextInput
                    value={value}
                    disabled
                    inputContainerStyle={[styles.input, styles.disabledInput]}
                    inputStyle={styles.disabledText}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* PHONE */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, { backgroundColor: colors.surface }]}>
              <Phone size={wp(16)} color={colors.muted} strokeWidth={1.8} />
            </View>
            <View style={styles.fieldContent}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <View style={styles.lockedBadge}>
                  <Lock size={wp(10)} color={colors.muted} />
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              </View>
              <Controller
                name="phone"
                control={control}
                render={({ field: { value } }) => (
                  <CustomTextInput
                    value={value}
                    disabled
                    inputContainerStyle={[styles.input, styles.disabledInput]}
                    inputStyle={styles.disabledText}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.btnPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.updateButton,
              loading && { opacity: 0.6 },
              pressed && !loading && styles.btnPressed,
            ]}
            onPress={handleSubmit(onUpdate)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.updateButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserProfile;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(14),
  },
  imageWrapper: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.secPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.secPrimary + '40',
  },
  profileImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
  },
  cameraIcon: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(2),
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: colors.secPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.text,
  },
  profileEmail: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(2),
  },

  // Section
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: wp(20),
    marginTop: hp(24),
    marginBottom: hp(10),
  },

  // Form Card
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    paddingVertical: hp(6),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  fieldIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    marginTop: hp(2),
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: hp(4),
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  lockedText: {
    fontSize: fp(10),
    color: colors.muted,
    fontWeight: '500',
  },
  input: {
    height: hp(42),
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  inputText: {
    fontSize: fp(14),
    color: colors.text,
  },
  placeholderText: {
    color: '#999',
  },
  disabledInput: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  disabledText: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginHorizontal: wp(16),
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    marginTop: hp(24),
    marginHorizontal: wp(16),
    gap: wp(12),
  },
  backButton: {
    flex: 1,
    height: hp(48),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fp(15),
  },
  updateButton: {
    flex: 2,
    height: hp(48),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secPrimary,
  },
  updateButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
