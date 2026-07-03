import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import Toast from 'react-native-toast-message';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useForm, Controller } from 'react-hook-form';
import { createCourse, updateCourse } from '../../../../../store/CourseSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import CustomTextInput from '../../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { uploadShipDoc } from '../../../../../store/Common';
import { pick, types } from '@react-native-documents/picker';
import { Coins, Gift, CloudUpload, Sparkles } from 'lucide-react-native';
import FacingIssues from './components/FacingIssues';

const CreateCourse = ({ embedded = false }: { embedded?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const Nav = useNavigation<any>();
  const route = useRoute<any>();
  const isUpdated = route?.params?.isUpdated;
  const updateData = route?.params?.data;
  const [uploading, setUploading] = useState(false);

  const [pricingModel, setPricingModel] = useState<'paid' | 'free'>(
    updateData?.price && Number(updateData.price) > 0 ? 'paid' : 'free',
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      courseTitle: updateData?.title || '',
      price: String(updateData?.price ?? '') || '',
      description: updateData?.description || '',
      level: updateData?.level || 'Beginner',
      status: updateData?.status || 'PUBLISHED',
      category: updateData?.category || 'Design & Arts',
      thumbnail: updateData?.thumbnail || '',
    },
  });

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
      Toast.show({ type: 'success', text1: 'Image uploaded!', position: 'bottom' });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Failed to upload the image. Please try again.',
        position: 'bottom',
      });
    } finally {
      setUploading(false);
    }
  };

  const onCreateCourse = (data: any) => {
    setLoading(true);
    const finalPrice = pricingModel === 'free' ? 0 : Number(data.price) || 0;
    dispatch(
      createCourse({
        title: data.courseTitle,
        price: finalPrice,
        description: data.description,
        level: data.level,
        status: data.status,
        category: data.category,
        thumbnail: data.thumbnail || undefined,
      }),
    )
      .unwrap()
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Course created!' });
        Nav.goBack();
      })
      .catch(() => Toast.show({ type: 'error', text1: 'Failed to create course' }))
      .finally(() => setLoading(false));
  };

  const onCourseUpdate = (data: any) => {
    setLoading(true);
    const finalPrice = pricingModel === 'free' ? 0 : Number(data.price) || 0;
    dispatch(
      updateCourse({
        id: updateData.id,
        body: {
          title: data.courseTitle,
          price: finalPrice,
          description: data.description,
          level: data.level,
          status: data.status,
          category: data.category,
          thumbnail: data.thumbnail || undefined,
        },
      }),
    )
      .unwrap()
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Course updated!' });
        Nav.goBack();
      })
      .catch(() => Toast.show({ type: 'error', text1: 'Failed to update course' }))
      .finally(() => setLoading(false));
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
    <View style={styles.root}>
      {!embedded && (
        <AppHeaderWithBack title={isUpdated ? 'Update Course' : 'Create Course'} />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover & Trailer */}
          <Text style={styles.sectionLabel}>COURSE COVER & TRAILER</Text>
          <Controller
            name="thumbnail"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.uploadCard}>
                {value ? (
                  <View style={styles.thumbnailPreviewContainer}>
                    <Image
                      source={{ uri: value }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => imagePicker(onChange)}
                      style={styles.changeThumbnailBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.changeThumbnailBtnText}>Change Cover</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadZone}>
                    <View style={styles.uploadIconContainer}>
                      {uploading ? (
                        <ActivityIndicator color={colors.gold} />
                      ) : (
                        <CloudUpload size={24} color={colors.textSecondary} />
                      )}
                    </View>
                    <Text style={styles.uploadTitle}>Drag and drop thumbnail here</Text>
                    <Text style={styles.uploadSubtitle}>Support: MP4, JPG, PNG (Max 500MB)</Text>
                    <TouchableOpacity
                      onPress={() => imagePicker(onChange)}
                      style={styles.browseButton}
                      disabled={uploading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.browseButtonText}>Browse Files</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />

          {/* Course Details Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Course Details</Text>

            <Text style={styles.inputLabel}>COURSE TITLE</Text>
            <Controller
              name="courseTitle"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, errors.courseTitle && styles.errorBorder]}
                  inputStyle={styles.inputText}
                  placeholder="e.g. Masterclass in Technical Elegance"
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <Controller
              name="description"
              control={control}
              rules={{ required: true, minLength: 5 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.input,
                    styles.textArea,
                    errors.description && styles.errorBorder,
                  ]}
                  inputStyle={[styles.inputText, { textAlignVertical: 'top' }]}
                  placeholder="Describe the outcome of this course..."
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                />
              )}
            />

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <Controller
              name="category"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Dropdown
                  style={[styles.dropdown, error && styles.errorBorder]}
                  placeholderStyle={styles.placeholderText}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={styles.dropdownContainer}
                  activeColor={colors.inputBg}
                  data={[
                    { label: 'Design & Arts', value: 'Design & Arts' },
                    { label: 'Business & Consulting', value: 'Business & Consulting' },
                    { label: 'Technology & Coding', value: 'Technology & Coding' },
                    { label: 'Personal Growth', value: 'Personal Growth' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Category"
                  value={value}
                  onChange={item => onChange(item.value)}
                  renderItem={item => renderDropdownItem(item, value)}
                />
              )}
            />

            <Text style={styles.inputLabel}>DIFFICULTY</Text>
            <Controller
              name="level"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Dropdown
                  style={[styles.dropdown, error && styles.errorBorder]}
                  placeholderStyle={styles.placeholderText}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={styles.dropdownContainer}
                  activeColor={colors.inputBg}
                  data={[
                    { label: 'Beginner', value: 'Beginner' },
                    { label: 'Intermediate', value: 'Intermediate' },
                    { label: 'Advanced', value: 'Advanced' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select level"
                  value={value}
                  onChange={item => onChange(item.value)}
                  renderItem={item => renderDropdownItem(item, value)}
                />
              )}
            />
          </View>

          {/* AI Suggestions Card */}
          <View style={styles.formCard}>
            <View style={styles.aiHeaderRow}>
              <Sparkles size={16} color={colors.gold} />
              <Text style={[styles.cardHeaderTitle, { marginLeft: wp(6), marginBottom: 0 }]}>
                AI Suggestions
              </Text>
            </View>
            <Text style={styles.aiSubtitle}>
              Let AI help you refine your course content and structure.
            </Text>

            <Text style={styles.suggestedTopicsLabel}>SUGGESTED TOPICS</Text>
            <View style={styles.topicsRow}>
              {['Industry Trends', 'Target Audience', 'Learning Objectives'].map((topic, i) => (
                <View key={i} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{topic}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => Toast.show({ type: 'info', text1: 'Generating AI suggestions...' })}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color="#000000" style={{ marginRight: wp(6) }} />
              <Text style={styles.aiButtonText}>Generate with AI</Text>
            </TouchableOpacity>
          </View>

          {/* Pricing Model Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Pricing Model</Text>
            <Text style={styles.pricingSubtitle}>Set the value for your knowledge.</Text>

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
                    pricingModel === 'paid'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
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
                    pricingModel === 'free'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
                  ]}
                >
                  Free
                </Text>
              </TouchableOpacity>
            </View>

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
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
            )}
          </View>

          <FacingIssues
            title="facing issues in upload"
            messgae="Hello, I need help with uploading."
          />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { Nav.goBack(); reset(); }}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(isUpdated ? onCourseUpdate : onCreateCourse)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.primaryText}>
                {isUpdated ? 'Update Course' : 'Create Course'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateCourse;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollArea: {
    padding: wp(16),
    paddingBottom: hp(40),
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: hp(8),
  },
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: wp(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  uploadZone: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(12),
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  uploadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  uploadTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  uploadSubtitle: {
    fontSize: fp(10),
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  browseButton: {
    backgroundColor: colors.white,
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#000000',
    fontSize: fp(12),
    fontWeight: '700',
  },
  thumbnailPreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: hp(140),
    borderRadius: 10,
  },
  changeThumbnailBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: 12,
    position: 'absolute',
    bottom: 10,
  },
  changeThumbnailBtnText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
  },
  cardHeaderTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(14),
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: hp(6),
    marginTop: hp(6),
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: wp(12),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(10),
  },
  inputText: {
    color: colors.white,
    fontSize: fp(14),
  },
  textArea: {
    height: hp(88),
  },
  errorBorder: {
    borderColor: colors.error,
  },
  dropdown: {
    height: hp(44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    marginBottom: hp(10),
  },
  dropdownContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.inputBg,
  },
  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: fp(13),
  },
  dropdownItemTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: fp(14),
    color: colors.textMuted,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.white,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  aiSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  suggestedTopicsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: hp(8),
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
    marginBottom: hp(14),
  },
  topicChip: {
    backgroundColor: colors.inputBg,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
  },
  topicChipText: {
    fontSize: fp(10),
    color: colors.white,
    fontWeight: '500',
  },
  aiButton: {
    backgroundColor: colors.gold,
    height: hp(36),
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(16),
  },
  aiButtonText: {
    color: '#000000',
    fontSize: fp(12),
    fontWeight: '700',
  },
  pricingSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
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
    backgroundColor: colors.gold,
  },
  pricingPillInactive: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingPillText: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  pricingPillTextActive: {
    color: '#000000',
  },
  pricingPillTextInactive: {
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  cancelBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(14),
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: colors.gold,
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
});