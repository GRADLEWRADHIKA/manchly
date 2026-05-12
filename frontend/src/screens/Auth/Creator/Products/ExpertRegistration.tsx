import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {
  Briefcase,
  Clock,
  IndianRupee,
  Globe,
  Phone,
  Video,
  X,
  ChevronDown,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {registerAsExpert} from '../../../../store/SessionSlice';

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
];

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada'];

const ExpertRegistration: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [audioRate, setAudioRate] = useState('');
  const [videoRate, setVideoRate] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [showCats, setShowCats] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleCat = (c: string) =>
    setSelectedCats(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  const toggleLang = (l: string) =>
    setSelectedLangs(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]));

  const handleRegister = () => {
    if (!profession.trim() || !audioRate) return;
    setLoading(true);
    dispatch(
      registerAsExpert({
        profession: profession.trim(),
        bio: bio.trim() || undefined,
        categories: selectedCats,
        experience: parseInt(experience) || 0,
        audio_rate: parseFloat(audioRate),
        video_rate: parseFloat(videoRate) || parseFloat(audioRate),
        languages: selectedLangs,
      }),
    )
      .unwrap()
      .then(() => navigation.goBack())
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Become a Session Expert" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Offer 1:1 Sessions</Text>
          <Text style={styles.bannerSub}>
            Register as a session expert to offer paid audio & video consultations to users.
          </Text>
        </View>

        {/* Profession */}
        <Text style={styles.label}>Your Profession *</Text>
        <View style={styles.inputRow}>
          <Briefcase size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. Business Consultant, Coach"
            placeholderTextColor={colors.textMuted}
            value={profession}
            onChangeText={setProfession}
          />
        </View>

        {/* Categories */}
        <Text style={styles.label}>Categories</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowCats(!showCats)} activeOpacity={0.7}>
          <Text style={selectedCats.length ? styles.dropdownText : styles.dropdownPlaceholder}>
            {selectedCats.length ? `${selectedCats.length} selected` : 'Select categories'}
          </Text>
          <ChevronDown size={wp(18)} color={colors.textMuted} />
        </TouchableOpacity>
        {showCats && (
          <View style={styles.dropdownList}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.dropdownItem, selectedCats.includes(c) && styles.dropdownItemActive]}
                onPress={() => toggleCat(c)}>
                <Text style={[styles.dropdownItemText, selectedCats.includes(c) && {color: colors.info, fontWeight: '600'}]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedCats.length > 0 && (
          <View style={styles.chipRow}>
            {selectedCats.map(c => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
                <TouchableOpacity onPress={() => toggleCat(c)}>
                  <X size={wp(12)} color={colors.white} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        <Text style={styles.label}>Experience (Years)</Text>
        <View style={styles.inputRow}>
          <Clock size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 5"
            placeholderTextColor={colors.textMuted}
            value={experience}
            onChangeText={setExperience}
            keyboardType="numeric"
          />
        </View>

        {/* Bio */}
        <Text style={styles.label}>Bio / About</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell users about your expertise..."
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Rates */}
        <Text style={styles.label}>Audio Call Rate (₹/min) *</Text>
        <View style={styles.inputRow}>
          <Phone size={wp(18)} color={colors.info} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 15"
            placeholderTextColor={colors.textMuted}
            value={audioRate}
            onChangeText={setAudioRate}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.label}>Video Call Rate (₹/min)</Text>
        <View style={styles.inputRow}>
          <Video size={wp(18)} color={colors.success} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 30 (defaults to audio rate)"
            placeholderTextColor={colors.textMuted}
            value={videoRate}
            onChangeText={setVideoRate}
            keyboardType="numeric"
          />
        </View>

        {/* Languages */}
        <Text style={styles.label}>Languages</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowLangs(!showLangs)} activeOpacity={0.7}>
          <Text style={selectedLangs.length ? styles.dropdownText : styles.dropdownPlaceholder}>
            {selectedLangs.length ? `${selectedLangs.length} selected` : 'Select languages'}
          </Text>
          <ChevronDown size={wp(18)} color={colors.textMuted} />
        </TouchableOpacity>
        {showLangs && (
          <View style={styles.dropdownList}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.dropdownItem, selectedLangs.includes(l) && styles.dropdownItemActive]}
                onPress={() => toggleLang(l)}>
                <Text style={[styles.dropdownItemText, selectedLangs.includes(l) && {color: colors.info, fontWeight: '600'}]}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedLangs.length > 0 && (
          <View style={styles.chipRow}>
            {selectedLangs.map(l => (
              <View key={l} style={styles.chip}>
                <Text style={styles.chipText}>{l}</Text>
                <TouchableOpacity onPress={() => toggleLang(l)}>
                  <X size={wp(12)} color={colors.white} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Register */}
        <TouchableOpacity
          style={[styles.registerBtn, loading && {opacity: 0.6}]}
          activeOpacity={0.8}
          onPress={handleRegister}
          disabled={loading}>
          <Text style={styles.registerBtnText}>
            {loading ? 'Registering...' : 'Register as Expert'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default memo(ExpertRegistration);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  scroll: {paddingHorizontal: wp(16), paddingTop: hp(14), paddingBottom: hp(40)},
  banner: {
    backgroundColor: colors.info + '10',
    borderRadius: wp(14),
    padding: wp(16),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  bannerTitle: {fontSize: fp(17), fontWeight: '700', color: colors.info},
  bannerSub: {fontSize: fp(12), color: colors.textSecondary, marginTop: hp(4), lineHeight: fp(18)},
  label: {fontSize: fp(13), fontWeight: '600', color: colors.heading, marginBottom: hp(6), marginTop: hp(14)},
  input: {
    backgroundColor: colors.white, borderRadius: wp(12), paddingHorizontal: wp(14),
    paddingVertical: hp(12), fontSize: fp(14), color: colors.text, borderWidth: 1, borderColor: colors.borderLight,
  },
  textArea: {minHeight: hp(80), paddingTop: hp(12)},
  inputRow: {
    backgroundColor: colors.white, borderRadius: wp(12), paddingHorizontal: wp(14),
    paddingVertical: Platform.OS === 'ios' ? hp(12) : 0, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
  inputInner: {flex: 1, fontSize: fp(14), color: colors.text, marginLeft: wp(8), paddingVertical: Platform.OS === 'ios' ? 0 : hp(12)},
  dropdown: {
    backgroundColor: colors.white, borderRadius: wp(12), paddingHorizontal: wp(14),
    paddingVertical: hp(12), flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
  dropdownText: {fontSize: fp(14), color: colors.text},
  dropdownPlaceholder: {fontSize: fp(14), color: colors.textMuted},
  dropdownList: {
    backgroundColor: colors.white, borderRadius: wp(12), marginTop: hp(6),
    borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden',
  },
  dropdownItem: {paddingHorizontal: wp(14), paddingVertical: hp(10), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight},
  dropdownItemActive: {backgroundColor: colors.info + '10'},
  dropdownItemText: {fontSize: fp(13), color: colors.text},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: hp(8), gap: wp(6)},
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.info,
    borderRadius: wp(16), paddingHorizontal: wp(10), paddingVertical: hp(4), gap: wp(4),
  },
  chipText: {fontSize: fp(11), color: colors.white, fontWeight: '500'},
  registerBtn: {backgroundColor: colors.info, borderRadius: wp(14), paddingVertical: hp(16), alignItems: 'center', marginTop: hp(24)},
  registerBtnText: {fontSize: fp(16), fontWeight: '700', color: colors.white},
});
