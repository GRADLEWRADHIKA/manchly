// CreateWebinar.tsx (new, matching right screenshot)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import CustomTextInput from '../../../../components/CustomInput';
import { Coins, Gift } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

const CreateWebinar = ({ embedded = false }: { embedded?: boolean }) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const [headline, setHeadline] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [participants, setParticipants] = useState('');
  const [pricingModel, setPricingModel] = useState<'paid' | 'free'>('paid');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!headline.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a webinar headline', position: 'bottom' });
      return;
    }
    setLoading(true);
    // dispatch(createWebinar({...}))
    setTimeout(() => {
      setLoading(false);
      Toast.show({ type: 'success', text1: 'Webinar created!', position: 'bottom' });
      navigation.goBack();
    }, 1000);
  };

  return (
    <View style={styles.root}>
      {!embedded && <AppHeaderWithBack title="Create Webinar" />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Webinar Details Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Webinar Details</Text>
            <Text style={styles.cardHeaderSubtitle}>Configure your live group sessions.</Text>

            <Text style={styles.inputLabel}>WEBINAR HEADLINE</Text>
            <CustomTextInput
              inputContainerStyle={styles.input}
              inputStyle={styles.inputText}
              placeholder="e.g. Learn Smarter, Work Better"
              placeholderTextColor={colors.textMuted}
              value={headline}
              onChange={setHeadline}
            />

            <Text style={styles.inputLabel}>WEBINAR DATE & TIME</Text>
            <CustomTextInput
              inputContainerStyle={styles.input}
              inputStyle={styles.inputText}
              placeholder="Select date and time"
              placeholderTextColor={colors.textMuted}
              value={dateTime}
              onChange={setDateTime}
            />

            <Text style={styles.inputLabel}>WEBINAR DESCRIPTION</Text>
            <CustomTextInput
              inputContainerStyle={[styles.input, styles.textArea]}
              inputStyle={[styles.inputText, { textAlignVertical: 'top' }]}
              placeholder="Enter the Description"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChange={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>WEBINAR DURATION</Text>
            <CustomTextInput
              inputContainerStyle={styles.input}
              inputStyle={styles.inputText}
              placeholder="e.g. 60 mins"
              placeholderTextColor={colors.textMuted}
              value={duration}
              onChange={setDuration}
            />

            <Text style={styles.inputLabel}>TOTAL PARTICIPANTS</Text>
            <CustomTextInput
              inputContainerStyle={styles.input}
              inputStyle={styles.inputText}
              placeholder="e.g. 100"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={participants}
              onChange={setParticipants}
            />
          </View>

          {/* Pricing Model Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Pricing Model</Text>
            <Text style={styles.pricingSubtitle}>Set the value for your knowledge.</Text>

            <View style={styles.pricingPillRow}>
              <TouchableOpacity
                style={[styles.pricingPill, pricingModel === 'paid' && styles.pricingPillActive]}
                onPress={() => setPricingModel('paid')}
                activeOpacity={0.9}
              >
                <Coins size={16} color={pricingModel === 'paid' ? '#000000' : colors.white} />
                <Text style={[styles.pricingPillText, pricingModel === 'paid' ? styles.pricingPillTextActive : styles.pricingPillTextInactive]}>
                  Paid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pricingPill, pricingModel === 'free' && styles.pricingPillActive]}
                onPress={() => { setPricingModel('free'); setPrice('0'); }}
                activeOpacity={0.9}
              >
                <Gift size={16} color={pricingModel === 'free' ? '#000000' : colors.white} />
                <Text style={[styles.pricingPillText, pricingModel === 'free' ? styles.pricingPillTextActive : styles.pricingPillTextInactive]}>
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
                  placeholder="e.g. 999"
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
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#000000" />
              : <Text style={styles.primaryText}>Create Webinar</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateWebinar;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(16), paddingTop: hp(16), paddingBottom: hp(40) },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
  },
  cardHeaderTitle: { fontSize: fp(16), fontWeight: '700', color: colors.white, marginBottom: hp(4) },
  cardHeaderSubtitle: { fontSize: fp(11), color: colors.textSecondary, marginBottom: hp(14) },
  inputLabel: {
    fontSize: 9, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.6, marginBottom: hp(6), marginTop: hp(6),
  },
  input: {
    borderRadius: 10, paddingHorizontal: wp(12), height: hp(44),
    width: '100%', backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.border, marginBottom: hp(10),
  },
  inputText: { color: colors.white, fontSize: fp(14) },
  textArea: { height: hp(88) },
  pricingSubtitle: { fontSize: fp(11), color: colors.textSecondary, marginBottom: hp(12) },
  pricingPillRow: { flexDirection: 'row', gap: wp(10) },
  pricingPill: {
    flex: 1, height: hp(44), borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(8), backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.border,
  },
  pricingPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  pricingPillText: { fontSize: fp(13), fontWeight: '700' },
  pricingPillTextActive: { color: '#000000' },
  pricingPillTextInactive: { color: colors.white },
  actions: {
    flexDirection: 'row', gap: wp(10),
    paddingHorizontal: wp(16), paddingVertical: hp(14),
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  cancelBtn: {
    flex: 1, height: hp(44), borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cancelText: { color: colors.white, fontWeight: '600', fontSize: fp(14) },
  primaryBtn: {
    flex: 1.5, backgroundColor: colors.gold,
    height: hp(44), borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#000000', fontWeight: '700', fontSize: fp(14) },
});