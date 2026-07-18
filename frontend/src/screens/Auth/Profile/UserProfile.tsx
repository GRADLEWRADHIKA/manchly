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
  Facebook,
  Instagram,
  CheckCircle2,
  Clock,
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
      <AppHeaderWithBack title="Edit Profile" />

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
                <ActivityIndicator color={colors.textPrimary} size="large" />
              ) : user?.profile_image || imageAdd ? (
                <Image
                  source={{ uri: imageAdd || user?.profile_image }}
                  style={styles.profileImage}
                />
              ) : (
                <User2 size={wp(44)} color={colors.textPrimary} />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Camera size={wp(14)} color={colors.textPrimary} />
            </View>
          </Pressable>

          <Text style={styles.profileName}>{displayName}</Text>

          <Pressable style={({ pressed }) => [styles.shareBtn, pressed && styles.btnPressed]}>
            <Text style={styles.shareBtnText}>Share Profile</Text>
          </Pressable>

          <View style={styles.socialRow}>
            <View style={styles.socialIconWrap}>
              <Facebook size={wp(18)} color="#4267B2" fill="#4267B2" />
            </View>
            <View style={styles.socialIconWrap}>
              <Instagram size={wp(18)} color="#E1306C" />
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formCard}>
          {/* NAME */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
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

          {/* DATE OF BIRTH (mock/static, not wired to the form) */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.mockPlaceholderText}>00/00/0000</Text>
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
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

          {/* PHONE */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PHONE</Text>
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

        {/* Stats Cards (hardcoded per design mock) */}
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <CheckCircle2 size={wp(18)} color={colors.faaAiBlue} />
          </View>
          <Text style={styles.statLabel}>COURSES COMPLETED</Text>
          <Text style={styles.statValue}>24</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Clock size={wp(18)} color={colors.faaAiBlue} />
          </View>
          <Text style={styles.statLabel}>HOURS LEARNED</Text>
          <Text style={styles.statValue}>158</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
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
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.updateButtonText}>Save Changes</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.btnPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(14),
  },
  imageWrapper: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.faaAiBlue,
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
    backgroundColor: colors.faaAiBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: hp(14),
  },
  shareBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(20),
    paddingVertical: hp(9),
    paddingHorizontal: wp(24),
    marginBottom: hp(14),
  },
  shareBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: wp(14),
  },
  socialIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Card
  formCard: {
    backgroundColor: colors.surface,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(16),
    padding: wp(16),
  },
  fieldRow: {
    marginBottom: hp(16),
  },
  fieldLabel: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: hp(6),
    textTransform: 'uppercase',
  },
  input: {
    height: hp(44),
    borderWidth: 0,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  inputText: {
    fontSize: fp(14),
    color: colors.textPrimary,
  },
  disabledInput: {
    backgroundColor: colors.inputBg,
  },
  disabledText: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  mockPlaceholderText: {
    fontSize: fp(14),
    color: colors.textMuted,
  },

  // Stats Cards
  statCard: {
    backgroundColor: colors.surface,
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderRadius: wp(16),
    paddingVertical: hp(18),
    alignItems: 'center',
  },
  statIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(96,165,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(8),
  },
  statLabel: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: hp(4),
  },
  statValue: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Buttons
  buttonContainer: {
    marginTop: hp(24),
    marginHorizontal: wp(16),
    gap: wp(12),
  },
  updateButton: {
    height: hp(50),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.faaAiBlue,
  },
  updateButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: fp(15),
  },
  backButton: {
    height: hp(50),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: fp(15),
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});