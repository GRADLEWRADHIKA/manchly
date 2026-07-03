import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Coins, Gift } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { createSessionProduct } from '../../../../store/SessionSlice';
import CustomTextInput from '../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';

const CreateSessionProduct: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const prefill = route.params?.prefill;

  const [title, setTitle] = useState(prefill?.title || '1:1 Expert Consulting');
  const [description, setDescription] = useState(prefill?.blurb || '');
  const [duration, setDuration] = useState(
    prefill?.duration_min ? String(prefill.duration_min) : '30',
  );
  const [price, setPrice] = useState(
    prefill?.suggested_price_inr ? String(prefill.suggested_price_inr) : '',
  );
  const [platform, setPlatform] = useState('Zoom');
  const [availability, setAvailability] = useState(
    'Available Mon-Fri, 9 AM - 5 PM EST. Please book at least 24 hours in advance.',
  );
  const [pricingModel, setPricingModel] = useState<'paid' | 'free'>(
    prefill?.suggested_price_inr && Number(prefill.suggested_price_inr) > 0 ? 'paid' : 'free',
  );
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!title.trim() || !duration) {
      Toast.show({
        type: 'error',
        text1: 'Please fill in all details',
        position: 'bottom',
      });
      return;
    }

    const finalPrice = pricingModel === 'free' ? 0 : parseFloat(price) || 0;

    setLoading(true);
    dispatch(
      createSessionProduct({
        title: title.trim(),
        description: `${description.trim()}\nPlatform: ${platform}\nAvailability: ${availability}`,
        duration: parseInt(duration),
        price: finalPrice,
        mode: 'video',
      }),
    )
      .unwrap()
      .then(() => {
        Toast.show({ type: 'success', text1: 'Session created!', position: 'bottom' });
        navigation.goBack();
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Failed to create session product',
          position: 'bottom',
        });
      })
      .finally(() => setLoading(false));
  };

  const renderDropdownItem = (item: any, selectedValue: any) => {
    const isSelected = item.value === selectedValue;
    return (
      <View style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}>
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {!embedded && <AppHeaderWithBack title="1:1 Session Details" />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Session Details Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>1:1 Session Details</Text>
            <Text style={styles.cardHeaderSubtitle}>
              Configure the specifics for your personalized coaching sessions.
            </Text>

            <Text style={styles.inputLabel}>SESSION DURATION</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.selectedText}
              containerStyle={styles.dropdownContainer}
              activeColor={colors.inputBg}
              data={[
                { label: '15 mins', value: '15' },
                { label: '30 mins', value: '30' },
                { label: '45 mins', value: '45' },
                { label: '60 mins', value: '60' },
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Duration"
              value={duration}
              onChange={item => setDuration(item.value)}
              renderItem={item => renderDropdownItem(item, duration)}
            />

            <Text style={styles.inputLabel}>MEETING PLATFORM</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.selectedText}
              containerStyle={styles.dropdownContainer}
              activeColor={colors.inputBg}
              data={[
                { label: 'Zoom', value: 'Zoom' },
                { label: 'Google Meet', value: 'Google Meet' },
                { label: 'Manchly Live', value: 'Manchly Live' },
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select Platform"
              value={platform}
              onChange={item => setPlatform(item.value)}
              renderItem={item => renderDropdownItem(item, platform)}
            />

            <Text style={styles.inputLabel}>AVAILABILITY</Text>
            <CustomTextInput
              inputContainerStyle={[styles.input, styles.textArea]}
              inputStyle={[styles.inputText, { textAlignVertical: 'top' }]}
              placeholder="e.g. Available Mon-Fri, 9 AM - 5 PM EST. Please book at least 24 hours in advance."
              placeholderTextColor={colors.textMuted}
              value={availability}
              onChange={setAvailability}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Pricing Model Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Pricing Model</Text>
            <Text style={styles.pricingSubtitle}>Set the value for your knowledge.</Text>

            <View style={styles.pricingPillRow}>
              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'paid' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => setPricingModel('paid')}
                activeOpacity={0.9}
              >
                <Coins size={16} color={pricingModel === 'paid' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'paid'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
                  ]}
                >
                  Paid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'free' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => {
                  setPricingModel('free');
                  setPrice('0');
                }}
                activeOpacity={0.9}
              >
                <Gift size={16} color={pricingModel === 'free' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'free'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
                  ]}
                >
                  Free
                </Text>
              </TouchableOpacity>
            </View>

            {pricingModel === 'paid' && (
              <View style={{ marginTop: hp(12) }}>
                <Text style={styles.inputLabel}>PRICE (INR)</Text>
                <CustomTextInput
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  placeholderTextColor={colors.textMuted}
                  value={price}
                  onChange={setPrice}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.primaryText}>Create 1:1 Session</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(CreateSessionProduct);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(40),
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
  },
  cardHeaderTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  cardHeaderSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(14),
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: hp(6),
    marginTop: hp(6),
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: wp(12),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(10),
  },
  inputText: {
    color: colors.white,
    fontSize: fp(14),
  },
  textArea: {
    height: hp(88),
  },
  dropdown: {
    height: hp(44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    marginBottom: hp(10),
  },
  dropdownContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.inputBg,
  },
  dropdownItemText: {
    color: colors.textSecondary,
    fontSize: fp(13),
  },
  dropdownItemTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: fp(14),
    color: colors.textMuted,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.white,
  },
  pricingSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  pricingPillRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  pricingPill: {
    flex: 1,
    height: hp(44),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
  },
  pricingPillActive: {
    backgroundColor: colors.gold,
  },
  pricingPillInactive: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingPillText: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  pricingPillTextActive: {
    color: '#000000',
  },
  pricingPillTextInactive: {
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  cancelBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(14),
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: colors.gold,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: fp(14),
  },
});