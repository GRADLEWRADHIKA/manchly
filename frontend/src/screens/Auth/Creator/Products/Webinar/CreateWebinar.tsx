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
import CreateStepHeader from '../../../../../components/CreateStepHeader';
import LinearGradient from 'react-native-linear-gradient';
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
import AccessExpiryField, { AccessPolicy } from '../../../../../components/AccessExpiryField';
import CommunityLinkField from '../../../../../components/CommunityLinkField';
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
import EnhanceSuggestionCard from '../../../../../components/ai/EnhanceSuggestionCard';

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
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>({
    access_duration_days: updatedata?.access_duration_days ?? null,
    access_expires_at: updatedata?.access_expires_at ?? null,
  });
  const [whatsappUrl, setWhatsappUrl] = useState(
    updatedata?.whatsapp_community_url || '',
  );
  const [thankYouMsg, setThankYouMsg] = useState(
    updatedata?.thankyou_message || '',
  );
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
        position: 'top',
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
        position: 'top',
      });
    } catch (err: any) {
      console.error('Image Upload Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Please try again later.',
        position: 'top',
      });
    } finally {
      setUploading(false);
    }
  };

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: updatedata?.title,
      description: updatedata?.description,
      thumbnail_url: updatedata?.thumbnail_url,
      price: String(updatedata?.price ?? '') || '',
      category: updatedata?.category,
      tags: updatedata?.tags,
      scheduled_at: updatedata?.scheduled_at
        ? moment(updatedata.scheduled_at).format('YYYY-MM-DD')
        : '',
      start_time: updatedata?.start_time || '',
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
      start_time: data?.start_time,
      end_time: null,
      tags: data?.tags,
      scheduled_at: data?.scheduled_at,
      duration: Number(data?.duration),
      timezone: moment.tz.guess() || 'Asia/Kolkata',
      max_participants: Number(data?.max_participants),
      status: data?.status,
      access_duration_days: accessPolicy.access_duration_days,
      access_expires_at: accessPolicy.access_expires_at,
      whatsapp_community_url: whatsappUrl.trim() || null,
      thankyou_message: thankYouMsg.trim() || null,
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
        timezone: data?.timezone || moment.tz.guess() || 'Asia/Kolkata',
        max_participants: Number(data?.max_participants),
        status: data?.status,
        access_duration_days: accessPolicy.access_duration_days,
        access_expires_at: accessPolicy.access_expires_at,
        whatsapp_community_url: whatsappUrl.trim() || null,
        thankyou_message: thankYouMsg.trim() || null,
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
      <CreateStepHeader title="Webinar Details" active="webinar" />

      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Webinar Details</Text>
              <Text style={styles.bannerSub}>
                Configure your live group sessions.
              </Text>
            </View>
            <View style={[styles.labelRow, { marginTop: hp(10), justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}>
                <Type size={wp(14)} color={'#F0C040'} />
                <Text style={styles.label}>Title</Text>
              </View>
              <EnhanceSuggestionCard
                value={watch('title') || ''}
                onAccept={(text) => setValue('title', text)}
                endpoint="/ai/webinar/enhance"
                kind="title"
                tone="punchy"
              />
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
                      borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(14),
                    color: colors.textPrimary,
                  }}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Enter title for the webinar"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={styles.labelRow}>
              <IndianRupee size={wp(14)} color={'#F0C040'} />
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
                      borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(14),
                    color: colors.textPrimary,
                  }}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Enter price for the webinar (₹499)"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={styles.labelRow}>
              <Calendar size={wp(14)} color={'#F0C040'} />
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
                  <Text style={{ fontSize: fp(14), color: value ? '#FFFFFF' : '#555558' }}>
                    {value ? value : 'Select Date'}
                  </Text>

                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={date => {
                      const formattedDate = moment(date).format('YYYY-MM-DD');
                      onChange(formattedDate);
                      hideDatePicker();
                    }}
                    onCancel={hideDatePicker}
                  />
                </TouchableOpacity>
              )}
            />

            <View style={styles.labelRow}>
              <Clock size={wp(14)} color={'#F0C040'} />
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
                    <Text style={{ fontSize: fp(14), color: value ? '#FFFFFF' : '#555558' }}>
                      {value
                        ? moment(value, 'HH:mm').format('hh:mm A')
                        : 'Select start time '}
                    </Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isTimePickerVisible}
                    mode="time"
                    is24Hour={false}
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
              <ImagePlus size={wp(14)} color={'#F0C040'} />
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
                      <ActivityIndicator color={'#F0C040'} />
                    ) : (
                      <Text
                        style={{ fontSize: fp(13.5), color: value ? '#FFFFFF' : '#555558' }}
                      >
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
              <Timer size={wp(14)} color={'#F0C040'} />
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
                      borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(14),
                    color: colors.textPrimary,
                  }}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Enter duration for the webinar (in minutes)"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={styles.labelRow}>
              <Tag size={wp(14)} color={'#F0C040'} />
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
                          borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                          width: '90%',
                          marginBottom: 0,
                        },
                      ]}
                      inputStyle={{
                        fontSize: fp(14),
                        color: colors.textPrimary,
                      }}
                      placeholderTextColor={colors.textMuted}
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
                        color={'#F0C040'}
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
              <UsersRound size={wp(14)} color={'#F0C040'} />
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
                      borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(14),
                    color: colors.textPrimary,
                  }}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Enter max participants for the webinar"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={styles.labelRow}>
              <ToggleLeft size={wp(14)} color={'#F0C040'} />
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
                  containerStyle={styles.dropdownContainer}
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
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      >
                        <Text
                          style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}
            />

            <View style={[styles.labelRow, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}>
                <Type size={wp(14)} color={'#F0C040'} />
                <Text style={styles.label}>Headline</Text>
              </View>
              <EnhanceSuggestionCard
                value={watch('description') || ''}
                onAccept={(text) => setValue('description', text)}
                endpoint="/ai/webinar/enhance"
                kind="description"
                tone="punchy"
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
                    styles.nameFields,
                    styles.textArea,
                    {
                      borderColor: error ? colors.cError : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(14),
                    color: colors.textPrimary,
                  }}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Write a headline"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  multiline
                />
              )}
            />

            <AccessExpiryField
              initialDurationDays={updatedata?.access_duration_days ?? null}
              initialExpiresAt={updatedata?.access_expires_at ?? null}
              onChange={setAccessPolicy}
            />

            <CommunityLinkField
              whatsappUrl={whatsappUrl}
              onChangeWhatsapp={setWhatsappUrl}
              message={thankYouMsg}
              onChangeMessage={setThankYouMsg}
            />

            </View>

            <View style={{ marginHorizontal: wp(5) }}>
              <FacingIssues
                title="Facing issues in webinar creation"
                messgae="Hello, I need help with webinar creation."
              />
            </View>

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
                onPress={handleSubmit(updatedata ? onUpdateSubmit : onSubmit)}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F3C36B', '#D49A3D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.black} size="small" />
                  ) : (
                    <Text style={styles.primaryText}>
                      {updatedata ? 'Update Webinar' : 'Create Webinar'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default CreateWebinarScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(18),
    padding: wp(16),
    marginTop: hp(4),
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(6),
  },
  label: {
    fontSize: fp(11),
    color: '#F0C040',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'column-reverse',
    gap: wp(12),
    paddingVertical: hp(16),
  },
  cancelBtn: {
    paddingVertical: hp(11),
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
  primaryButton: {
    paddingVertical: hp(11),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: fp(16),
  },
  nameFields: {
    borderRadius: wp(10),
    paddingHorizontal: wp(10),
    height: hp(46),
    width: '100%',
    borderWidth: wp(1),
    marginBottom: hp(10),
    backgroundColor: colors.inputBg,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.textPrimary,
  },
  textArea: {
    height: hp(90),
    alignItems: 'flex-start',
  },
  dropdown: {
    height: hp(46),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    marginBottom: hp(10),
    backgroundColor: colors.inputBg,
  },
  dropdownContainer: {
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
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
  errorBorder: {
    borderColor: colors.cError,
  },
  placeholder: {
    fontSize: fp(14),
    color: colors.textMuted,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.textPrimary,
  },
  datePicker: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: wp(1),
    borderRadius: wp(10),
    height: hp(46),
    borderColor: 'rgba(255,255,255,0.08)',
    paddingLeft: wp(12),
    marginBottom: hp(10),
    backgroundColor: colors.inputBg,
  },
  imagePreview: {
    width: '100%',
    height: hp(150),
    borderRadius: wp(8),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    marginRight: wp(8),
    marginBottom: hp(8),
  },

  tagText: {
    color: colors.gold,
    fontSize: fp(13),
    marginRight: wp(6),
  },

  removeTag: {
    color: colors.gold,
    fontSize: fp(14),
    fontWeight: 'bold',
  },
});
