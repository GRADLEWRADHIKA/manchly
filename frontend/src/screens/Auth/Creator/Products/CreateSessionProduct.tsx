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
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Video, Clock, IndianRupee} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {createSessionProduct} from '../../../../store/SessionSlice';
import AiButton from '../../../../components/AiButton';
import ProductSuggestionsModal from '../../../../components/ai/ProductSuggestionsModal';

const CreateSessionProduct: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const prefill = route.params?.prefill;
  const {expertProfile} = useSelector((state: any) => state.sessionReducer);

  const [title, setTitle] = useState(prefill?.title || '');
  const [description, setDescription] = useState(prefill?.blurb || '');
  const [duration, setDuration] = useState(prefill?.duration_min ? String(prefill.duration_min) : '');
  const [price, setPrice] = useState(prefill?.suggested_price_inr ? String(prefill.suggested_price_inr) : '');
  const mode = 'video';
  const [loading, setLoading] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const handleCreate = () => {
    if (!title.trim() || !duration || !price) {
      Toast.show({type: 'error', text1: 'Please fill all required fields', position: 'bottom'});
      return;
    }

    setLoading(true);
    dispatch(
      createSessionProduct({
        title: title.trim(),
        description: description.trim() || undefined,
        duration: parseInt(duration),
        price: parseFloat(price),
        mode,
      }),
    )
      .unwrap()
      .then(() => {
        Toast.show({type: 'success', text1: 'Session product created!', position: 'bottom'});
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Create Session" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AiButton
          label="Suggest Products"
          onPress={() => setShowProductSuggestions(true)}
          style={{alignSelf: 'flex-start', marginBottom: hp(8)}}
        />

        {/* Title */}
        <Text style={styles.label}>Session Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Strategy Session, Quick Audit"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What will you cover in this session?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Mode */}
        <Text style={styles.label}>Call Mode</Text>
        <View style={[styles.modeBtn, styles.modeBtnActiveGreen]}>
          <Video size={wp(20)} color={colors.white} strokeWidth={1.8} />
          <Text style={[styles.modeBtnText, styles.modeBtnTextActive]}>
            Video Call
          </Text>
        </View>

        {/* Duration */}
        <Text style={styles.label}>Duration (minutes) *</Text>
        <View style={styles.inputRow}>
          <Clock size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 30"
            placeholderTextColor={colors.textMuted}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </View>

        {/* Quick Duration Chips */}
        <View style={styles.chipRow}>
          {[15, 30, 45, 60].map(d => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                duration === String(d) && styles.chipActive,
              ]}
              onPress={() => setDuration(String(d))}>
              <Text
                style={[
                  styles.chipText,
                  duration === String(d) && styles.chipTextActive,
                ]}>
                {d} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <Text style={styles.label}>Price (₹) *</Text>
        <View style={styles.inputRow}>
          <IndianRupee size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={styles.inputInner}
            placeholder="e.g. 499"
            placeholderTextColor={colors.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        {/* Quick Price Chips */}
        <View style={styles.chipRow}>
          {[199, 499, 999, 1999].map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.chip,
                price === String(p) && styles.chipActive,
              ]}
              onPress={() => setPrice(String(p))}>
              <Text
                style={[
                  styles.chipText,
                  price === String(p) && styles.chipTextActive,
                ]}>
                ₹{p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {duration && price ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate per minute</Text>
              <Text style={styles.summaryValue}>
                ₹{(parseFloat(price) / parseInt(duration)).toFixed(1)}/min
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{duration} min</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Price</Text>
              <Text style={[styles.summaryValue, {color: colors.info, fontWeight: '800'}]}>
                ₹{price}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, loading && {opacity: 0.6}]}
          activeOpacity={0.8}
          onPress={handleCreate}
          disabled={loading}>
          <Text style={styles.createBtnText}>
            {loading ? 'Creating...' : 'Create Session Product'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ProductSuggestionsModal
        visible={showProductSuggestions}
        onClose={() => setShowProductSuggestions(false)}
        expertHeadline={expertProfile?.profession || ''}
        expertBio={expertProfile?.bio}
        category={expertProfile?.categories?.[0] || ''}
        onSelect={(product: any) => {
          setShowProductSuggestions(false);
          setTitle(product.title || '');
          setDescription(product.blurb || '');
          setDuration(product.duration_min ? String(product.duration_min) : '');
          setPrice(product.suggested_price_inr ? String(product.suggested_price_inr) : '');
        }}
      />
    </View>
  );
};

export default memo(CreateSessionProduct);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(40),
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
  textArea: {
    minHeight: hp(80),
    paddingTop: hp(12),
  },
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
  inputInner: {
    flex: 1,
    fontSize: fp(14),
    color: colors.text,
    marginLeft: wp(8),
    paddingVertical: Platform.OS === 'ios' ? 0 : hp(12),
  },
  modeRow: {
    flexDirection: 'row',
    gap: wp(12),
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    paddingVertical: hp(14),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  modeBtnActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  modeBtnActiveGreen: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  modeBtnText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  modeBtnTextActive: {
    color: colors.white,
  },
  chipRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginTop: hp(8),
  },
  chip: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: wp(10),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  chipText: {
    fontSize: fp(12),
    fontWeight: '500',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(16),
    marginTop: hp(20),
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  summaryTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(10),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(6),
  },
  summaryLabel: {
    fontSize: fp(13),
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
  },
  createBtn: {
    backgroundColor: colors.info,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(24),
  },
  createBtnText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
});
