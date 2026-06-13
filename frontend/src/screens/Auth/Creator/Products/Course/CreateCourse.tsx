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
      .then(() => {
        reset();
        Toast.show({ type: 'success', text1: 'Course created!' });
        Nav.goBack();
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
      <AppHeaderWithBack
        title={isUpdated ? 'Update Course' : 'Create Course'}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={[styles.labelRow, { justifyContent: 'space-between' }]}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}
            >
              <Type size={wp(14)} color={'#64748B'} />
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
            <IndianRupee size={wp(14)} color={'#64748B'} />
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
            <ImagePlus size={wp(14)} color={'#64748B'} />
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
                    <ActivityIndicator color={'#60A5FA'} />
                  ) : (
                    <>
                      <ImagePlus size={wp(18)} color={'#64748B'} />
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
            <BarChart3 size={wp(14)} color={'#64748B'} />
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
            <ToggleLeft size={wp(14)} color={'#64748B'} />
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
              <FileText size={wp(14)} color={'#64748B'} />
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
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(isUpdated ? onCourseUpdate : onCreateCourse)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
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
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  scrollArea: {
    padding: wp(16),
    paddingBottom: hp(20),
  },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(10),
    marginBottom: hp(4),
  },
  label: {
    fontSize: fp(13),
    color: '#1A1A2E',
    fontWeight: '600',
  },

  // Inputs
  input: {
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    height: hp(42),
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: hp(80),
    // paddingTop: hp(8),
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
    height: hp(42),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  thumbnailBtnText: {
    color: '#64748B',
    fontSize: fp(14),
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: hp(160),
    borderRadius: wp(12),
    marginTop: hp(10),
  },

  // Dropdowns
  dropdown: {
    height: hp(42),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dropdownContainer: {
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownItem: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    marginHorizontal: wp(6),
    marginVertical: hp(3),
    borderRadius: wp(8),
  },
  dropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    color: '#64748B',
    fontSize: fp(14),
  },
  dropdownItemTextSelected: {
    color: '#0F3460',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: fp(14),
    color: '#94A3B8',
  },
  selectedText: {
    fontSize: fp(14),
    color: '#1A1A2E',
  },

  // Bottom Actions
  actions: {
    flexDirection: 'row',
    gap: wp(12),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: colors.white,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    color: '#1A1A2E',
    fontWeight: '600',
    fontSize: fp(15),
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: '#0F3460',
    paddingVertical: hp(14),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },
});
