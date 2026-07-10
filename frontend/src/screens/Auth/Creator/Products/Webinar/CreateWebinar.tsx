import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { createWebinar, updateWebinar } from '../../../../../store/WebinarSlice';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../../../store/Common';
import moment from 'moment-timezone';
import FacingIssues from '../Course/components/FacingIssues';
import {
  Coins,
  Gift,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react-native';

const CreateWebinarScreen = () => {
  const navigation = useNavigation();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [uploading, setUploading] = useState(false);
  const [timezones, setTimezones] = useState<any[]>([]);
  const route = useRoute<any>();
  const updatedata = route?.params?.data;

  const [pricingModel, setPricingModel] = useState<'paid' | 'free'>(
    updatedata?.price && Number(updatedata.price) > 0 ? 'paid' : 'free'
  );

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  useEffect(() => {
    const zones = moment.tz.names().map(tz => ({
      label: `${tz} (UTC ${moment().tz(tz).format('Z')})`,
      value: tz,
    }));
    setTimezones(zones);
  }, []);

  const imagePicker = async (onChange: (val: string) => void) => {
    try {
      const res = await pick({ type: [types.images] });
      if (!res || res.length === 0) return;
      await pickImageUpload(
        { uri: res[0].uri, type: res[0].type, name: res[0].name },
        onChange,
      );
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Image Picker Error',
        text2: 'Unable to pick the image. Please try again.',
        position: 'bottom',
      });
    }
  };

  const pickImageUpload = async (
    file: any,
    onChange: (val: string) => void,
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name || 'upload.jpg',
      });
      const res: any = await dispatch(uploadShipDoc(formData)).unwrap();
      onChange(res?.data?.url);
      Toast.show({
        type: 'success',
        text1: 'Image uploaded successfully!',
        position: 'bottom',
      });
    } catch (err: any) {
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

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: updatedata?.title || '',
      description: updatedata?.description || '',
      thumbnail_url: updatedata?.thumbnail_url || '',
      price: String(updatedata?.price ?? '') || '',
      category: updatedata?.category || 'webinar',
      tags: updatedata?.tags || [],
      scheduled_at: updatedata?.scheduled_at
        ? moment(updatedata.scheduled_at).format('YYYY-MM-DD')
        : '',
      start_time: updatedata?.start_time || '',
      duration: String(updatedata?.duration ?? '') || '60',
      timezone: updatedata?.timezone || moment.tz.guess() || 'Asia/Kolkata',
      max_participants: String(updatedata?.max_participants ?? '') || '100',
      status: updatedata?.status || 'PUBLISHED',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const finalPrice = pricingModel === 'free' ? 0 : Number(data.price) || 0;
    const payload = {
      title: data?.title,
      description: data?.description,
      thumbnail_url: data?.thumbnail_url,
      price: finalPrice,
      category: 'webinar',
      start_time: data?.start_time || moment(`${data.scheduled_at} ${moment().format('HH:mm')}`).format(),
      end_time: null,
      tags: data?.tags,
      scheduled_at: data?.scheduled_at,
      duration: Number(data?.duration),
      timezone: data?.timezone,
      max_participants: Number(data?.max_participants),
      status: data?.status,
    };
    dispatch(createWebinar(payload))
      .unwrap()
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Webinar created!' });
        navigation.goBack();
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };

  const onUpdateSubmit = (data: any) => {
    setLoading(true);
    const finalPrice = pricingModel === 'free' ? 0 : Number(data.price) || 0;
    const payload = {
      webinar_id: updatedata?.id,
      body: {
        title: data?.title,
        description: data?.description,
        thumbnail_url: data?.thumbnail_url,
        price: finalPrice,
        category: 'webinar',
        start_time: data?.start_time || moment(`${data.scheduled_at} ${moment().format('HH:mm')}`).format(),
        end_time: null,
        tags: data?.tags,
        scheduled_at: data?.scheduled_at,
        duration: Number(data?.duration),
        timezone: data?.timezone,
        max_participants: Number(data?.max_participants),
        status: data?.status,
      },
    };
    dispatch(updateWebinar(payload))
      .unwrap()
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Webinar updated!' });
        navigation.goBack();
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDateConfirm = (date: Date) => {
    setValue('scheduled_at', moment(date).format('YYYY-MM-DD'));
    setValue('start_time', moment(date).format('HH:mm'));
    hideDatePicker();
  };

  const renderDropdownItem = (item: any, selectedValue: any) => {
    const isSelected = item.value === selectedValue;
    return (
      <View style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}>
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <AppHeaderWithBack title={updatedata ? 'Update Webinar' : 'Webinar Details'} />
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Webinar Details Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Webinar Details</Text>
            <Text style={styles.cardHeaderSubtitle}>Configure your live group sessions.</Text>

            {/* Webinar Title */}
            <Text style={styles.inputLabel}>WEBINAR HEADLINE</Text>
            <Controller
              name="title"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, errors.title && styles.errorBorder]}
                  inputStyle={styles.inputText}
                  placeholder="e.g. Learn Smarter, Work Better"
                  placeholderTextColor={colors.textMuted || '#555558'}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            {/* Date and Time Picker */}
            <Text style={styles.inputLabel}>WEBINAR DATE & TIME</Text>
            <Controller
              name="scheduled_at"
              control={control}
              rules={{ required: true }}
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={[styles.input, styles.dateRowButton, errors.scheduled_at && styles.errorBorder]}
                  onPress={showDatePicker}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.inputText, !value && { color: colors.textMuted || '#555558' }]}>
                    {value ? `${value}  ${watch('start_time') || ''}` : 'Select date and time'}
                  </Text>
                  <Calendar size={18} color={colors.textSecondary || '#888888'} />
                </TouchableOpacity>
              )}
            />

            {/* Webinar Description */}
            <Text style={styles.inputLabel}>WEBINAR DESCRIPTION</Text>
            <Controller
              name="description"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, styles.textArea, errors.description && styles.errorBorder]}
                  inputStyle={[styles.inputText, { textAlignVertical: 'top' }]}
                  placeholder="Enter the Description"
                  placeholderTextColor={colors.textMuted || '#555558'}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  multiline
                  numberOfLines={4}
                />
              )}
            />

            {/* Duration */}
            <Text style={styles.inputLabel}>WEBINAR DURATION</Text>
            <Controller
              name="duration"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, errors.duration && styles.errorBorder]}
                  inputStyle={styles.inputText}
                  placeholder="e.g. 60 mins"
                  placeholderTextColor={colors.textMuted || '#555558'}
                  keyboardType="numeric"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            {/* Max Participants */}
            <Text style={styles.inputLabel}>TOTAL PARTICIPANTS</Text>
            <Controller
              name="max_participants"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, errors.max_participants && styles.errorBorder]}
                  inputStyle={styles.inputText}
                  placeholder="e.g. 100"
                  placeholderTextColor={colors.textMuted || '#555558'}
                  keyboardType="numeric"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
          </View>

          {/* Pricing Model Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Pricing Model</Text>
            <Text style={styles.pricingSubtitle}>Set the value for your knowledge.</Text>

            {/* Paid | Free side-by-side selection pills */}
            <View style={styles.pricingPillRow}>
              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'paid' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => setPricingModel('paid')}
                activeOpacity={0.9}
              >
                <Coins size={16} color={pricingModel === 'paid' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'paid' ? styles.pricingPillTextActive : styles.pricingPillTextInactive,
                  ]}
                >
                  Paid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'free' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => {
                  setPricingModel('free');
                  setValue('price', '0');
                }}
                activeOpacity={0.9}
              >
                <Gift size={16} color={pricingModel === 'free' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'free' ? styles.pricingPillTextActive : styles.pricingPillTextInactive,
                  ]}
                >
                  Free
                </Text>
              </TouchableOpacity>
            </View>

            {/* Price field conditionally shown */}
            {pricingModel === 'paid' && (
              <View style={{ marginTop: hp(12) }}>
                <Text style={styles.inputLabel}>PRICE (INR)</Text>
                <Controller
                  name="price"
                  control={control}
                  rules={{ required: pricingModel === 'paid' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomTextInput
                      inputContainerStyle={[styles.input, errors.price && styles.errorBorder]}
                      inputStyle={styles.inputText}
                      keyboardType="numeric"
                      placeholder="e.g. 499"
                      placeholderTextColor={colors.textMuted || '#555558'}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  )}
                />
              </View>
            )}
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleDateConfirm}
            onCancel={hideDatePicker}
          />

          <FacingIssues
            title="facing issues in upload"
            messgae="Hello, I need help with uploading."
          />
        </ScrollView>

        {/* Sticky Actions Footer */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              navigation.goBack();
              reset();
            }}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(updatedata ? onUpdateSubmit : onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.primaryText}>
                {updatedata ? 'Update Webinar' : 'Create Webinar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateWebinarScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg || '#0F0F0F',
  },
  keyboardWrapper: {
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(40),
  },

  // Cards
  formCard: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    marginBottom: hp(12),
  },
  cardHeaderTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(4),
  },
  cardHeaderSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
    marginBottom: hp(14),
  },

  // Input Labels
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    letterSpacing: 0.6,
    marginBottom: hp(6),
    marginTop: hp(6),
  },

  // Inputs
  input: {
    borderRadius: 10,
    paddingHorizontal: wp(12),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.inputBg || '#242426',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    marginBottom: hp(10),
  },
  inputText: {
    color: colors.white || '#FFFFFF',
    fontSize: fp(14),
  },
  textArea: {
    height: hp(88),
  },
  dateRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Dropdown element styling
  dropdownItem: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.inputBg || '#242426',
  },
  dropdownItemText: {
    color: colors.textSecondary || '#888888',
    fontSize: fp(13),
  },
  dropdownItemTextSelected: {
    color: colors.gold || '#F0C040',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: fp(14),
    color: colors.textMuted || '#555558',
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.white || '#FFFFFF',
  },

  // Pricing Model Styling
  pricingSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
    marginBottom: hp(12),
  },
  pricingPillRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  pricingPill: {
    flex: 1,
    height: hp(44),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
  },
  pricingPillActive: {
    backgroundColor: colors.gold || '#F0C040',
  },
  pricingPillInactive: {
    backgroundColor: colors.inputBg || '#242426',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  pricingPillText: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  pricingPillTextActive: {
    color: '#000000',
  },
  pricingPillTextInactive: {
    color: colors.white || '#FFFFFF',
  },

  // Sticky bottom action buttons
  actions: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderTopWidth: 1,
    borderTopColor: colors.border || '#2A2A2C',
    backgroundColor: colors.bg || '#0F0F0F',
  },
  cancelBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  cancelText: {
    color: colors.white || '#FFFFFF',
    fontWeight: '600',
    fontSize: fp(14),
  },
  primaryButton: {
    flex: 1.5,
    backgroundColor: colors.gold || '#F0C040',
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: fp(14),
  },
  errorBorder: {
    borderColor: colors.error || '#EF4444',
  },
});
