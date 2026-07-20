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
import CreateStepHeader from '../../../../../components/CreateStepHeader';
import LinearGradient from 'react-native-linear-gradient';
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
import {
  Type,
  IndianRupee,
  ImagePlus,
  BarChart3,
  ToggleLeft,
  FileText,
} from 'lucide-react-native';
import FacingIssues from './components/FacingIssues';
import EnhanceSuggestionCard from '../../../../../components/ai/EnhanceSuggestionCard';

const CreateCourse = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const Nav = useNavigation<any>();
  const route = useRoute<any>();
  const isUpdated = route?.params?.isUpdated;
  const updateData = route?.params?.data;
  const [uploading, setUploading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      courseTitle: updateData?.title || '',
      price: String(updateData?.price ?? '') || '',
      description: updateData?.description || '',
      level: updateData?.level || '',
      status: updateData?.status || '',
      category: updateData?.category || '',
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
      Toast.show({
        type: 'success',
        text1: 'Image uploaded!',
        position: 'bottom',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Upload Failed', position: 'bottom' });
    } finally {
      setUploading(false);
    }
  };

  const onCreateCourse = (data: any) => {
    setLoading(true);
    dispatch(
      createCourse({
        title: data.courseTitle.trim(),
        description: data.description.trim(),
        price: Number(data.price) || 0,
        category: 'video',
        level: data?.level,
        status: data?.status,
        thumbnail: data?.thumbnail,
      }),
    )
      .unwrap()
      .then((res: any) => {
        reset();
        Toast.show({ type: 'success', text1: 'Course created!' });
        Nav.navigate('CourseDetailsScreen', {
          courseId: res?.data?.id || res?.data?.data?.id,
          fromCreate: true,
          courseData: res?.data || res?.data?.data || {
            title: data.courseTitle,
            price: data.price,
            status: data.status,
            thumbnail: data.thumbnail,
            level: data.level,
          },
        });
      })
      .catch(() =>
        Toast.show({ type: 'error', text1: 'Failed to create course' }),
      )
      .finally(() => setLoading(false));
  };

  const onCourseUpdate = (data: any) => {
    setLoading(true);
    dispatch(
      updateCourse({
        id: updateData?.id,
        body: {
          title: data.courseTitle.trim(),
          description: data.description.trim(),
          price: Number(data.price) || 0,
          category: data?.category?.trim() || '',
          level: data?.level,
          status: data?.status,
          thumbnail: data?.thumbnail,
        },
      }),
    )
      .unwrap()
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Course updated!' });
        Nav.goBack();
      })
      .catch(() =>
        Toast.show({ type: 'error', text1: 'Failed to update course' }),
      )
      .finally(() => setLoading(false));
  };

  const renderDropdownItem = (item: any, selectedValue: any) => {
    const isSelected = item.value === selectedValue;
    return (
      <View
        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
      >
        <Text
          style={[
            styles.dropdownItemText,
            isSelected && styles.dropdownItemTextSelected,
          ]}
        >
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <CreateStepHeader title="Course Details" active="course" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Course Details</Text>
            <Text style={styles.bannerSub}>
              Set up your course and start teaching.
            </Text>
          </View>
          {/* Title */}
          <View style={[styles.labelRow, { justifyContent: 'space-between' }]}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}
            >
              <Type size={wp(14)} color={'#F0C040'} />
              <Text style={styles.label}>Course Title</Text>
            </View>
            <EnhanceSuggestionCard
              value={watch('courseTitle')}
              onAccept={text => setValue('courseTitle', text)}
              endpoint="/ai/course/enhance"
              kind="title"
              tone="punchy"
            />
          </View>
          <Controller
            name="courseTitle"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                inputContainerStyle={[
                  styles.input,
                  errors.courseTitle && styles.errorBorder,
                ]}
                placeholder="Enter course title"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          />

          {/* Price */}
          <View style={styles.labelRow}>
            <IndianRupee size={wp(14)} color={'#F0C040'} />
            <Text style={styles.label}>Price (INR)</Text>
          </View>
          <Controller
            name="price"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                inputContainerStyle={[
                  styles.input,
                  errors.price && styles.errorBorder,
                ]}
                keyboardType="numeric"
                placeholder="e.g ₹499"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          />

          {/* Thumbnail */}
          <View style={styles.labelRow}>
            <ImagePlus size={wp(14)} color={'#F0C040'} />
            <Text style={styles.label}>Course Thumbnail</Text>
          </View>
          <Controller
            name="thumbnail"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View>
                <TouchableOpacity
                  onPress={() => imagePicker(onChange)}
                  style={styles.thumbnailBtn}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <ActivityIndicator color={'#F0C040'} />
                  ) : (
                    <>
                      <ImagePlus size={wp(18)} color={'#F0C040'} />
                      <Text style={styles.thumbnailBtnText}>
                        {value ? 'Change Thumbnail' : 'Choose Thumbnail'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {value ? (
                  <Image
                    source={{ uri: value }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            )}
          />

          {/* Level */}
          <View style={styles.labelRow}>
            <BarChart3 size={wp(14)} color={'#F0C040'} />
            <Text style={styles.label}>Level</Text>
          </View>
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

          {/* Status */}
          <View style={styles.labelRow}>
            <ToggleLeft size={wp(14)} color={'#F0C040'} />
            <Text style={styles.label}>Status</Text>
          </View>
          <Controller
            name="status"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Dropdown
                style={[styles.dropdown, error && styles.errorBorder]}
                placeholderStyle={styles.placeholderText}
                selectedTextStyle={styles.selectedText}
                containerStyle={styles.dropdownContainer}
                data={[
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Published', value: 'PUBLISHED' },
                ]}
                labelField="label"
                valueField="value"
                placeholder="Select status"
                value={value}
                onChange={item => onChange(item.value)}
                renderItem={item => renderDropdownItem(item, value)}
              />
            )}
          />

          {/* Headline */}
          <View style={[styles.labelRow, { justifyContent: 'space-between' }]}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}
            >
              <FileText size={wp(14)} color={'#F0C040'} />
              <Text style={styles.label}>Headline</Text>
            </View>
            <EnhanceSuggestionCard
              value={watch('description')}
              onAccept={text => setValue('description', text)}
              endpoint="/ai/course/enhance"
              kind="description"
              tone="conversational"
            />
          </View>
          <Controller
            name="description"
            control={control}
            rules={{
              required: true,
              minLength: 5,
              maxLength: 200,
            }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <CustomTextInput
                inputContainerStyle={[
                  styles.input,
                  styles.textArea,
                  error && styles.errorBorder,
                ]}
                placeholder="Write a headline"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                multiline
              />
            )}
          />

          <FacingIssues
            title="facing issues in upload"
            messgae="Hello, I need help with uploading."
          />
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              Nav.goBack();
              reset();
            }}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit(isUpdated ? onCourseUpdate : onCreateCourse)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F3C36B', '#D49A3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.primaryText}>
                  {isUpdated ? 'Update Course' : 'Create Course'}
                </Text>
              )}
            </LinearGradient>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  flex: {
    flex: 1,
  },
  scrollArea: {
    padding: wp(16),
    paddingBottom: hp(24),
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: wp(18),
    padding: wp(16),
  },
  banner: {
    marginBottom: hp(8),
  },
  bannerTitle: { fontSize: fp(18), fontWeight: '700', color: '#FFFFFF' },
  bannerSub: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
    marginTop: hp(4),
    lineHeight: fp(18),
  },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(12),
    marginBottom: hp(6),
  },
  label: {
    fontSize: fp(11),
    color: '#F0C040',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Inputs
  input: {
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    height: hp(46),
    width: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.textPrimary,
  },
  textArea: {
    height: hp(88),
    alignItems: 'flex-start',
  },
  errorBorder: {
    borderWidth: 1.5,
    borderColor: colors.cError,
  },

  // Thumbnail
  thumbnailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    borderRadius: wp(12),
    height: hp(46),
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderStyle: 'dashed',
  },
  thumbnailBtnText: {
    color: colors.gold,
    fontSize: fp(14),
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: hp(160),
    borderRadius: wp(12),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Dropdowns
  dropdown: {
    height: hp(46),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  dropdownContainer: {
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: colors.cSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dropdownItem: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    marginHorizontal: wp(6),
    marginVertical: hp(3),
    borderRadius: wp(8),
  },
  dropdownItemSelected: {
    backgroundColor: colors.goldDim,
  },
  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: fp(14),
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
    color: colors.textPrimary,
  },

  // Bottom Actions
  actions: {
    flexDirection: 'column-reverse',
    gap: wp(12),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  cancelBtn: {
    paddingVertical: hp(16),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: wp(1.5),
    borderColor: '#F0C040',
  },
  cancelText: {
    color: '#F0C040',
    fontWeight: '700',
    fontSize: fp(16),
  },
  primaryBtn: {
    paddingVertical: hp(16),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: fp(16),
  },
});
