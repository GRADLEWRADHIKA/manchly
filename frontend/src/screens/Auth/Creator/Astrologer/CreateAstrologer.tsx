import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  Plus,
  Clock,
  IndianRupee,
  Star,
  Phone,
  Video,
  MessageCircle,
  ChevronDown,
  X,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const SPECIALIZATIONS = [
  'Vedic Astrology',
  'Numerology',
  'Tarot Reading',
  'Palmistry',
  'Vastu Shastra',
  'KP Astrology',
  'Horoscope Reading',
  'Face Reading',
];

const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Kannada',
];

const CreateAstrologer: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [pricePerMin, setPricePerMin] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [callEnabled, setCallEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec],
    );
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang],
    );
  };

  const handleSubmit = () => {
    // UI only - would dispatch to API
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Create Astrologer" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + hp(30)},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <TouchableOpacity style={styles.imagePickerWrap} activeOpacity={0.7}>
          {profileImage ? (
            <Image source={{uri: profileImage}} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={wp(32)} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Astrologer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Experience */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Experience (Years)</Text>
          <View style={styles.inputWithIcon}>
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
        </View>

        {/* Price per minute */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per Minute</Text>
          <View style={styles.inputWithIcon}>
            <IndianRupee
              size={wp(18)}
              color={colors.textMuted}
              strokeWidth={1.5}
            />
            <TextInput
              style={styles.inputInner}
              placeholder="e.g. 15"
              placeholderTextColor={colors.textMuted}
              value={pricePerMin}
              onChangeText={setPricePerMin}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specializations</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            activeOpacity={0.7}
            onPress={() => setShowSpecDropdown(!showSpecDropdown)}>
            <Text
              style={[
                styles.dropdownTriggerText,
                selectedSpecs.length === 0 && {color: colors.textMuted},
              ]}>
              {selectedSpecs.length > 0
                ? `${selectedSpecs.length} selected`
                : 'Select specializations'}
            </Text>
            <ChevronDown
              size={wp(18)}
              color={colors.textMuted}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          {showSpecDropdown && (
            <View style={styles.dropdownList}>
              {SPECIALIZATIONS.map(spec => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.dropdownItem,
                    selectedSpecs.includes(spec) && styles.dropdownItemActive,
                  ]}
                  onPress={() => toggleSpec(spec)}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedSpecs.includes(spec) &&
                        styles.dropdownItemTextActive,
                    ]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedSpecs.length > 0 && (
            <View style={styles.chipRow}>
              {selectedSpecs.map(spec => (
                <View key={spec} style={styles.chip}>
                  <Text style={styles.chipText}>{spec}</Text>
                  <TouchableOpacity onPress={() => toggleSpec(spec)}>
                    <X size={wp(12)} color={colors.white} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Languages */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Languages</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            activeOpacity={0.7}
            onPress={() => setShowLangDropdown(!showLangDropdown)}>
            <Text
              style={[
                styles.dropdownTriggerText,
                selectedLangs.length === 0 && {color: colors.textMuted},
              ]}>
              {selectedLangs.length > 0
                ? `${selectedLangs.length} selected`
                : 'Select languages'}
            </Text>
            <ChevronDown
              size={wp(18)}
              color={colors.textMuted}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          {showLangDropdown && (
            <View style={styles.dropdownList}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.dropdownItem,
                    selectedLangs.includes(lang) && styles.dropdownItemActive,
                  ]}
                  onPress={() => toggleLang(lang)}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedLangs.includes(lang) &&
                        styles.dropdownItemTextActive,
                    ]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedLangs.length > 0 && (
            <View style={styles.chipRow}>
              {selectedLangs.map(lang => (
                <View key={lang} style={styles.chip}>
                  <Text style={styles.chipText}>{lang}</Text>
                  <TouchableOpacity onPress={() => toggleLang(lang)}>
                    <X size={wp(12)} color={colors.white} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write about the astrologer's expertise, background..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Consultation Modes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consultation Modes</Text>
          <View style={styles.modesRow}>
            <TouchableOpacity
              style={[styles.modeCard, callEnabled && styles.modeCardActive]}
              onPress={() => setCallEnabled(!callEnabled)}
              activeOpacity={0.7}>
              <Phone
                size={wp(22)}
                color={callEnabled ? colors.white : colors.textMuted}
                strokeWidth={1.8}
              />
              <Text
                style={[
                  styles.modeLabel,
                  callEnabled && styles.modeLabelActive,
                ]}>
                Audio Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, videoEnabled && styles.modeCardActive]}
              onPress={() => setVideoEnabled(!videoEnabled)}
              activeOpacity={0.7}>
              <Video
                size={wp(22)}
                color={videoEnabled ? colors.white : colors.textMuted}
                strokeWidth={1.8}
              />
              <Text
                style={[
                  styles.modeLabel,
                  videoEnabled && styles.modeLabelActive,
                ]}>
                Video Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, chatEnabled && styles.modeCardActive]}
              onPress={() => setChatEnabled(!chatEnabled)}
              activeOpacity={0.7}>
              <MessageCircle
                size={wp(22)}
                color={chatEnabled ? colors.white : colors.textMuted}
                strokeWidth={1.8}
              />
              <Text
                style={[
                  styles.modeLabel,
                  chatEnabled && styles.modeLabelActive,
                ]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Time Slots */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Time Slots</Text>
          <View style={styles.slotRow}>
            {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'].map(
              slot => (
                <View key={slot} style={styles.slotChip}>
                  <Text style={styles.slotChipText}>{slot}</Text>
                </View>
              ),
            )}
            <TouchableOpacity style={styles.addSlotBtn} activeOpacity={0.7}>
              <Plus size={wp(16)} color={colors.info} strokeWidth={2} />
              <Text style={styles.addSlotText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.8}
          onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Create Astrologer Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default memo(CreateAstrologer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(20),
  },
  imagePickerWrap: {
    alignSelf: 'center',
    marginBottom: hp(20),
  },
  profileImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
  },
  imagePlaceholder: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(4),
  },
  inputGroup: {
    marginBottom: hp(18),
  },
  label: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.heading,
    marginBottom: hp(6),
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
  textArea: {
    minHeight: hp(100),
    paddingTop: hp(12),
  },
  inputWithIcon: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: Platform.OS === 'ios' ? hp(12) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputInner: {
    flex: 1,
    fontSize: fp(14),
    color: colors.text,
    marginLeft: wp(8),
    paddingVertical: Platform.OS === 'ios' ? 0 : hp(12),
  },
  dropdownTrigger: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dropdownTriggerText: {
    fontSize: fp(14),
    color: colors.text,
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    marginTop: hp(6),
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: colors.info + '15',
  },
  dropdownItemText: {
    fontSize: fp(13),
    color: colors.text,
  },
  dropdownItemTextActive: {
    color: colors.info,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(8),
    gap: wp(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info,
    borderRadius: wp(16),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    gap: wp(4),
  },
  chipText: {
    fontSize: fp(11),
    color: colors.white,
    fontWeight: '500',
  },
  modesRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: hp(6),
  },
  modeCardActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  modeLabel: {
    fontSize: fp(11),
    color: colors.textMuted,
    fontWeight: '500',
  },
  modeLabelActive: {
    color: colors.white,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
  },
  slotChip: {
    backgroundColor: colors.white,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  slotChipText: {
    fontSize: fp(12),
    color: colors.text,
    fontWeight: '500',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderWidth: 1,
    borderColor: colors.info,
    borderStyle: 'dashed',
  },
  addSlotText: {
    fontSize: fp(12),
    color: colors.info,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.info,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(10),
    shadowColor: colors.info,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
});
