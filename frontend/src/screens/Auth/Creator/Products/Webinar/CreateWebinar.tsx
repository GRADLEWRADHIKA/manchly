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
import {
  createWebinar,
  updateWebinar,
} from '../../../../../store/WebinarSlice';
import Toast from 'react-native-toast-message';
import { pick, types } from '@react-native-documents/picker';
import { uploadShipDoc } from '../../../../../store/Common';
import moment from 'moment-timezone';
import FacingIssues from '../Course/components/FacingIssues';
import {
  CirclePlus,
  Calendar,
  Clock,
  ImagePlus,
  Timer,
  Tag,
  UsersRound,
  ToggleLeft,
  Type,
  IndianRupee,
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
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>(updatedata?.tags || []);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);

  useEffect(() => {
    const zones = moment.tz.names().map(tz => ({
      label: `${tz} (UTC ${moment().tz(tz).format('Z')})`,
      value: tz,
    }));
    setTimezones(zones);
  }, []);

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
  } = useForm({
    defaultValues: {
      title: updatedata?.title,
      description: updatedata?.description,
      thumbnail_url: updatedata?.thumbnail_url,
      price: String(updatedata?.price ?? '') || '',
      category: updatedata?.category,
      tags: updatedata?.tags,
      scheduled_at: updatedata?.scheduled_at,
      start_time: updatedata?.start_time || '',
      duration: String(updatedata?.duration ?? '') || '',
      timezone: updatedata?.timezone,
      max_participants: String(updatedata?.max_participants ?? '') || '',
      status: updatedata?.status,
    },
  });

  const onSubmit = (data: any) => {
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
      title: data?.title,
      description: data?.description,
      thumbnail_url: data?.thumbnail_url,
      price: Number(data?.price),
      category: 'webinar',
      start_time: data?.start_time,
      end_time: null,
      tags: data?.tags,
      scheduled_at: data?.scheduled_at,
      duration: Number(data?.duration),
      timezone: 'Asia/Kolkata',
      max_participants: Number(data?.max_participants),
      status: data?.status,
    };
    dispatch(createWebinar(payload))
      .unwrap()
      .then(() => {
        reset();
        navigation.goBack();
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };

  // calling the update the webinar
  const onUpdateSubmit = (data: any) => {
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
      webinar_id: updatedata?.id,
      body: {
        title: data?.title,
        description: data?.description,
        thumbnail_url: data?.thumbnail_url,
        price: Number(data?.price),
        category: 'webinar',
        start_time: data?.start_time,
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
        navigation.goBack();
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <View style={styles.safe}>
      <AppHeaderWithBack title={updatedata ? 'Update Webinar' : 'Create Webinar'} />

      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.labelRow, { marginTop: hp(10) }]}>
              <Type size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Title</Text>
            </View>
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
                    fontSize: fp(14),
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

            <View style={styles.labelRow}>
              <IndianRupee size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Price</Text>
            </View>
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
                    fontSize: fp(14),
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

            <View style={styles.labelRow}>
              <Calendar size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Date</Text>
            </View>
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
                  <Text style={{ fontSize: fp(14), color: colors.primary }}>
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

            <View style={styles.labelRow}>
              <Clock size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Start Time</Text>
            </View>

            <Controller
              control={control}
              name="start_time"
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <>
                  <TouchableOpacity
                    style={[styles.datePicker, error && styles.errorBorder]}
                    onPress={showTimePicker}
                  >
                    <Text style={{ fontSize: fp(14), color: colors.primary }}>
                      {value ? value : 'Select start time (24h)'}
                    </Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isTimePickerVisible}
                    mode="time"
                    is24Hour={true}
                    onConfirm={date => {
                      const formattedTime = moment(date).format('HH:mm'); // ✅ 24-hour format
                      onChange(formattedTime);
                      hideTimePicker();
                    }}
                    onCancel={hideTimePicker}
                  />
                </>
              )}
            />

            <View style={styles.labelRow}>
              <ImagePlus size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Select Thumbnail</Text>
            </View>
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
                      <Text style={{ fontSize: fp(13.5), color: colors.primary }}>
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

            <View style={styles.labelRow}>
              <Timer size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Duration</Text>
            </View>
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
                    fontSize: fp(14),
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

            <View style={styles.labelRow}>
              <Tag size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Categories</Text>
            </View>
            <Controller
              control={control}
              name="tags"
              defaultValue={tagList}
              render={({ field: { onChange }, fieldState: { error } }) => (
                <>
                  <View style={styles.customHeader}>
                    <CustomTextInput
                      inputContainerStyle={[
                        styles.nameFields,
                        {
                          borderColor: error ? 'red' : colors.borderColor,
                          width: '90%',
                          marginBottom: 0,
                        },
                      ]}
                      inputStyle={{
                        fontSize: fp(14),
                        color: colors.black,
                      }}
                      placeholderTextColor={colors.borderColor}
                      placeholder="Enter tag"
                      value={tagInput}
                      onChange={setTagInput as any}
                    />

                    <TouchableOpacity
                      style={styles.secHeader}
                      onPress={() => {
                        const trimmed = tagInput.trim();

                        if (!trimmed) {
                          Toast.show({
                            type: 'error',
                            text1: 'Please enter a tag',
                          });
                          return;
                        }

                        if (tagList.length >= 3) {
                          Toast.show({
                            type: 'error',
                            text1: 'You can add only 3 tags',
                          });
                          return;
                        }

                        if (tagList.includes(trimmed)) {
                          Toast.show({
                            type: 'error',
                            text1: 'Tag already added',
                          });
                          return;
                        }

                        const updatedTags = [...tagList, trimmed];
                        setTagList(updatedTags);
                        onChange(updatedTags);
                        setTagInput('');
                      }}
                    >
                      <CirclePlus
                        size={wp(30)}
                        color={colors.primary}
                        strokeWidth={1.6}
                      />
                    </TouchableOpacity>
                  </View>

                  {tagList?.length > 0 && (
                    <View style={styles.tagContainer}>
                      {tagList?.map((tag, index) => (
                        <View key={index} style={styles.tagItem}>
                          <Text style={styles.tagText}>{tag}</Text>

                          <TouchableOpacity
                            onPress={() => {
                              const updated = tagList.filter(
                                (_, i) => i !== index,
                              );
                              setTagList(updated);
                              onChange(updated);
                            }}
                          >
                            <Text style={styles.removeTag}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            />

            <View style={styles.labelRow}>
              <UsersRound size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Max Participants</Text>
            </View>
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
                    fontSize: fp(14),
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

            <View style={styles.labelRow}>
              <ToggleLeft size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Status</Text>
            </View>
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

            <View style={styles.labelRow}>
              <Type size={wp(14)} color={colors.textSecondary} />
              <Text style={styles.label}>Headline</Text>
            </View>
            <Controller
              name="description"
              control={control}
              rules={{
                required: false,
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
                    fontSize: fp(14),
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Write a headline (between 5–20 characters)"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={{ marginHorizontal: wp(5) }}>
              <FacingIssues
                title="facing issues in Webinar creation"
                messgae="Hello, I need help with webinar creation."
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(updatedata ? onUpdateSubmit : onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.primaryText}>
                {updatedata ? 'Update Webinar' : 'Create Webinar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: wp(16),
  },
  keyboardWrapper: {
    flex: 1,
  },
  formScroll: {
    paddingBottom: hp(24),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(6),
  },
  label: {
    fontSize: fp(13),
    color: colors.heading,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: wp(12),
    paddingVertical: hp(16),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(10),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fp(15),
  },
  primaryButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: hp(10),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(15),
  },
  nameFields: {
    borderRadius: wp(10),
    paddingHorizontal: wp(10),
    height: hp(44),
    width: '100%',
    borderWidth: wp(1),
    marginBottom: hp(10),
  },
  dropdown: {
    height: hp(44),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  errorBorder: {
    borderColor: 'red',
  },
  placeholder: {
    fontSize: fp(14),
    color: colors.borderColor,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.primary,
  },
  datePicker: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: wp(1),
    borderRadius: wp(10),
    height: hp(44),
    borderColor: colors.borderColor,
    paddingLeft: wp(12),
    marginBottom: hp(10),
  },
  imagePreview: {
    width: '100%',
    height: hp(150),
    borderRadius: wp(8),
    marginTop: hp(10),
  },
  customHeader: {
    flexDirection: 'row',
    marginBottom: hp(10),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secHeader: {
    width: '10%',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(10),
  },

  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    marginRight: wp(8),
    marginBottom: hp(8),
  },

  tagText: {
    color: colors.white,
    fontSize: fp(13),
    marginRight: wp(6),
  },

  removeTag: {
    color: colors.white,
    fontSize: fp(14),
    fontWeight: 'bold',
  },
});
