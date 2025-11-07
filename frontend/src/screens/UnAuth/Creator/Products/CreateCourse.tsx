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
} from 'react-native';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { useForm, Controller } from 'react-hook-form';
import { createCourse, updateCourse } from '../../../../store/CourseSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import CustomTextInput from '../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';

const CreateCourse = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const Nav = useNavigation<any>();
  const route = useRoute();
  const isUpdated = route?.params?.isUpdated;
  const updateData = route?.params?.data;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      courseTitle: updateData?.title,
      price: String(updateData?.price??'') || '',
      description: updateData?.description,
      level: updateData?.level,
      status: updateData?.status,
      category: updateData?.category,
    },
  });

  const onCreateCourse = (data: any) => {
    setLoading(true);
    const payload = {
      title: data.courseTitle.trim(),
      description: data.description.trim(),
      price: Number(data.price) || 0,
      category: data?.category.trim() || '',
      level: data?.level,
      status: data?.status,
    };
    dispatch(createCourse(payload))
      .unwrap()
      .then(response => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Course created successfully!',
        });
        Nav.goBack();
        setLoading(false);
      })
      .catch(error => {
        Toast.show({
          type: 'error',
          text1: 'Failed to create course',
        });
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onCourseUpdate = (data: any) => {
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
      },
    };
    dispatch(updateCourse(payload))
      .unwrap()
      .then(response => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Course updated successfully!',
        });
        Nav.goBack();
        setLoading(false);
      })
      .catch(error => {
        Toast.show({
          type: 'error',
          text1: 'Failed to update course',
        });
        console.log('------error------', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <View style={styles.root}>
      <AppHeaderWithBack title="Create Course" />

      <KeyboardAvoidingView
        style={styles.flexGrow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollArea}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Course Title</Text>
            <Controller
              name="courseTitle"
              control={control}
              rules={{
                required: true,
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: error ? 'red' : colors.borderColor,
                    },
                  ]}
                  inputStyle={{
                    fontSize: 16,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter course title"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Price (INR)</Text>
            <Controller
              name="price"
              control={control}
              rules={{
                required: true,
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: error ? 'red' : colors.borderColor,
                    },
                  ]}
                  inputStyle={{
                    fontSize: 16,
                    color: colors.black,
                  }}
                  keyboardType="numeric"
                  placeholderTextColor={colors.borderColor}
                  placeholder="e.g ₹499"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Level</Text>
            <Controller
              control={control}
              name="level"
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <>
                  <Dropdown
                    style={[styles.dropdown, error && styles.errorBorder]}
                    placeholderStyle={styles.placeholder}
                    selectedTextStyle={styles.selectedText}
                    containerStyle={{
                      borderRadius: 10,
                    }}
                    data={[
                      {
                        label: 'Advanced',
                        value: 'Advanced',
                      },
                      {
                        label: 'Intermediate',
                        value: 'Intermediate',
                      },
                      {
                        label: 'Beginner',
                        value: 'Beginner',
                      },
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
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            margin: 10,
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.white,
                            borderRadius: 5,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? colors.white : colors.primary,
                            }}
                          >
                            {item.label}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </>
              )}
            />

            <Text style={styles.label}>Category</Text>
            <Controller
              name="category"
              control={control}
              rules={{
                required: true,
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: error ? 'red' : colors.borderColor,
                    },
                  ]}
                  inputStyle={{
                    fontSize: 16,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter category"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Status</Text>
            <Controller
              control={control}
              name="status"
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <>
                  <Dropdown
                    style={[styles.dropdown, error && styles.errorBorder]}
                    placeholderStyle={styles.placeholder}
                    selectedTextStyle={styles.selectedText}
                    containerStyle={{
                      borderRadius: 10,
                    }}
                    data={[
                      {
                        label: 'Draft',
                        value: 'DRAFT',
                      },
                      {
                        label: 'Published',
                        value: 'PUBLISHED',
                      },
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
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            margin: 10,
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.white,
                            borderRadius: 5,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? colors.white : colors.primary,
                            }}
                          >
                            {item.label}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </>
              )}
            />

            {/* Description */}
            <Text style={styles.label}>About this course</Text>
            <Controller
              name="description"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Please write a short description',
                },
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.textArea,
                    {
                      borderColor: error ? 'red' : colors.borderColor,
                      alignItems: 'flex-start',
                    },
                  ]}
                  inputStyle={{
                    fontSize: 16,
                    color: colors.black,
                  }}
                  placeholderTextColor="#999"
                  placeholder="Write a short description"
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={styles.actionsRow}>
              {isUpdated === true ? (
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    loading ? styles.buttonDisabled : null,
                  ]}
                  onPress={handleSubmit(onCourseUpdate)}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      'Update'
                    )}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    loading ? styles.buttonDisabled : null,
                  ]}
                  onPress={handleSubmit(onCreateCourse)}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      'Create Course'
                    )}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast />
    </View>
  );
};

export default CreateCourse;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flexGrow: { flex: 1 },
  scrollArea: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    paddingLeft: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    paddingLeft: 10,
    height: 100,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: { marginTop: 18, alignItems: 'flex-end' },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: 150,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    // marginTop: 20,
  },
  selectedText: {
    fontSize: 16,
    color: colors.primary,
  },
  placeholder: {
    fontSize: 16,
    color: colors.borderColor,
  },
  errorBorder: {
    borderColor: 'red',
  },
  nameFields: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
  },
});
