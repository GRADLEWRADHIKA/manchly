import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Star, User2, Phone, Video } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { rateSession } from '../../../../store/SessionSlice';

const SessionRatingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();

  const { sessionId, expertName, expertImage, mode, duration } = route.params || {};

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitting(true);
    dispatch(rateSession({ session_id: sessionId, rating, feedback: feedback.trim() || undefined }))
      .unwrap()
      .then(() => {
        navigation.navigate('UserBottomTab', { screen: 'UserSessions' });
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  const handleSkip = () => {
    navigation.navigate('UserBottomTab', { screen: 'UserSessions' });
  };

  const isVideo = mode === 'video' || mode === 'VIDEO';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Call Ended Header */}
        <View style={styles.endedBadge}>
          {isVideo ? (
            <Video size={wp(16)} color={colors.secPrimary} strokeWidth={2} />
          ) : (
            <Phone size={wp(16)} color={colors.secPrimary} strokeWidth={2} />
          )}
          <Text style={styles.endedText}>Session Ended</Text>
        </View>

        {/* Expert Avatar */}
        <View style={styles.avatarWrap}>
          {expertImage ? (
            <Image source={{ uri: expertImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User2 size={wp(32)} color={colors.secPrimary} />
            </View>
          )}
        </View>

        <Text style={styles.expertName}>{expertName || 'Expert'}</Text>
        {duration > 0 && (
          <Text style={styles.durationText}>{duration} min session</Text>
        )}

        {/* Rating Stars */}
        <Text style={styles.rateLabel}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
              <Star
                size={wp(36)}
                color={i <= rating ? colors.golden : colors.borderLight}
                fill={i <= rating ? colors.golden : 'transparent'}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </Text>

        {/* Feedback */}
        <TextInput
          style={styles.feedbackInput}
          placeholder="Share your feedback (optional)"
          placeholderTextColor={colors.textMuted}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SessionRatingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(24),
  },
  endedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.secPrimary + '10',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    marginBottom: hp(24),
  },
  endedText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.secPrimary,
  },
  avatarWrap: {
    marginBottom: hp(12),
  },
  avatar: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    borderWidth: 3,
    borderColor: colors.secPrimary + '30',
  },
  avatarPlaceholder: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertName: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
  },
  durationText: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(4),
  },
  rateLabel: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.text,
    marginTop: hp(28),
    marginBottom: hp(14),
  },
  starsRow: {
    flexDirection: 'row',
    gap: wp(8),
  },
  ratingLabel: {
    fontSize: fp(13),
    color: colors.secPrimary,
    fontWeight: '600',
    marginTop: hp(10),
    height: hp(20),
  },
  feedbackInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(14),
    fontSize: fp(14),
    color: colors.text,
    marginTop: hp(20),
    minHeight: hp(80),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: colors.secPrimary,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    marginTop: hp(20),
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
  skipBtn: {
    paddingVertical: hp(14),
    marginTop: hp(4),
  },
  skipBtnText: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.textMuted,
  },
});
