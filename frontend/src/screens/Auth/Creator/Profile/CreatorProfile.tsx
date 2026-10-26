import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {
  User2,
  Camera,
  Mail,
  Phone,
  Lock,
  Calendar,
  AlertTriangle,
  MapPin,
  FileText,
  Link2,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Pen,
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
import {
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  FacebookIcon,
} from '../../../../components/SocialIcons';
import {
  getCreatorProfile,
  updateCreatorProfile,
} from '../../../../store/CreatorProfileSlice';

const GOLD_CREAM = '#F8DEAE';

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

  const [activeEditField, setActiveEditField] = useState<
    'name' | 'dob' | 'location' | 'bio' | 'category' | 'experience' | null
  >(null);
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const { profile: creatorProfile } = useSelector(
    (state: any) => state.creatorProfileReducer,
  );

  useEffect(() => {
    dispatch(getCreatorProfile());
  }, []);

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
      name: user?.name || '',
      dob: user?.dob || '',
      instagram_link: user?.instagram_link || '',
      linkedin_link: user?.linkedin_link || '',
      youtube_link: user?.youtube_link || '',
      facebook_link: user?.facebook_link || '',
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
      return new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10),
      );
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
        position: 'top',
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
        position: 'top',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Image upload failed',
        position: 'top',
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
        position: 'top',
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

  const openFieldEditor = (
    field: 'name' | 'dob' | 'location' | 'bio' | 'category' | 'experience',
  ) => {
    if (field === 'name') setEditValue(user?.name || '');
    if (field === 'dob') setEditValue(user?.dob || '');
    if (field === 'location') setEditValue(creatorProfile?.city || '');
    if (field === 'bio') setEditValue(creatorProfile?.bio || '');
    if (field === 'category') setEditValue(creatorProfile?.niche || '');
    if (field === 'experience') setEditValue(creatorProfile?.experience || '');
    setActiveEditField(field);
  };

  const saveFieldEdit = async () => {
    if (activeEditField === 'name') {
      if (!editValue.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Name is required',
          position: 'top',
        });
        return;
      }
      setSavingField(true);
      try {
        await dispatch(
          updateProfile({
            name: editValue.trim(),
            user_type: user?.user_type,
          }),
        ).unwrap();
        Toast.show({ type: 'success', text1: 'Name updated', position: 'top' });
        setActiveEditField(null);
      } catch {
        Toast.show({ type: 'error', text1: 'Update failed', position: 'top' });
      } finally {
        setSavingField(false);
      }
      return;
    }

    if (activeEditField === 'dob') {
      setSavingField(true);
      try {
        await dispatch(
          updateProfile({ dob: editValue, user_type: user?.user_type }),
        ).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Date of birth updated',
          position: 'top',
        });
        setActiveEditField(null);
      } catch {
        Toast.show({ type: 'error', text1: 'Update failed', position: 'top' });
      } finally {
        setSavingField(false);
      }
      return;
    }

    if (activeEditField === 'location') {
      if (!editValue.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Location is required',
          position: 'top',
        });
        return;
      }
      setSavingField(true);
      try {
        await dispatch(
          updateCreatorProfile({ ...creatorProfile, city: editValue.trim() }),
        ).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Location updated',
          position: 'top',
        });
        setActiveEditField(null);
      } catch {
        // Handled by reducer toast
      } finally {
        setSavingField(false);
      }
      return;
    }

    if (activeEditField === 'bio') {
      setSavingField(true);
      try {
        await dispatch(
          updateCreatorProfile({ bio: editValue.trim() }),
        ).unwrap();
        Toast.show({ type: 'success', text1: 'Bio updated', position: 'top' });
        setActiveEditField(null);
      } catch {
        // Handled by reducer toast
      } finally {
        setSavingField(false);
      }
      return;
    }

    if (activeEditField === 'category') {
      if (!editValue.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Category is required',
          position: 'top',
        });
        return;
      }
      setSavingField(true);
      try {
        await dispatch(
          updateCreatorProfile({ niche: editValue.trim() }),
        ).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Category updated',
          position: 'top',
        });
        setActiveEditField(null);
      } catch {
        // Handled by reducer toast
      } finally {
        setSavingField(false);
      }
      return;
    }

    if (activeEditField === 'experience') {
      setSavingField(true);
      try {
        await dispatch(
          updateCreatorProfile({ experience: editValue.trim() }),
        ).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Experience updated',
          position: 'top',
        });
        setActiveEditField(null);
      } catch {
        // Handled by reducer toast
      } finally {
        setSavingField(false);
      }
      return;
    }
  };

  const saveProfile = async (data: any) => {
    setLoading(true);
    try {
      const nameChanged = data?.name?.trim() !== (user?.name || '').trim();
      const dobChanged = data?.dob !== (user?.dob || '');

      if ((nameChanged || dobChanged) && user?.kyc_verified) {
        try {
          await resetKYC();
        } catch (e) {
          console.log('KYC reset error:', e);
        }
      }

      const payload: any = {
        name: data?.name,
        profile_image: imageAdd || user?.profile_image,
        user_type: user?.user_type,
        instagram_link: data?.instagram_link || '',
        linkedin_link: data?.linkedin_link || '',
        youtube_link: data?.youtube_link || '',
        facebook_link: data?.facebook_link || '',
      };

      if (data?.dob) {
        payload.dob = data.dob;
      }

      await dispatch(updateProfile(payload)).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully',
        position: 'top',
      });

      navigation.goBack();
      reset();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="My Profile" bgColor="transparent" />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={hp(20)}
      >
        {/* Profile Card */}
        <LinearGradient
          colors={['#2E2C29', '#1C1B19']}
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
              <Camera size={wp(14)} color={colors.black} />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{displayName}</Text>

          <View style={styles.creatorPill}>
            <Text style={styles.creatorPillText}>Creator</Text>
          </View>
        </LinearGradient>

        {/* Basic Info Section */}
        <Text style={styles.sectionTitleCaps}>Basic Information</Text>
        <View style={styles.rowCard}>
          <InfoRow
            icon={User2}
            label="Name"
            value={displayName}
            onPress={() => openFieldEditor('name')}
          />
          <View style={styles.rowDivider} />
          <InfoRow icon={Mail} label="Email" value={user?.email} locked />
          <View style={styles.rowDivider} />
          <InfoRow icon={Phone} label="Phone" value={user?.phone} locked />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={user?.dob ? formatDisplayDate(user.dob) : ''}
            onPress={() => openFieldEditor('dob')}
          />
          <View style={styles.rowDivider} />
        </View>

        {/* Creator Details Section — Bio, Category, Experience combined */}
        <Text style={styles.sectionTitleCaps}>Creator Details</Text>
        <View style={styles.rowCard}>
          <InfoRow
            icon={FileText}
            label="Bio"
            value={creatorProfile?.bio || 'Tell your audience about yourself'}
            onPress={() => openFieldEditor('bio')}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={BookOpen}
            label="Your Category"
            value={creatorProfile?.niche}
            onPress={() => openFieldEditor('category')}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            icon={GraduationCap}
            label="Experience"
            value={creatorProfile?.experience}
            onPress={() => openFieldEditor('experience')}
          />
        </View>

       

        {/* Social Links Form */}
        <Text style={styles.sectionTitle}>Social Links</Text>

        <View style={styles.formCard}>
          {/* Instagram */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, styles.igFieldIcon]}>
              <InstagramIcon size={wp(16)} color="#E1306C" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Instagram</Text>
              <Controller
                name="instagram_link"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    placeholder="Paste Instagram profile link"
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

          {/* LinkedIn */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, styles.liFieldIcon]}>
              <LinkedinIcon size={wp(16)} color="#0077B5" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>LinkedIn</Text>
              <Controller
                name="linkedin_link"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    placeholder="Paste LinkedIn profile link"
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

          {/* YouTube */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, styles.ytFieldIcon]}>
              <YoutubeIcon size={wp(16)} color="#FF0000" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>YouTube</Text>
              <Controller
                name="youtube_link"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    placeholder="Paste YouTube channel link"
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

          {/* Facebook */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIcon, styles.fbFieldIcon]}>
              <FacebookIcon size={wp(16)} color="#1877F2" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Facebook</Text>
              <Controller
                name="facebook_link"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomTextInput
                    placeholder="Paste Facebook profile link"
                    value={value}
                    onChange={onChange}
                    inputContainerStyle={styles.input}
                    inputStyle={styles.inputText}
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
            <LinearGradient
              colors={['#F3C36B', '#D49A3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.updateButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Text style={styles.updateButtonText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

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
              Changing your name or date of birth will reset your KYC
              verification. You will need to complete KYC verification again.
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

      {/* Edit Field Modal */}
      <Modal
        visible={
          activeEditField === 'name' ||
          activeEditField === 'dob' ||
          activeEditField === 'location' ||
          activeEditField === 'bio' ||
          activeEditField === 'category' ||
          activeEditField === 'experience'
        }
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEditField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Edit{' '}
              {activeEditField === 'name'
                ? 'Name'
                : activeEditField === 'dob'
                ? 'Date of Birth'
                : activeEditField === 'location'
                ? 'Location'
                : activeEditField === 'bio'
                ? 'Bio'
                : activeEditField === 'category'
                ? 'Category'
                : 'Experience'}
            </Text>

            {activeEditField === 'name' && (
              <CustomTextInput
                placeholder="Enter Full Name"
                value={editValue}
                onChange={(t: any) =>
                  setEditValue(
                    typeof t === 'string' ? t : t?.nativeEvent?.text || '',
                  )
                }
                inputContainerStyle={styles.input}
                inputStyle={styles.inputText}
              />
            )}

            {activeEditField === 'dob' && (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inputText}>
                    {editValue
                      ? formatDisplayDate(editValue)
                      : 'Select Date of Birth'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={parseDateString(editValue)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event: any, selectedDate?: Date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        const year = selectedDate.getFullYear();
                        const month = String(
                          selectedDate.getMonth() + 1,
                        ).padStart(2, '0');
                        const day = String(selectedDate.getDate()).padStart(
                          2,
                          '0',
                        );
                        setEditValue(`${year}-${month}-${day}`);
                      }
                    }}
                  />
                )}
              </>
            )}

            {activeEditField === 'location' && (
              <CustomTextInput
                placeholder="e.g. Mumbai, India"
                value={editValue}
                onChange={(t: any) =>
                  setEditValue(
                    typeof t === 'string' ? t : t?.nativeEvent?.text || '',
                  )
                }
                inputContainerStyle={styles.input}
                inputStyle={styles.inputText}
              />
            )}

            {activeEditField === 'bio' && (
              <CustomTextInput
                placeholder="Tell your audience about yourself"
                value={editValue}
                onChange={(t: any) =>
                  setEditValue(
                    typeof t === 'string' ? t : t?.nativeEvent?.text || '',
                  )
                }
                inputContainerStyle={[styles.input, { height: hp(90) }]}
                inputStyle={styles.inputText}
                multiline
              />
            )}

            {activeEditField === 'category' && (
              <CustomTextInput
                placeholder="e.g. Digital Marketing"
                value={editValue}
                onChange={(t: any) =>
                  setEditValue(
                    typeof t === 'string' ? t : t?.nativeEvent?.text || '',
                  )
                }
                inputContainerStyle={styles.input}
                inputStyle={styles.inputText}
              />
            )}

            {activeEditField === 'experience' && (
              <CustomTextInput
                placeholder="e.g. 3+ Years"
                value={editValue}
                onChange={(t: any) =>
                  setEditValue(
                    typeof t === 'string' ? t : t?.nativeEvent?.text || '',
                  )
                }
                inputContainerStyle={styles.input}
                inputStyle={styles.inputText}
              />
            )}

            <View style={[styles.modalButtons, { marginTop: hp(20) }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActiveEditField(null)}
                activeOpacity={0.7}
                disabled={savingField}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.golden || GOLD_CREAM },
                ]}
                onPress={saveFieldEdit}
                activeOpacity={0.7}
                disabled={savingField}
              >
                {savingField ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text
                    style={[styles.modalConfirmText, { color: colors.black }]}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  onPress,
  locked = false,
}: any) => (
  <TouchableOpacity
    style={styles.infoRow}
    onPress={onPress}
    disabled={locked || !onPress}
    activeOpacity={0.7}
  >
    <View style={styles.infoRowIcon}>
      <Icon size={wp(16)} color={GOLD_CREAM} />
    </View>
    <Text style={styles.infoRowLabel}>{label}</Text>
    <Text style={styles.infoRowValue} numberOfLines={1}>
      {value || '—'}
    </Text>
    {locked ? (
      <Lock size={wp(14)} color="rgba(255,255,255,0.3)" />
    ) : (
      <ChevronRight size={wp(16)} color="rgba(255,255,255,0.35)" />
    )}
  </TouchableOpacity>
);

