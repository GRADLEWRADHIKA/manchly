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
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import moment from 'moment-timezone';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useForm, Controller } from 'react-hook-form';
import {
  createWebinar,
  updateWebinar,
} from '../../../../../store/WebinarSlice';
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
  ToggleLeft,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react-native';
import EnhanceSuggestionCard from '../../../../../components/ai/EnhanceSuggestionCard';

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
];

const CreateWebinar = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const Nav = useNavigation<any>();
  const route = useRoute<any>();
  const isUpdated = route?.params?.isUpdated;
  const updateData = route?.params?.data;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Scheduled date/time (kept outside react-hook-form; it's a Date object)
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    updateData?.scheduled_at ? new Date(updateData.scheduled_at) : null,
  );
  const [scheduleError, setScheduleError] = useState(false);
  // Android needs two steps (date, then time). iOS shows one datetime picker.
  const [pickerMode, setPickerMode] = useState<null | 'date' | 'time'>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: updateData?.title || '',
      price: String(updateData?.price ?? '') || '',
      description: updateData?.description || '',
      duration: String(updateData?.duration_minutes ?? '60'),
      status: updateData?.status || '',
      thumbnail: updateData?.thumbnail || '',
    },
  });

  // ---------- Date / time picker ----------
  const onPickerChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed' || !selected) {
        setPickerMode(null);
        return;
      }
      if (pickerMode === 'date') {
        // keep the chosen date, then ask for the time
        const base = scheduledAt ? new Date(scheduledAt) : new Date();
        base.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
        setScheduledAt(base);
        setPickerMode('time');
      } else {
        const base = scheduledAt ? new Date(scheduledAt) : new Date();
        base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setScheduledAt(base);
        setScheduleError(false);
        setPickerMode(null);
      }
    } else {
      if (selected) {
        setScheduledAt(selected);
        setScheduleError(false);
      }
    }
  };

  // ---------- Thumbnail ----------
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
      onChange(res?.data?.url);
      Toast.show({
        type: 'success',
        text1: 'Image uploaded!',
        position: 'top',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Upload Failed', position: 'top' });
    } finally {
      setUploading(false);
    }
  };

  // ---------- Submit ----------
  const buildBody = (data: any) => ({
    title: data.title.trim(),
    description: data.description.trim(),
    price: Number(data.price) || 0,
    status: data.status,
    thumbnail: data.thumbnail,
    scheduled_at: scheduledAt!.toISOString(),
    duration_minutes: Number(data.duration) || 60,
  });

  const validateSchedule = () => {
    if (!scheduledAt) {
      setScheduleError(true);
      return false;
    }
    // Only block past dates when creating; editing an old webinar is allowed
    if (!isUpdated && moment(scheduledAt).isBefore(moment())) {
      setScheduleError(true);
      Toast.show({
        type: 'error',
        text1: 'Pick a future date and time',
        position: 'top',
      });
      return false;
    }
    setScheduleError(false);
    return true;
  };

  // Error toasts are already shown inside the thunks, so no extra toast in catch.
  const onCreateWebinar = (data: any) => {
    if (!validateSchedule()) return;
    setLoading(true);
    dispatch(createWebinar(buildBody(data)))
      .unwrap()
      .then(() => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Webinar created!',
          position: 'top',
        });
        Nav.goBack();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const onUpdateWebinar = (data: any) => {
    if (!validateSchedule()) return;
    setLoading(true);
    dispatch(
      updateWebinar({ webinar_id: updateData?.id, body: buildBody(data) }),
    )
      .unwrap()
      .then(() => {
        reset();
        Nav.goBack();
      })
      .catch(() => {})
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
        title={isUpdated ? 'Edit Webinar' : 'Webinar Details'}
        bgColor='transparent'
        textColor='#FFF'
      />

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
          <View style={styles.card}>
            {/* Title */}
            <View
              style={[styles.labelRow, { justifyContent: 'space-between' }]}
            >
              <View style={styles.labelInline}>
                <Type size={wp(14)} color={colors.gold} />
                <Text style={styles.label}>Webinar Title</Text>
              </View>
              <EnhanceSuggestionCard
                value={watch('title')}
                onAccept={text => setValue('title', text)}
                endpoint="/ai/course/enhance"
                kind="title"
                tone="punchy"
              />
            </View>
            <Controller
              name="title"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.input,
                    errors.title && styles.errorBorder,
                  ]}
                  placeholder="Enter webinar title"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            {/* Description */}
            <View
              style={[styles.labelRow, { justifyContent: 'space-between' }]}
            >
              <View style={styles.labelInline}>
                <FileText size={wp(14)} color={colors.gold} />
                <Text style={styles.label}>Description</Text>
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
              rules={{ required: true, minLength: 5, maxLength: 200 }}
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

            {/* Schedule section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <Text style={styles.sectionSub}>
                Choose when your webinar goes live and how long it runs.
              </Text>
            </View>

            <View style={styles.labelRow}>
              <Calendar size={wp(14)} color={colors.gold} />
              <Text style={styles.label}>Date & Time</Text>
            </View>
            <TouchableOpacity
              style={[styles.dropdown, scheduleError && styles.errorBorder]}
              activeOpacity={0.8}
              onPress={() =>
                setPickerMode(Platform.OS === 'ios' ? 'date' : 'date')
              }
            >
              <Text
                style={
                  scheduledAt ? styles.selectedText : styles.placeholderText
                }
              >
                {scheduledAt
                  ? moment(scheduledAt).format('ddd, D MMM YYYY • h:mm A')
                  : 'Select date and time'}
              </Text>
            </TouchableOpacity>

            {pickerMode && (
              <DateTimePicker
                value={scheduledAt || new Date()}
                mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={isUpdated ? undefined : new Date()}
                themeVariant="dark"
                onChange={(e, d) => {
                  onPickerChange(e, d);
                }}
              />
            )}
            {Platform.OS === 'ios' && pickerMode && (
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setPickerMode(null)}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            )}

            <View style={styles.labelRow}>
              <Clock size={wp(14)} color={colors.gold} />
              <Text style={styles.label}>Duration</Text>
            </View>
            <Controller
              name="duration"
              control={control}
              rules={{ required: true }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <Dropdown
                  style={[styles.dropdown, error && styles.errorBorder]}
                  placeholderStyle={styles.placeholderText}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={styles.dropdownContainer}
                  data={DURATION_OPTIONS}
                  labelField="label"
                  valueField="value"
                  placeholder="Select duration"
                  value={value}
                  onChange={item => onChange(item.value)}
                  renderItem={item => renderDropdownItem(item, value)}
                />
              )}
            />

            {/* Pricing section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pricing & Status</Text>
              <Text style={styles.sectionSub}>
                Set the ticket price and whether the webinar is visible.
              </Text>
            </View>

            <View style={styles.labelRow}>
              <IndianRupee size={wp(14)} color={colors.gold} />
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
                  placeholder="e.g ₹499 (enter 0 for free)"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <View style={styles.labelRow}>
              <ToggleLeft size={wp(14)} color={colors.gold} />
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

            {/* Thumbnail */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Webinar Thumbnail</Text>
              <Text style={styles.sectionSub}>
                Upload an attractive thumbnail for your webinar.
              </Text>
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
                      <ActivityIndicator color={colors.gold} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <ImagePlus size={wp(18)} color={colors.gold} />
                        <Text style={styles.thumbnailBtnText}>
                          {value ? 'Change Thumbnail' : 'Choose Thumbnail'}
                        </Text>
                        <Text style={styles.thumbnailBtnCaption}>
                          Recommended size 1280 x 720
                        </Text>
                      </View>
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
          </View>

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
              onPress={handleSubmit(
                isUpdated ? onUpdateWebinar : onCreateWebinar,
                () => {
                  if (!scheduledAt) setScheduleError(true);
                },
              )}
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
                    {isUpdated ? 'Update Webinar' : 'Create Webinar'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateWebinar;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  flex: { flex: 1 },
  scrollArea: { padding: wp(16), paddingBottom: hp(24) },
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: wp(18),
    padding: wp(16),
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(12),
    marginBottom: hp(6),
  },
  labelInline: { flexDirection: 'row', alignItems: 'center', gap: wp(6) },
  label: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

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
  textArea: { height: hp(88), alignItems: 'flex-start' },
  errorBorder: { borderWidth: 1.5, borderColor: colors.cError },

  thumbnailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    borderRadius: wp(12),
    minHeight: hp(64),
    paddingVertical: hp(10),
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
  thumbnailBtnCaption: {
    color: colors.textMuted,
    fontSize: fp(11),
    marginTop: hp(2),
  },
  imagePreview: {
    width: '100%',
    height: hp(160),
    borderRadius: wp(12),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

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
    backgroundColor: colors.primaryDark,
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
  dropdownItemSelected: { backgroundColor: colors.goldDim },
  dropdownItemText: { color: colors.textSecondary, fontSize: fp(14) },
  dropdownItemTextSelected: { color: colors.gold, fontWeight: '600' },
  placeholderText: { fontSize: fp(14), color: colors.textMuted },
  selectedText: { fontSize: fp(14), color: colors.textPrimary },

  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: hp(6),
    paddingHorizontal: wp(14),
  },
  doneText: { color: colors.gold, fontWeight: '700', fontSize: fp(14) },

  actions: {
    flexDirection: 'column-reverse',
    gap: wp(12),
    paddingVertical: hp(14),
  },
  cancelBtn: {
    paddingVertical: hp(11),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: wp(1.5),
    borderColor: colors.gold,
  },
  cancelText: { color: colors.gold, fontWeight: '700', fontSize: fp(16) },
  primaryBtn: {
    paddingVertical: hp(11),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.black, fontWeight: '800', fontSize: fp(16) },

  sectionHeader: { marginTop: hp(20), marginBottom: hp(4) },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: fp(11.5),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(3),
    lineHeight: fp(16),
  },
});
