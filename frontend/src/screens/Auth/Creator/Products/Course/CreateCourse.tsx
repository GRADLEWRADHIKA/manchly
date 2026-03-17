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
  Linking,
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
import { CloudUpload } from 'lucide-react-native';
import FacingIssues from './components/FacingIssues';

const CreateCourse = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const Nav = useNavigation<any>();
  const route = useRoute();
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

      await pickImageUpload(picked, onChange);
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
      console.log('----res----', res?.data?.url)
      const newUrl = res?.data?.url;
      onChange(newUrl);

      Toast.show({
        type: 'success',
        text1: 'Image uploaded successfully!',
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

  const onCreateCourse = (data: any) => {
    const description = data?.description?.trim();

    // REQUIRED
    if (!description) {
      Toast.show({
        type: 'error',
        text1: 'Please write a short description',
      });
      return;
    }

    // MIN LENGTH
    if (description.length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Description must be at least 5 characters long',
      });
      return;
    }

    // MAX LENGTH
    if (description.length > 20) {
      Toast.show({
        type: 'error',
        text1: 'Description cannot exceed 20 characters',
      });
      return;
    }

    setLoading(true);

    const payload = {
      title: data.courseTitle.trim(),
      description,
      price: Number(data.price) || 0,
      category: 'video',
      level: data?.level,
      status: data?.status,
      thumbnail: data?.thumbnail,
    };

    dispatch(createCourse(payload))
      .unwrap()
      .then(res => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Course created successfully!',
        });
        Nav.goBack();
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          text1: 'Failed to create course',
        });
      })
      .finally(() => setLoading(false));
  };


  const onCourseUpdate = (data: any) => {

    const description = data?.description?.trim();

    // REQUIRED
    if (!description) {
      Toast.show({
        type: 'error',
        text1: 'Please write a short description',
      });
      return;
    }

    // MIN LENGTH
    if (description.length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Description must be at least 5 characters long',
      });
      return;
    }

    // MAX LENGTH
    if (description.length > 20) {
      Toast.show({
        type: 'error',
        text1: 'Description cannot exceed 20 characters',
      });
      return;
    }
    setLoading(true);
    const payload = {
      id: updateData?.id,
      body: {
        title: data.courseTitle.trim(),
        description: data.description.trim(),
        price: Number(data.price) || 0,
        category: data?.category.trim() || '',
        level: data?.level,
        status: data?.status,
        thumbnail: data?.thumbnail,
      },
    };

    dispatch(updateCourse(payload))
      .unwrap()
      .then(res => {
        console.log('-----res----->', res);
        reset();
        Toast.show({
          type: 'success',
          text1: 'Course updated successfully!',
        });
        Nav.goBack();
      })
      .catch(err => {
        console.log('------err------', err);
        Toast.show({
          type: 'error',
          text1: 'Failed to update course',
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.root}>
      <AppHeaderWithBack
        title={isUpdated ? 'Update Course' : 'Create Course'}
      />

      <KeyboardAvoidingView
        style={styles.flexGrow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollArea}>
          <View style={styles.formCard}>
            {/* Course Title */}
            <Text style={styles.label}>Course Title</Text>
            <Controller
              name="courseTitle"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: errors.courseTitle
                        ? 'red'
                        : colors.borderColor,
                    },
                  ]}
                  placeholder="Enter course title"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {/* Price */}
            <Text style={styles.label}>Price (INR)</Text>
            <Controller
              name="price"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    { borderColor: errors.price ? 'red' : colors.borderColor },
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
            <Text style={styles.label}>Choose Course Thumbnail</Text>
            <Controller
              name="thumbnail"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    onPress={() => imagePicker(onChange)}
                    style={styles.button}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={styles.buttonText}>
                        {value ? 'Change Thumbnail' : 'Choose Thumbnail'}
                      </Text>
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
            <Text style={styles.label}>Level</Text>
            <Controller
              name="level"
              control={control}
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <Dropdown
                  style={[styles.dropdown, error && styles.errorBorder]}
                  placeholderStyle={styles.placeholder}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={{
                    borderRadius: wp(10),
                  }}
                  data={[
                    { label: 'Advanced', value: 'Advanced' },
                    { label: 'Intermediate', value: 'Intermediate' },
                    { label: 'Beginner', value: 'Beginner' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select level"
                  value={value}
                  onChange={item => onChange(item.value)}
                  renderItem={item => {
                    const isSelected = item.value === value;
                    return (
                      <View
                        style={{
                          paddingHorizontal: wp(10),
                          paddingVertical: hp(5),
                          margin: wp(10),
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.white,
                          borderRadius: wp(5),
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? colors.white
                              : colors.textSecondary,
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}
            />
            {/* Category */}
            {/* <Text style={styles.label}>Category</Text>
            <Controller
              name="category"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: errors.category ? 'red' : colors.borderColor,
                    },
                  ]}
                  placeholder="Enter category"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            /> */}

            {/* Status */}
            <Text style={styles.label}>Status</Text>
            <Controller
              name="status"
              control={control}
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <Dropdown
                  style={[styles.dropdown, error && styles.errorBorder]}
                  placeholderStyle={styles.placeholder}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={{
                    borderRadius: wp(10),
                  }}
                  data={[
                    { label: 'Draft', value: 'DRAFT' },
                    { label: 'Published', value: 'PUBLISHED' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select status"
                  value={value}
                  onChange={item => onChange(item.value)}
                  renderItem={item => {
                    const isSelected = item.value === value;
                    return (
                      <View
                        style={{
                          paddingHorizontal: wp(10),
                          paddingVertical: hp(5),
                          margin: wp(10),
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.white,
                          borderRadius: wp(5),
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? colors.white
                              : colors.textSecondary,
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}
            />
            {/* Description */}
            <Text style={styles.label}>Headline</Text>
            <Controller
              name="description"
              control={control}
              rules={{
                required: false,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: errors.description
                        ? 'red'
                        : colors.borderColor,
                    },
                  ]}
                  placeholder="Write a headline (between 5-20 characters)"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.createButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit(
                  isUpdated ? onCourseUpdate : onCreateCourse,
                )}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {isUpdated ? 'Update' : 'Create Course'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <FacingIssues
            title="facing issues in upload"
            messgae="Hello, I need help with uploading."
          />

        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </View>
  );
};

export default CreateCourse;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff'
  },
  flexGrow: {
    flex: 1
  },
  scrollArea: {
    padding: wp(16),
    paddingBottom: hp(40)
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: wp(12),
    padding: wp(16),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: fp(14),
    marginTop: hp(12),
    marginBottom: hp(6),
    color: '#333',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: wp(1),
    borderColor: '#e6e6e6',
    borderRadius: wp(8),
    paddingLeft: wp(10),
    height: hp(100),
  },
  placeholder: {
    fontSize: fp(14),
    color: colors.borderColor,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.primary,
  },
  actionsRow: {
    marginTop: hp(18),
    alignItems: 'flex-end'
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(12),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
    width: wp(160),
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fp(15)
  },
  buttonDisabled: {
    opacity: 0.65
  },
  dropdown: {
    height: hp(44),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(8),
    paddingHorizontal: wp(20),
    justifyContent: 'center',
  },
  errorBorder: { borderColor: 'red' },
  nameFields: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: wp(1),
    borderColor: colors.borderColor,
  },
  button: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textSecondary,
    fontSize: fp(14),
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: hp(150),
    borderRadius: wp(8),
    marginTop: hp(10),
  },
  uploadHeader: {
    alignItems: 'center',
    marginTop: hp(20),
  },
  uploadMain: {
    flexDirection: 'row',
    padding: wp(16),
    borderRadius: wp(10),
    backgroundColor: colors.white,
    elevation: 5,
    alignItems: 'center',
  },
  buttonHelp: {
    width: '30%',
    borderWidth: wp(1),
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: wp(5),
    paddingVertical: hp(5),
  },
  buttonHelpPara: {
    fontSize: fp(14),
    color: colors.white,
    fontWeight: '500',
    borderRadius: wp(10),
  },
  secHead: {
    width: '20%',
    alignItems: 'center',
  },
  mainHead: {
    width: '45%',
    alignItems: 'center',
  },
  mainPara: {
    fontSize: fp(16),
    fontWeight: '500',
  },
});
