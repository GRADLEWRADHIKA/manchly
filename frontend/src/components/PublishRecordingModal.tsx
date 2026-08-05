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
  ScrollView,
} from 'react-native';
import { X, Film, Users } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
  webinarTitle: string;
  /** Resolve on success, reject on failure (e.g. dispatch(...).unwrap()). */
  onPublish: (args: {
    recording_url: string;
    title?: string;
    price?: number;
    auto_enroll: boolean;
  }) => Promise<any>;
};

const PublishRecordingModal: React.FC<Props> = ({
  visible,
  onClose,
  webinarTitle,
  onPublish,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [autoEnroll, setAutoEnroll] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isValid = /^https?:\/\/\S+$/.test(url.trim());

  const reset = () => {
    setUrl('');
    setTitle('');
    setPrice('');
    setAutoEnroll(true);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handlePublish = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onPublish({
        recording_url: url.trim(),
        title: title.trim() || undefined,
        price: price ? Number(price) : 0,
        auto_enroll: autoEnroll,
      });
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
            <View style={styles.titleRow}>
              <Film size={wp(18)} color={colors.gold} />
              <Text style={styles.title}>Publish recording</Text>
            </View>
            <TouchableOpacity
              onPress={close}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={wp(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Turn the recording of{' '}
              <Text style={styles.subtitleStrong}>{webinarTitle}</Text> into a
              course.
            </Text>

            <Text style={styles.label}>Recording URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
              value={url}
              onChangeText={setUrl}
              editable={!submitting}
            />
            <Text style={styles.hint}>
              A direct link the video host can fetch (e.g. a Zoom recording
              download URL, or a re-hosted file).
            </Text>

            <Text style={[styles.label, { marginTop: hp(14) }]}>
              Course title (optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`${webinarTitle} (Recording)`}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!submitting}
            />

            <Text style={[styles.label, { marginTop: hp(14) }]}>
              Price (₹, optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0 (free)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={price}
              onChangeText={t => setPrice(t.replace(/[^0-9]/g, ''))}
              editable={!submitting}
            />

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setAutoEnroll(v => !v)}
              activeOpacity={0.8}>
              <View style={styles.toggleLeft}>
                <Users size={wp(16)} color={colors.gold} />
                <Text style={styles.toggleText}>
                  Give all registrants access
                </Text>
              </View>
              <View style={[styles.switch, autoEnroll && styles.switchOn]}>
                <View
                  style={[styles.knob, autoEnroll && styles.knobOn]}
                />
              </View>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.publishBtn, !isValid && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={!isValid || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.publishBtnText}>Publish as course</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PublishRecordingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(24),
  },
  card: {
    backgroundColor: colors.cCard,
    borderRadius: wp(18),
    padding: wp(20),
    borderWidth: 1,
    borderColor: colors.cBorder,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(10),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: fp(13),
    color: colors.textMuted,
    lineHeight: fp(19),
    marginBottom: hp(16),
  },
  subtitleStrong: {
    color: colors.white,
    fontWeight: '600',
  },
  label: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },
  input: {
    backgroundColor: colors.cBg,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(14),
    paddingVertical: hp(11),
    fontSize: fp(14),
    color: colors.white,
  },
  hint: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(6),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(18),
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    flex: 1,
  },
  toggleText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
  },
  switch: {
    width: wp(44),
    height: hp(26),
    borderRadius: wp(13),
    backgroundColor: colors.cBg,
    borderWidth: 1,
    borderColor: colors.cBorder,
    justifyContent: 'center',
    paddingHorizontal: wp(3),
  },
  switchOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  knob: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: colors.textMuted,
    alignSelf: 'flex-start',
  },
  knobOn: {
    backgroundColor: colors.cBg,
    alignSelf: 'flex-end',
  },
  publishBtn: {
    backgroundColor: colors.cAccentLight,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: 'center',
    marginTop: hp(18),
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
});
