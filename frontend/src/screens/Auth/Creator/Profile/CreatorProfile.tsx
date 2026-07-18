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
  Star,
  ChevronRight
} from 'lucide-react-native';
import { Linking } from 'react-native';
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
import { InstagramIcon, LinkedinIcon, YoutubeIcon, FacebookIcon } from '../../../../components/SocialIcons';


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

  const openLink = async (url: string) => {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    // Try to open in the native app first, fallback to browser
    let appUrl: string | null = null;

    if (/instagram\.com/i.test(finalUrl)) {
      const username = finalUrl.match(/instagram\.com\/([^/?]+)/)?.[1];
      if (username) {
        appUrl = `instagram://user?username=${username}`;
      }
    } else if (/linkedin\.com/i.test(finalUrl)) {
      appUrl = `linkedin://in/${finalUrl.split('/in/')[1] || ''}`;
    } else if (/youtube\.com|youtu\.be/i.test(finalUrl)) {
      const channelMatch = finalUrl.match(/youtube\.com\/(channel|c|@)\/?([\w-]+)/);
      if (channelMatch) {
        appUrl = `youtube://${channelMatch[0].replace('youtube.com/', '')}`;
      }
    } else if (/facebook\.com/i.test(finalUrl)) {
      appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(finalUrl)}`;
    }

    if (appUrl) {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        Linking.openURL(appUrl);
        return;
      }
    }

    Linking.openURL(finalUrl).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Could not open link',
        position: 'bottom',
      });
    });
  };

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
            <View style={styles.goldBadge}>
              <ShieldCheck size={wp(12)} color={colors.black} />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{displayName}</Text>

          <View style={styles.proBadge}>
            <Star size={wp(11)} color={colors.black} fill={colors.black} />
            <Text style={styles.proBadgeText}>PRO INSTRUCTOR</Text>
          </View>

          <Text style={styles.bioText} numberOfLines={3}>
            Digital Architect and Lead Educator specializing in Technical
            Elegance and advanced UI systems. Mentoring the next generation
            of visual designers.
          </Text>

          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85}>
            <Text style={styles.shareBtnText}>Share Profile</Text>
          </TouchableOpacity>

          {/* Social Links Icons */}
          {(user?.instagram_link || user?.linkedin_link || user?.youtube_link || user?.facebook_link) && (
            <View style={styles.socialRow}>
              {user?.instagram_link ? (
                <TouchableOpacity
                  style={styles.socialIconBtnIg}
                  onPress={() => openLink(user.instagram_link)}
                  activeOpacity={0.7}
                >
                  <InstagramIcon size={wp(18)} color="#E1306C" />
                </TouchableOpacity>
              ) : null}
              {user?.linkedin_link ? (
                <TouchableOpacity
                  style={styles.socialIconBtnLi}
                  onPress={() => openLink(user.linkedin_link)}
                  activeOpacity={0.7}
                >
                  <LinkedinIcon size={wp(18)} color="#0077B5" />
                </TouchableOpacity>
              ) : null}
              {user?.youtube_link ? (
                <TouchableOpacity
                  style={styles.socialIconBtnYt}
                  onPress={() => openLink(user.youtube_link)}
                  activeOpacity={0.7}
                >
                  <YoutubeIcon size={wp(18)} color="#FF0000" />
                </TouchableOpacity>
              ) : null}
              {user?.facebook_link ? (
                <TouchableOpacity
                  style={styles.socialIconBtnFb}
                  onPress={() => openLink(user.facebook_link)}
                  activeOpacity={0.7}
                >
                  <FacebookIcon size={wp(18)} color="#1877F2" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        {/* Form Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.formCard}>
          {/* NAME */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
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
          </View>

          <View style={styles.divider} />

          {/* DOB */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
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
                          !value && { color: colors.textMuted },
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
            <View style={styles.fieldContent}>
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
          </View>

          <View style={styles.divider} />

          {/* PHONE */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
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
        </View>

        {/* Social Links Section */}
        <Text style={styles.sectionTitle}>Social Links</Text>

        <View style={styles.formCard}>
          {/* Instagram */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>INSTAGRAM</Text>
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
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>LINKEDIN</Text>
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
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>YOUTUBE</Text>
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
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>FACEBOOK</Text>
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

        {/* Bestselling Product (mock) */}
        <Text style={styles.sectionTitle}>Bestselling Product</Text>
        <View style={styles.productCard}>
          <View style={styles.productThumb}>
            <View style={styles.bestsellerBadge}>
              <Text style={styles.bestsellerBadgeText}>BESTSELLER</Text>
            </View>
          </View>
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>
              Mastering Technical Elegance (Premium Edition)
            </Text>
            <Text style={styles.productDesc} numberOfLines={2}>
              The complete architectural framework for high-end digital
              products. Includes source files, 4K video modules, and private
              community access.
            </Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>₹199.00</Text>
              <TouchableOpacity style={styles.getAccessBtn} activeOpacity={0.85}>
                <Text style={styles.getAccessBtnText}>Get Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Published Courses (mock) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Published Courses</Text>
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={wp(14)} color={colors.golden} />
          </TouchableOpacity>
        </View>
        <View style={styles.courseCard}>
          <View style={styles.courseThumb} />
          <View style={styles.courseContent}>
            <Text style={styles.courseTitle}>Mastering Technical Elegance</Text>
            <Text style={styles.courseMeta}>4.9 ★ · 12k students</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit(onUpdate)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.updateButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Cancel</Text>
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
    backgroundColor: colors.black,
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
    backgroundColor: colors.CARD_BG,
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
    backgroundColor: colors.PLACEHOLDER_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.golden,
  },
  profileImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
  },
  cameraIcon: {
    position: 'absolute',
    top: hp(2),
    right: wp(2),
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.CARD_BG,
  },
  goldBadge: {
    position: 'absolute',
    bottom: hp(10),
    right: -wp(2),
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.golden,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.CARD_BG,
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(8),
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: colors.golden,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(12),
  },
  proBadgeText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: fp(12.5),
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(16),
    paddingHorizontal: wp(4),
  },
  shareBtn: {
    borderWidth: 1,
    borderColor: colors.golden,
    borderRadius: wp(20),
    paddingVertical: hp(9),
    paddingHorizontal: wp(24),
    marginBottom: hp(14),
  },
  shareBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.golden,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  socialIconBtnIg: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1306C25',
  },
  socialIconBtnLi: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0077B525',
  },
  socialIconBtnYt: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF000025',
  },
  socialIconBtnFb: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1877F225',
  },

  // Section
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
    marginHorizontal: wp(20),
    marginTop: hp(24),
    marginBottom: hp(10),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(20),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(24),
  },
  viewAllText: {
    fontSize: fp(12.5),
    fontWeight: '600',
    color: colors.golden,
  },

  // Form Card
  formCard: {
    backgroundColor: colors.CARD_BG,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    paddingVertical: hp(6),
  },
  fieldRow: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.golden,
    letterSpacing: 0.6,
    marginBottom: hp(6),
  },
  input: {
    height: hp(42),
    borderWidth: 0,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  inputText: {
    fontSize: fp(14),
    color: colors.white,
  },
  disabledInput: {
    backgroundColor: colors.black,
  },
  disabledText: {
    fontSize: fp(14),
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: wp(16),
  },

  // Bestselling Product
  productCard: {
    backgroundColor: colors.CARD_BG,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    overflow: 'hidden',
  },
  productThumb: {
    width: '100%',
    height: hp(140),
    backgroundColor: colors.PLACEHOLDER_BG,
    justifyContent: 'flex-start',
    padding: wp(12),
  },
  bestsellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.golden,
    paddingHorizontal: wp(9),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  bestsellerBadgeText: {
    fontSize: fp(9.5),
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.4,
  },
  productContent: {
    padding: wp(16),
  },
  productTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(6),
  },
  productDesc: {
    fontSize: fp(12),
    color: colors.textMuted,
    lineHeight: fp(17),
    marginBottom: hp(14),
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
  },
  getAccessBtn: {
    backgroundColor: colors.golden,
    paddingHorizontal: wp(18),
    paddingVertical: hp(9),
    borderRadius: wp(10),
  },
  getAccessBtnText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.black,
  },

  // Published Courses
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.CARD_BG,
    marginHorizontal: wp(16),
    marginTop: hp(10),
    borderRadius: wp(14),
    padding: wp(12),
    gap: wp(12),
  },
  courseThumb: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(10),
    backgroundColor: colors.PLACEHOLDER_BG,
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(3),
  },
  courseMeta: {
    fontSize: fp(11.5),
    color: colors.textMuted,
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
    backgroundColor: colors.golden,
  },
  updateButtonText: {
    color: colors.black,
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
    borderColor: colors.golden,
  },
  backButtonText: {
    color: colors.golden,
    fontWeight: '600',
    fontSize: fp(15),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalContainer: {
    backgroundColor: colors.CARD_BG,
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
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(8),
  },
  modalMessage: {
    fontSize: fp(14),
    color: colors.textMuted,
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
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalCancelText: {
    color: colors.white,
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