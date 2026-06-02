import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { Briefcase, Clock, Video } from 'lucide-react-native';
import EnhanceSuggestionCard from '../../../../components/ai/EnhanceSuggestionCard';
import { MultiSelect } from 'react-native-element-dropdown';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { registerAsExpert, updateExpertProfile } from '../../../../store/SessionSlice';

const CATEGORIES = [
  'Business Consulting',
  'Career Guidance',
  'Finance & Tax',
  'Legal Advice',
  'Health & Wellness',
  'Fitness Coach',
  'Astrology',
  'Education & Tutoring',
  'Technology',
  'Marketing',
  'Design',
  'Life Coach',
].map(c => ({ label: c, value: c }));

const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Kannada',
].map(l => ({ label: l, value: l }));

type FormData = {
  profession: string;
  bio: string;
  experience: string;
  videoRate: string;
  categories: string[];
  languages: string[];
};

const ExpertRegistration: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);


  const editData = route.params?.expertProfile;
  const isEditing = !!editData;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      profession: editData?.profession || '',
      bio: editData?.bio || '',
      experience: editData?.experience?.toString() || '',
      videoRate: editData?.video_rate?.toString() || '',
      categories: editData?.categories || [],
      languages: editData?.languages || [],
    },
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    const payload = {
      profession: data.profession.trim(),
      bio: data.bio.trim() || undefined,
      categories: data.categories,
      experience: parseInt(data.experience, 10) || 0,
      video_rate: parseFloat(data.videoRate),
      languages: data.languages,
    };
    const action = isEditing
      ? updateExpertProfile(payload)
      : registerAsExpert(payload);
    dispatch(action)
      .unwrap()
      .then(() => navigation.goBack())
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title={isEditing ? 'Edit Session Profile' : 'Become a Session Expert'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Offer 1:1 Sessions</Text>
          <Text style={styles.bannerSub}>
            Register as a session expert to offer paid video
            consultations to users.
          </Text>
        </View>

        {/* Profession */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Your Profession *</Text>
          <EnhanceSuggestionCard
            value={watch('profession')}
            onAccept={(text) => setValue('profession', text)}
            endpoint="/ai/session/enhance"
            kind="headline"
            tone="warm"
          />
        </View>
        <Controller
          control={control}
          name="profession"
          rules={{ required: 'Profession is required' }}
          render={({ field: { onChange, value } }) => (
            <View
              style={[styles.inputRow, errors.profession && styles.inputError]}
            >
              <Briefcase
                size={wp(18)}
                color={colors.textMuted}
                strokeWidth={1.5}
              />
              <TextInput
                style={styles.inputInner}
                placeholder="e.g. Business Consultant, Coach"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />
        {errors.profession && (
          <Text style={styles.errorText}>{errors.profession.message}</Text>
        )}

        {/* Categories */}
        <Text style={styles.label}>Categories</Text>
        <Controller
          control={control}
          name="categories"
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              style={styles.dropdown}
              placeholderStyle={value.length > 0 ? styles.dropdownText : styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              data={CATEGORIES}
              labelField="label"
              valueField="value"
              placeholder={value.length > 0 ? value.join(', ') : 'Select categories'}
              value={value}
              onChange={onChange}
              visibleSelectedItem={false}
              activeColor={colors.primary + '10'}
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownContainer}
              search
              searchPlaceholder="Search categories..."
              inputSearchStyle={styles.searchInput}
            />
          )}
        />

        {/* Experience */}
        <Text style={styles.label}>Experience (Years)</Text>
        <Controller
          control={control}
          name="experience"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputRow}>
              <Clock size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
              <TextInput
                style={styles.inputInner}
                placeholder="e.g. 5"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            </View>
          )}
        />

        {/* Bio */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Bio / About</Text>
          <EnhanceSuggestionCard
            value={watch('bio')}
            onAccept={(text) => setValue('bio', text)}
            endpoint="/ai/session/enhance"
            kind="bio"
            tone="warm"
          />
        </View>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell users about your expertise..."
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        />

        {/* Rate */}
        <Text style={styles.label}>Video Call Rate (₹/min) *</Text>
        <Controller
          control={control}
          name="videoRate"
          rules={{ required: 'Video rate is required' }}
          render={({ field: { onChange, value } }) => (
            <View
              style={[styles.inputRow, errors.videoRate && styles.inputError]}
            >
              <Video size={wp(18)} color={colors.success} strokeWidth={1.5} />
              <TextInput
                style={styles.inputInner}
                placeholder="e.g. 30"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            </View>
          )}
        />
        {errors.videoRate && (
          <Text style={styles.errorText}>{errors.videoRate.message}</Text>
        )}

        {/* Languages */}
        <Text style={styles.label}>Languages</Text>
        <Controller
          control={control}
          name="languages"
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              style={styles.dropdown}
              placeholderStyle={value.length > 0 ? styles.dropdownText : styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              data={LANGUAGES}
              labelField="label"
              valueField="value"
              dropdownPosition="top"
              placeholder={value.length > 0 ? value.join(', ') : 'Select languages'}
              value={value}
              onChange={onChange}
              visibleSelectedItem={false}
              activeColor={colors.primary + '10'}
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownContainer}
            />
          )}
        />

        {/* Register */}
        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.registerBtnText}>
            {loading
              ? isEditing ? 'Updating...' : 'Registering...'
              : isEditing ? 'Update Profile' : 'Register as Expert'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
};

export default ExpertRegistration;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(40),
  },
  banner: {
    backgroundColor: colors.primary + '10',
    borderRadius: wp(14),
    padding: wp(16),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  bannerTitle: { fontSize: fp(17), fontWeight: '700', color: colors.primary },
  bannerSub: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(4),
    lineHeight: fp(18),
  },
  label: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.heading,
    marginBottom: hp(6),
    marginTop: hp(14),
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    fontSize: fp(14),
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textArea: { minHeight: hp(80), paddingTop: hp(12) },
  inputRow: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: Platform.OS === 'ios' ? hp(12) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputError: { borderColor: colors.error },
  inputInner: {
    flex: 1,
    fontSize: fp(14),
    color: colors.text,
    marginLeft: wp(8),
    paddingVertical: Platform.OS === 'ios' ? 0 : hp(12),
  },
  errorText: { fontSize: fp(11), color: colors.error, marginTop: hp(4) },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dropdownContainer: {
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownText: { fontSize: fp(14), color: colors.text },
  dropdownPlaceholder: { fontSize: fp(14), color: colors.textMuted },
  dropdownItemText: { fontSize: fp(13), color: colors.text },
  searchInput: {
    fontSize: fp(13),
    color: colors.text,
    borderRadius: wp(8),
    borderColor: colors.borderLight,
  },
  selectedChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: colors.info,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    marginTop: hp(8),
    marginRight: wp(6),
  },
  registerBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(24),
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { fontSize: fp(16), fontWeight: '700', color: colors.white },
});
