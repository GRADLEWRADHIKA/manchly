import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../../../../utils/colors';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../../components/CustomInput';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  createWebinar,
  updateWebinar,
} from '../../../../../store/WebinarSlice';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../../../store/Common';
import moment from 'moment-timezone';
import { requestMediaPermission } from '../../../../../utils/mediaPermission';

const CreateWebinarScreen = () => {
  const navigation = useNavigation();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [uploading, setUploading] = useState(false);
  const [timezones, setTimezones] = useState([]);
  const [activeTags, setActiveTags] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const route = useRoute();
  const updatedata = route?.params?.data;

  // const TAGS = ['AI', 'Machine Learning', 'Data Science'];
  const TAGS = [
    { label: 'AI', value: 'AI' },
    { label: 'Machine Learning', value: 'Machine Learning' },
    { label: 'Data Science', value: 'Data Science' },
  ];

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
    //  const hasPermission = await requestMediaPermission();
    
    //     if (!hasPermission) {
    //       Toast.show({
    //         type: 'error',
    //         text1: 'Permission required',
    //         text2: 'Please allow media access to upload images',
    //       });
    //       return;
    //     }
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

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: updatedata?.title,
      description: updatedata?.description,
      thumbnail_url: updatedata?.thumbnail_url,
      price: String(updatedata?.price ?? '') || '',
      category: updatedata?.category,
      tags: updatedata?.tags,
      scheduled_at: updatedata?.scheduled_at,
      duration: String(updatedata?.duration ?? '') || '',
      timezone: updatedata?.timezone,
      max_participants: String(updatedata?.max_participants ?? '') || '',
      status: updatedata?.status,
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      title: data?.title,
      description: data?.description,
      thumbnail_url: data?.thumbnail_url,
      price: Number(data?.price),
      category: 'webinar',
      tags: data?.tags,
      scheduled_at: data?.scheduled_at,
      duration: Number(data?.duration),
      timezone: data?.timezone,
      max_participants: Number(data?.max_participants),
      status: data?.status,
    };
    dispatch(createWebinar(payload))
      .unwrap()
      .then(response => {
        reset();
        navigation.goBack();
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // calling the update the webinar
  const onUpdateSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      webinar_id: updatedata?.id,
      body: {
        title: data?.title,
        description: data?.description,
        thumbnail_url: data?.thumbnail_url,
        price: Number(data?.price),
        category: 'webinar',
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
      .then(response => {
        reset();
        navigation.goBack();
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#fff" />
      <AppHeaderWithBack title="Create Webinar" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.label, { marginTop: 10 }]}>Title</Text>
            <Controller
              name="title"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required',
                },
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
                    fontSize: 14,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter title for the webinar"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Price</Text>
            <Controller
              name="price"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required',
                },
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
                    fontSize: 14,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter price for the webinar (₹499)"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            {/* <Text style={styles.label}>Category</Text>
            <Controller
              name="category"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required',
                },
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
                    fontSize: 14,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter category for the webinar"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            /> */}

            <Text style={styles.label}>Date</Text>
            <Controller
              control={control}
              name="scheduled_at"
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <TouchableOpacity
                  style={[styles.datePicker, error && styles.errorBorder]}
                  onPress={showDatePicker}
                >
                  <Text style={{ fontSize: 14, color: colors.primary }}>
                    {value ? value : 'Select Date'}
                  </Text>

                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={date => {
                      const formattedDate = date.toISOString().split('T')[0];
                      onChange(formattedDate);
                      hideDatePicker();
                    }}
                    onCancel={hideDatePicker}
                  />
                </TouchableOpacity>
              )}
            />

            <Text style={styles.label}>Select Thumbnnail</Text>
            <Controller
              name="thumbnail_url"
              control={control}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View>
                  <TouchableOpacity
                    onPress={() => imagePicker(onChange)}
                    style={[styles.datePicker, error && styles.errorBorder]}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={{ fontSize: 13.5, color: colors.primary }}>
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

            <Text style={styles.label}>Duration</Text>
            <Controller
              name="duration"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required',
                },
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
                    fontSize: 14,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter duration for the webinar (in minutes)"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Tags</Text>
            <Controller
              control={control}
              name="tags"
              render={({ field: { value, onChange } }) => (
                <MultiSelect
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.placeholder}
                  selectedTextStyle={styles.selectedText}
                  data={TAGS}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Tags"
                  value={value}
                  onChange={item => {
                    onChange(item);
                  }}
                  selectedStyle={styles.selectedItem}
                  activeColor="#00000010"
                  alwaysRenderSelectedItem={true}
                />
              )}
            />

            <Text style={styles.label}>Number of Participant</Text>
            <Controller
              name="max_participants"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'This field is required',
                },
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
                    fontSize: 14,
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter max participants for the webinar"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <Text style={styles.label}>Time zone</Text>
            <Controller
              name="timezone"
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
                    borderRadius: 10,
                  }}
                  data={timezones}
                  labelField="label"
                  valueField="value"
                  search
                  inputSearchStyle={{
                    borderRadius: 10,
                  }}
                  searchPlaceholder="Search by country name"
                  placeholder="Enter timezone for the webinar"
                  value={value}
                  dropdownPosition="top"
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
                    borderRadius: 10,
                  }}
                  data={[
                    { label: 'Published', value: 'PUBLISHED' },
                    { label: 'Draft', value: 'DRAFT' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Status"
                  value={value}
                  dropdownPosition="top"
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

            <Text style={styles.label}>Description</Text>
            <Controller
              name="description"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Please write a short description',
                },
                minLength: {
                  value: 5,
                  message: 'Description must be at least 10 characters long',
                },
                maxLength: {
                  value: 20,
                  message: 'Description cannot exceed 200 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.textArea,
                    {
                      borderColor: errors.description
                        ? 'red'
                        : colors.borderColor,
                      alignItems: 'flex-start',
                    },
                  ]}
                  placeholder="Write a description (between 5–20 characters)"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </ScrollView>
        </KeyboardAvoidingView>

        {updatedata ? (
          <View style={styles.actions}>
            <TouchableOpacity
              disabled={loading}
              style={styles.cancelBtn}
              onPress={() => {
                navigation.goBack();
                reset();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ width: '10%' }} />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                handleSubmit(onUpdateSubmit)();
              }}
              disabled={loading}
            >
              <Text style={styles.primaryText}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size={'small'} />
                ) : (
                  'Update Webinar'
                )}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              disabled={loading}
              style={styles.cancelBtn}
              onPress={() => {
                navigation.goBack();
                reset();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ width: '10%' }} />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                handleSubmit(onSubmit)();
              }}
              disabled={loading}
            >
              <Text style={styles.primaryText}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size={'small'} />
                ) : (
                  'Create Webinar'
                )}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default CreateWebinarScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  keyboardWrapper: {
    flex: 1,
  },
  formScroll: {
    paddingBottom: 24,
  },
  field: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 10,
    paddingLeft: 10,
    height: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItem: { flex: 1 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  inputInside: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  previewCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: colors.white,
  },
  previewTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  previewText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
  },
  actions: {
    marginTop: 15,
    flexDirection: 'row',
    marginBottom: 25,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  cancelText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  primaryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '45%',
  },
  nameFields: {
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    borderWidth: 1,
    marginBottom: 10,
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 10,
  },
  errorBorder: {
    borderColor: 'red',
  },
  placeholder: {
    fontSize: 14,
    color: colors.borderColor,
  },
  selectedText: {
    fontSize: 14,
    color: colors.primary,
  },
  datePicker: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    borderColor: colors.borderColor,
    paddingLeft: 12,
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  tags: {
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 10,
    height: 44,
    marginBottom: 10,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  tagsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tagsList: {
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.white,
    elevation: 5,
    marginHorizontal: 2,
  },
  tagsPara: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 26,
    fontWeight: '500',
  },
  dropdownContainer: {
    borderRadius: 8,
  },
  selectedItem: {
    borderRadius: 6,
    // backgroundColor: '#000',
  },
});
