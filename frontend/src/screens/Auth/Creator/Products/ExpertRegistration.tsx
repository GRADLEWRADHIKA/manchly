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
import { BookOpen, Users, Presentation } from 'lucide-react-native';
import EnhanceSuggestionCard from '../../../../components/ai/EnhanceSuggestionCard';
import { MultiSelect } from 'react-native-element-dropdown';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import CreateStepHeader from '../../../../components/CreateStepHeader';
import LinearGradient from 'react-native-linear-gradient';
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
      <CreateStepHeader title="Session Details" active="session" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Banner replaced with card title/subtitle */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>1:1 Session Details</Text>
            <Text style={styles.bannerSub}>
              Configure the specifics for your personalized coaching sessions.
            </Text>
          </View>

          {/* Profession */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>YOUR PROFESSION</Text>
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
          <Text style={styles.label}>CATEGORIES</Text>
          <Controller
            control={control}
            name="categories"
            render={({ field: { onChange, value } }) => (
              <View style={{ zIndex: 20 }}>
                <MultiSelect
                  style={styles.dropdown}
                  placeholderStyle={value.length > 0 ? styles.dropdownText : styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  selectedStyle={styles.selectedChipStyle}
                  data={CATEGORIES}
                  labelField="label"
                  valueField="value"
                  placeholder={value.length > 0 ? value.join(', ') : 'Select categories'}
                  value={value}
                  onChange={onChange}
                  visibleSelectedItem={false}
                  activeColor={colors.goldDim}
                  itemTextStyle={styles.dropdownItemText}
                  containerStyle={styles.dropdownContainer}
                  search
                  searchPlaceholder="Search categories..."
                  inputSearchStyle={styles.searchInput}
                  maxHeight={hp(250)}
                  renderSelectedItem={() => null}
                />
              </View>
            )}
          />

          {/* Experience */}
          <Text style={styles.label}>EXPERIENCE (YEAR)</Text>
          <Controller
            control={control}
            name="experience"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputRow}>
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
            <Text style={styles.label}>BIO / ABOUT</Text>
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
          <Text style={styles.label}>VIDEO CALL RATE (₹/MIN)*</Text>
          <Controller
            control={control}
            name="videoRate"
            rules={{ required: 'Video rate is required' }}
            render={({ field: { onChange, value } }) => (
              <View
                style={[styles.inputRow, errors.videoRate && styles.inputError]}
              >
                <TextInput
                  style={styles.inputInner}
                  placeholder="e.g. 30 min"
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
          <Text style={styles.label}>LANGUAGE</Text>
          <Controller
            control={control}
            name="languages"
            render={({ field: { onChange, value } }) => (
              <View style={{ zIndex: 10 }}>
                <MultiSelect
                  style={styles.dropdown}
                  placeholderStyle={value.length > 0 ? styles.dropdownText : styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  selectedStyle={styles.selectedChipStyle}
                  data={LANGUAGES}
                  labelField="label"
                  valueField="value"
                  dropdownPosition="top"
                  placeholder={value.length > 0 ? value.join(', ') : 'Select Languages'}
                  value={value}
                  onChange={onChange}
                  visibleSelectedItem={false}
                  activeColor={colors.goldDim}
                  itemTextStyle={styles.dropdownItemText}
                  containerStyle={styles.dropdownContainer}
                  maxHeight={hp(250)}
                  renderSelectedItem={() => null}
                />
              </View>
            )}
          />

          {/* Register */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <LinearGradient
              colors={['#F3C36B', '#D49A3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            >
              <Text style={styles.registerBtnText}>
                {loading
                  ? isEditing ? 'Updating...' : 'Registering...'
                  : isEditing ? 'Update Profile' : 'Register as Expert'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
};

export default ExpertRegistration;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp(14),
    paddingHorizontal: wp(16),
  },
  stepperItem: {
    alignItems: 'center',
  },
  stepIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(4),
  },
  stepIconWrapActive: {
    borderWidth: wp(1.5),
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  stepLabelInactive: {
    fontSize: fp(9),
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    fontSize: fp(9),
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  scroll: {
    paddingHorizontal: wp(16),
    paddingTop: hp(4),
    paddingBottom: hp(40),
  },

  card: {
    backgroundColor: '#141414',
    borderRadius: wp(18),
    padding: wp(16),
  },

  banner: {
    marginBottom: hp(16),
  },
  bannerTitle: { fontSize: fp(18), fontWeight: '700', color: colors.textPrimary },
  bannerSub: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(4),
    lineHeight: fp(18),
  },
  label: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
    marginBottom: hp(6),
    marginTop: hp(14),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    fontSize: fp(14),
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: { minHeight: hp(80), paddingTop: hp(12) },
  inputRow: {
    backgroundColor: colors.bg,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: Platform.OS === 'ios' ? hp(12) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputError: { borderColor: colors.cError },
  inputInner: {
    flex: 1,
    fontSize: fp(14),
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 0 : hp(12),
  },
  errorText: { fontSize: fp(11), color: colors.cError, marginTop: hp(4) },
  dropdown: {
    backgroundColor: colors.bg,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dropdownContainer: {
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#141414',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownText: { fontSize: fp(14), color: colors.textPrimary },
  dropdownPlaceholder: { fontSize: fp(14), color: colors.textMuted },
  dropdownItemText: { fontSize: fp(14), color: colors.textPrimary, paddingVertical: hp(2) },
  searchInput: {
    fontSize: fp(13),
    color: colors.textPrimary,
    borderRadius: wp(8),
    borderColor: 'rgba(255,255,255,0.08)',
    height: hp(40),
  },
  selectedChipStyle: {
    borderRadius: wp(8),
    backgroundColor: colors.goldDim,
  },
  registerBtn: {
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(24),
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { fontSize: fp(16), fontWeight: '700', color: colors.black },

  cancelBtn: {
    backgroundColor: 'transparent',
    borderRadius: wp(14),
    borderWidth: wp(1.5),
    borderColor: colors.gold,
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(12),
  },
  cancelBtnText: { fontSize: fp(16), fontWeight: '700', color: colors.gold },
});