export default CreatorProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    overflow: 'hidden',
  },
  editPencilBtn: {
    position: 'absolute',
    top: hp(14),
    right: wp(14),
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: 'rgba(214,156,63,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(14),
  },
  imageWrapper: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: '#242220',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D69C40',
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
    backgroundColor: '#D69C40',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C1B19',
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  creatorPill: {
    marginTop: hp(10),
    backgroundColor: '#D69C3F',
    paddingHorizontal: wp(16),
    paddingVertical: hp(5),
    borderRadius: wp(14),
  },
  creatorPillText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: '#3A2C12',
  },
  sectionTitleCaps: {
    fontSize: fp(12),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: wp(20),
    marginTop: hp(24),
    marginBottom: hp(10),
  },
  rowCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(14),
    paddingVertical: hp(13),
  },
  infoRowIcon: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(9),
    backgroundColor: 'rgba(214,156,63,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  infoRowLabel: {
    flex: 1,
    fontSize: fp(14),
    color: colors.white,
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.55)',
    marginRight: wp(8),
    maxWidth: wp(120),
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: wp(58),
  },
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: wp(20),
    marginTop: hp(24),
    marginBottom: hp(10),
  },
  formCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    paddingVertical: hp(6),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    marginTop: hp(2),
  },
  igFieldIcon: {
    backgroundColor: '#E1306C20',
  },
  liFieldIcon: {
    backgroundColor: '#0077B520',
  },
  ytFieldIcon: {
    backgroundColor: '#FF000020',
  },
  fbFieldIcon: {
    backgroundColor: '#1877F220',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: hp(6),
  },
  input: {
    height: hp(42),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
  },
  inputText: {
    fontSize: fp(14),
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: wp(16),
  },
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  backButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: fp(15),
  },
  updateButton: {
    flex: 2,
    height: hp(48),
    borderRadius: wp(12),
    overflow: 'hidden',
  },
  updateButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: fp(15),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(20),
    paddingVertical: hp(28),
    paddingHorizontal: wp(24),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modalCancelText: {
    color: colors.textPrimary,
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
