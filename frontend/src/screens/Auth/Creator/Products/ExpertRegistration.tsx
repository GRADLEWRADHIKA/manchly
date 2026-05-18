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
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { Briefcase, Clock, Phone, Video } from 'lucide-react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { registerAsExpert } from '../../../../store/SessionSlice';

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
  audioRate: string;
  videoRate: string;
  categories: string[];
  languages: string[];
};

const ExpertRegistration: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      profession: '',
      bio: '',
      experience: '',
      audioRate: '',
      videoRate: '',
      categories: [],
      languages: [],
    },
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    dispatch(
      registerAsExpert({
        profession: data.profession.trim(),
        bio: data.bio.trim() || undefined,
        categories: data.categories,
        experience: parseInt(data.experience, 10) || 0,
        audio_rate: parseFloat(data.audioRate),
        video_rate: parseFloat(data.videoRate) || parseFloat(data.audioRate),
        languages: data.languages,
      }),
    )
      .unwrap()
      .then(() => navigation.goBack())
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Become a Session Expert" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Offer 1:1 Sessions</Text>
          <Text style={styles.bannerSub}>
            Register as a session expert to offer paid audio & video
            consultations to users.
          </Text>
        </View>

        {/* Profession */}
        <Text style={styles.label}>Your Profession *</Text>
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
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              data={CATEGORIES}
              labelField="label"
              valueField="value"
              placeholder="Select categories"
              value={value}
              onChange={onChange}
              selectedStyle={styles.selectedChip}
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
        <Text style={styles.label}>Bio / About</Text>
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

        {/* Rates */}
        <Text style={styles.label}>Audio Call Rate (₹/min) *</Text>
        <Controller
          control={control}
          name="audioRate"
          rules={{ required: 'Audio rate is required' }}
          render={({ field: { onChange, value } }) => (
            <View
              style={[styles.inputRow, errors.audioRate && styles.inputError]}
            >
              <Phone size={wp(18)} color={colors.info} strokeWidth={1.5} />
              <TextInput
                style={styles.inputInner}
                placeholder="e.g. 15"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            </View>
          )}
        />
        {errors.audioRate && (
          <Text style={styles.errorText}>{errors.audioRate.message}</Text>
        )}

        <Text style={styles.label}>Video Call Rate (₹/min)</Text>
        <Controller
          control={control}
          name="videoRate"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputRow}>
              <Video size={wp(18)} color={colors.success} strokeWidth={1.5} />
              <TextInput
                style={styles.inputInner}
                placeholder="e.g. 30 (defaults to audio rate)"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            </View>
          )}
        />

        {/* Languages */}
        <Text style={styles.label}>Languages</Text>
        <Controller
          control={control}
          name="languages"
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              data={LANGUAGES}
              labelField="label"
              valueField="value"
              dropdownPosition="top"
              placeholder="Select languages"
              value={value}
              onChange={onChange}
              selectedStyle={styles.selectedChip}
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
            {loading ? 'Registering...' : 'Register as Expert'}
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
