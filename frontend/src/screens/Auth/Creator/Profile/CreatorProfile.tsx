import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {
  User2,
  Camera,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
  Pen,
  Lock,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../components/CustomInput';
import { updateProfile } from '../../../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../../store/Common';
import DateTimePicker from '@react-native-community/datetimepicker';
import { resetKYC } from '../../../../services/KYCService';
import LinearGradient from 'react-native-linear-gradient';


const CreatorProfile = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const [imageAdd, setImageAdd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showKycWarningModal, setShowKycWarningModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
      name: user?.name || '',
      dob: user?.dob || '',
    },
  });

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date(2000, 0, 1);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(2000, 0, 1);
  };

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

    const nameChanged = data?.name?.trim() !== (user?.name || '').trim();
    const dobChanged = data?.dob !== (user?.dob || '');

    if ((nameChanged || dobChanged) && user?.kyc_verified) {
      setPendingFormData(data);
      setShowKycWarningModal(true);
      return;
    }

    await saveProfile(data);
  };

  const saveProfile = async (data: any) => {
    setLoading(true);
    try {
      const nameChanged = data?.name?.trim() !== (user?.name || '').trim();
      const dobChanged = data?.dob !== (user?.dob || '');

      // Reset KYC if name or dob changed and user was verified
      if ((nameChanged || dobChanged) && user?.kyc_verified) {
        try {
          await resetKYC();
        } catch (e) {
          // Continue with profile update even if KYC reset fails
          console.log('KYC reset error:', e);
        }
      }

      const payload: any = {
        name: data?.name,
        profile_image: imageAdd || user?.profile_image,
        user_type: user?.user_type,
      };

      if (data?.dob) {
        payload.dob = data.dob;
      }

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
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={uploading ? undefined : imagePicker}
            disabled={uploading}
            activeOpacity={0.8}
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
          </TouchableOpacity>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>

          {/* KYC Badge */}
          <View
            style={[
              styles.kycBadge,
              {
                backgroundColor: user?.kyc_verified ? colors.success + '15' : colors.error + '15',
                borderColor: user?.kyc_verified ? colors.success + '40' : colors.error + '40',
              },
            ]}
          >
            {user?.kyc_verified ? (
              <ShieldCheck size={wp(14)} color={colors.success} />
            ) : (
              <ShieldX size={wp(14)} color={colors.error} />
            )}
            <Text
              style={[
                styles.kycBadgeText,
                { color: user?.kyc_verified ? colors.success : colors.error },
              ]}
            >
              {user?.kyc_verified ? 'KYC Verified' : 'KYC Not Verified'}
            </Text>
          </View>
        </LinearGradient>

        {/* Form Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.formCard}>
          {/* NAME */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Pen size={wp(16)} color={colors.info} />
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

          {/* DOB */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Calendar size={wp(16)} color={colors.info} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <Controller
                name="dob"
                control={control}
                render={({ field: { value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !value && { color: colors.muted },
                        ]}
                      >
                        {value ? formatDisplayDate(value) : 'Select Date of Birth'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={parseDateString(value)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={(event: any, selectedDate?: Date) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            const year = selectedDate.getFullYear();
                            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(selectedDate.getDate()).padStart(2, '0');
                            setValue('dob', `${year}-${month}-${day}`);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* EMAIL */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Mail size={wp(16)} color={colors.muted} />
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
            <View style={styles.fieldIcon}>
              <Phone size={wp(16)} color={colors.muted} />
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.updateButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit(onUpdate)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.updateButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* KYC Warning Modal */}
      <Modal
        visible={showKycWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKycWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconWrap}>
              <AlertTriangle size={wp(32)} color={colors.secondary} />
            </View>
            <Text style={styles.modalTitle}>KYC Will Be Reset</Text>
            <Text style={styles.modalMessage}>
              Changing your name or date of birth will reset your KYC verification. You will need to complete KYC verification again.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowKycWarningModal(false);
                  setPendingFormData(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowKycWarningModal(false);
                  if (pendingFormData) {
                    saveProfile(pendingFormData);
                    setPendingFormData(null);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreatorProfile;

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
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    elevation: 3,
    shadowColor: '#0F3460',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(14),
  },
  imageWrapper: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(96,165,250,0.5)',
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
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  profileEmail: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(2),
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(12),
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(20),
    borderWidth: 1,
  },
  kycBadgeText: {
    fontSize: fp(12),
    fontWeight: '700',
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
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primary,
  },
  updateButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(20),
    paddingVertical: hp(28),
    paddingHorizontal: wp(24),
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: colors.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(24),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(12),
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fp(14),
  },
  modalConfirmBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  modalConfirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(14),
  },
});
