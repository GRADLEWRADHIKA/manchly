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
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { pick, types } from '@react-native-documents/picker';
import {
  ArrowLeft,
  Type,
  FileText,
  Clock,
  IndianRupee,
  Mic,
  Video as VideoIcon,
  ImagePlus,
  ToggleLeft,
  MessageSquare,
  X,
  Plus,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import CustomTextInput from '../../../../components/CustomInput';
import { uploadShipDoc } from '../../../../store/Common';
import {
  createSessionProduct,
  updateSessionProduct,
} from '../../../../store/SessionSlice';
import EnhanceSuggestionCard from '../../../../components/ai/EnhanceSuggestionCard';

const SessionDetails: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const editing = route?.params?.data;
  const isUpdated = !!editing;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [categories, setCategories] = useState<string[]>(
    editing?.categories || [],
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: editing?.title || '',
      description: editing?.description || '',
      duration: editing ? String(editing.duration) : '',
      price: editing ? String(editing.price) : '',
      mode: editing?.mode || 'CALL',
      thumbnail_url: editing?.thumbnail_url || '',
      status: editing ? (editing.is_active ? 'ACTIVE' : 'DRAFT') : 'ACTIVE',
      thankyou_message: editing?.thankyou_message || '',
    },
  });

  const imagePicker = async (onChange: (val: string) => void) => {
    try {
      const res = await pick({ type: [types.images] });
      if (!res || res.length === 0) return;
      const file = { uri: res[0].uri, type: res[0].type, name: res[0].name };
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name || 'upload.jpg',
      } as any);
      const uploadRes: any = await dispatch(uploadShipDoc(formData)).unwrap();
      onChange(uploadRes?.data?.url);
      Toast.show({
        type: 'success',
        text1: 'Thumbnail uploaded!',
        position: 'top',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', position: 'top' });
    } finally {
      setUploading(false);
    }
  };

  const addCategory = () => {
    const tag = categoryInput.trim();
    if (!tag || categories.includes(tag)) return;
    setCategories(prev => [...prev, tag]);
    setCategoryInput('');
  };

  const removeCategory = (tag: string) => {
    setCategories(prev => prev.filter(c => c !== tag));
  };

  const onSubmit = (data: any) => {
    if (!data.title.trim() || !data.duration || !data.price) {
      Toast.show({
        type: 'error',
        text1: 'Title, duration and price are required',
        position: 'top',
      });
      return;
    }
    const durationNum = Number(data.duration);
    const priceNum = Number(data.price);
    if (!durationNum || durationNum <= 0 || isNaN(priceNum) || priceNum < 0) {
      Toast.show({
        type: 'error',
        text1: 'Enter a valid duration and price',
        position: 'top',
      });
      return;
    }

    setLoading(true);
    const payload: any = {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      duration: durationNum,
      price: priceNum,
      mode: data.mode === 'VIDEO' ? 'video' : 'call',
      thumbnail_url: data.thumbnail_url || undefined,
      categories,
      thankyou_message: data.thankyou_message.trim() || undefined,
      is_active: data.status === 'ACTIVE',
    };

    const action = isUpdated
           ? updateSessionProduct({ productId: editing.id, data: payload })
      : createSessionProduct(payload);

    dispatch(action)
      .unwrap()
      .then(() => navigation.goBack())
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={wp(22)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <View style={{ width: wp(22) }} />
      </View>

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
            {/* Title */}
            <View style={[styles.labelRow, styles.spaceBetween]}>
              <View style={styles.labelLeft}>
                <Type size={wp(14)} color={colors.gold} />
                <Text style={styles.label}>Title</Text>
              </View>
              <EnhanceSuggestionCard
                value={watch('title')}
                onAccept={text => setValue('title', text)}
                endpoint="/ai/session/enhance"
                kind="product_title"
                tone="warm"
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
                  placeholder="e.g. Quick Consult"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            {/* Description */}
            <View style={[styles.labelRow, styles.spaceBetween]}>
              <View style={styles.labelLeft}>
                <FileText size={wp(14)} color={colors.gold} />
                <Text style={styles.label}>Description (optional)</Text>
              </View>
              <EnhanceSuggestionCard
                value={watch('description')}
                onAccept={text => setValue('description', text)}
                endpoint="/ai/session/enhance"
                kind="product_blurb"
                tone="warm"
              />
            </View>
            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={[styles.input, styles.textArea]}
                  placeholder="What's included in this session?"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  multiline
                />
              )}
            />

            {/* Duration + Price */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Clock size={wp(14)} color={colors.gold} />
                  <Text style={styles.label}>Duration (min)</Text>
                </View>
                <Controller
                  name="duration"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <CustomTextInput
                      inputContainerStyle={[
                        styles.input,
                        errors.duration && styles.errorBorder,
                      ]}
                      keyboardType="numeric"
                      placeholder="30"
                      value={value}
                      onChange={(t: string) =>
                        onChange(t.replace(/[^0-9]/g, ''))
                      }
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <IndianRupee size={wp(14)} color={colors.gold} />
                  <Text style={styles.label}>Price (INR)</Text>
                </View>
                <Controller
                  name="price"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <CustomTextInput
                      inputContainerStyle={[
                        styles.input,
                        errors.price && styles.errorBorder,
                      ]}
                      keyboardType="numeric"
                      placeholder="500"
                      value={value}
                      onChange={(t: string) =>
                        onChange(t.replace(/[^0-9]/g, ''))
                      }
                    />
                  )}
                />
              </View>
            </View>

            {/* Mode */}
            <Text style={styles.sectionLabel}>Mode</Text>
            <Controller
              name="mode"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      value === 'CALL' && styles.modeCardActive,
                    ]}
                    onPress={() => onChange('CALL')}
                  >
                    <Mic
                      size={wp(20)}
                      color={value === 'CALL' ? colors.gold : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.modeCardTitle,
                        value === 'CALL' && styles.modeCardTitleActive,
                      ]}
                    >
                      Audio
                    </Text>
                    <Text style={styles.modeCardSub}>Audio call session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeCard,
                      value === 'VIDEO' && styles.modeCardActive,
                    ]}
                    onPress={() => onChange('VIDEO')}
                  >
                    <VideoIcon
                      size={wp(20)}
                      color={value === 'VIDEO' ? colors.gold : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.modeCardTitle,
                        value === 'VIDEO' && styles.modeCardTitleActive,
                      ]}
                    >
                      Video
                    </Text>
                    <Text style={styles.modeCardSub}>Video call session</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Thumbnail */}
            <Text style={styles.sectionLabel}>Select Thumbnail</Text>
            <Controller
              name="thumbnail_url"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    onPress={() => imagePicker(onChange)}
                    style={styles.thumbnailBtn}
                    disabled={uploading}
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
                          Recommended size: 1280 x 720
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

            {/* Categories */}
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.categoryInputRow}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Enter tag (e.g. Career, Business)"
                placeholderTextColor={colors.textMuted}
                value={categoryInput}
                onChangeText={setCategoryInput}
                onSubmitEditing={addCategory}
              />
              <TouchableOpacity
                style={styles.categoryAddBtn}
                onPress={addCategory}
              >
                <Plus size={wp(18)} color={colors.bg} />
              </TouchableOpacity>
            </View>
            {categories.length > 0 && (
              <View style={styles.chipRow}>
                {categories.map(tag => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => removeCategory(tag)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={wp(12)} color={colors.gold} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Status */}
            <View style={styles.labelRow}>
              <ToggleLeft size={wp(14)} color={colors.gold} />
              <Text style={styles.label}>Status</Text>
            </View>
            <Controller
              name="status"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderText}
                  selectedTextStyle={styles.selectedText}
                  containerStyle={styles.dropdownContainer}
                  data={[
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Draft', value: 'DRAFT' },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder="Select status"
                  value={value}
                  onChange={item => onChange(item.value)}
                />
              )}
            />

            {/* Thank you message */}
            <View style={styles.labelRow}>
              <MessageSquare size={wp(14)} color={colors.gold} />
              <Text style={styles.label}>Thank-you message (optional)</Text>
            </View>
            <Controller
              name="thankyou_message"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  inputContainerStyle={styles.input}
                  placeholder="A short note buyers see after purchase"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
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
                    {isUpdated ? 'Update' : 'Save'}
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

export default SessionDetails;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary,
  },
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
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(6) },
  spaceBetween: { justifyContent: 'space-between' },
  label: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: hp(18),
    marginBottom: hp(8),
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
  row: { flexDirection: 'row', gap: wp(12) },
  modeRow: { flexDirection: 'row', gap: wp(12) },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(16),
    borderRadius: wp(14),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.inputBg,
    gap: hp(4),
  },
  modeCardActive: { borderColor: colors.gold, backgroundColor: colors.goldDim },
  modeCardTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeCardTitleActive: { color: colors.gold },
  modeCardSub: { fontSize: fp(11), color: colors.textMuted },
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
  thumbnailBtnText: { color: colors.gold, fontSize: fp(14), fontWeight: '500' },
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
  categoryInputRow: { flexDirection: 'row', gap: wp(8) },
  categoryInput: {
    flex: 1,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    height: hp(46),
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.textPrimary,
  },
  categoryAddBtn: {
    width: hp(46),
    height: hp(46),
    borderRadius: wp(12),
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
    marginTop: hp(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.goldDim,
    borderRadius: wp(20),
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
  },
  chipText: { color: colors.gold, fontSize: fp(12), fontWeight: '600' },
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
  placeholderText: { fontSize: fp(14), color: colors.textMuted },
  selectedText: { fontSize: fp(14), color: colors.textPrimary },
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
});