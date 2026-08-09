import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
  webinarTitle: string;
  /** Resolve on success, reject on failure (e.g. dispatch(...).unwrap()). */
  onSubmit: (rating: number, comment: string) => Promise<any>;
};

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const RateWebinarModal: React.FC<Props> = ({
  visible,
  onClose,
  webinarTitle,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setComment('');
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      reset();
      onClose();
    } catch {
      // Error toast handled by the caller's thunk; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate this webinar</Text>
            <TouchableOpacity
              onPress={close}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={wp(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>
            {webinarTitle}
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                activeOpacity={0.7}>
                <Star
                  size={wp(34)}
                  color={i <= rating ? colors.golden : colors.borderLight}
                  fill={i <= rating ? colors.golden : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap to rate' : LABELS[rating]}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Share your feedback (optional)"
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!submitting}
          />

          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RateWebinarModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(24),
  },
  card: {
    backgroundColor: colors.uCard,
    borderRadius: wp(18),
    padding: wp(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: fp(13),
    color: colors.uSubHeading,
    marginTop: hp(4),
    marginBottom: hp(18),
  },
  starsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: wp(8),
  },
  ratingLabel: {
    fontSize: fp(13),
    color: colors.uSubHeading,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: hp(10),
    height: hp(20),
  },
  input: {
    backgroundColor: colors.uBg,
    borderRadius: wp(12),
    padding: wp(14),
    fontSize: fp(14),
    color: colors.white,
    marginTop: hp(16),
    minHeight: hp(80),
  },
  submitBtn: {
    backgroundColor: colors.secPrimary,
    borderRadius: wp(12),
    paddingVertical: hp(15),
    alignItems: 'center',
    marginTop: hp(18),
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
});
