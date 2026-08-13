import React, { useRef, useState, useEffect } from 'react';
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
  Pressable,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, UserPlus } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

// Warm-gold creator palette (matches Products screens / CourseCard)
const SHEET_BG = '#1C1B1B';
const GOLD = colors.gold; // #F0C040
const ACCENT = '#D5C4AB';
const INPUT_BG = '#242220';
const INPUT_BORDER = 'rgba(240,192,64,0.25)';
const HANDLE = 'rgba(213,196,171,0.45)';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

type Props = {
  visible: boolean;
  onClose: () => void;
  productTitle: string;
  productType: 'course' | 'webinar';
  /**
   * Grant access to the resolved user. Receives a phone OR an email.
   * Should resolve on success and reject on failure (e.g. dispatch(...).unwrap()).
   */
  onGrant: (identifier: { phone?: string; email?: string }) => Promise<any>;
};

const AddUserModal: React.FC<Props> = ({
  visible,
  onClose,
  productTitle,
  productType,
  onGrant,
}) => {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const trimmed = value.trim();
  const isEmail = EMAIL_RE.test(trimmed);
  const isPhone = PHONE_RE.test(trimmed);
  const isValid = isEmail || isPhone;

  // Keep the latest callbacks/flags for the (memoized) PanResponder.
  const cbRef = useRef({ onClose, submitting });
  cbRef.current = { onClose, submitting };

  // Reset the sheet position each time it opens.
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const finishClose = () => {
    Keyboard.dismiss();
    setValue('');
    translateY.setValue(0);
    onClose();
  };

  const requestClose = () => {
    if (submitting) return;
    finishClose();
  };

  const handleGrant = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onGrant(isEmail ? { email: trimmed } : { phone: trimmed });
      finishClose();
    } catch {
      // Error toast is handled by the caller's thunk; keep the sheet open.
    } finally {
      setSubmitting(false);
    }
  };

  // Swipe-down-to-dismiss on the grab handle.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (cbRef.current.submitting) {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          return;
        }
        if (g.dy > 110 || g.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: hp(500),
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            Keyboard.dismiss();
            setValue('');
            translateY.setValue(0);
            cbRef.current.onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={requestClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={requestClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + hp(20),
              transform: [{ translateY }],
            },
          ]}>
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <UserPlus size={wp(18)} color={GOLD} />
              <Text style={styles.title}>Add User</Text>
            </View>
            <TouchableOpacity
              onPress={requestClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={wp(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Grant access to{' '}
            <Text style={styles.subtitleStrong}>{productTitle}</Text> without a
            payment. The user is notified once added.
          </Text>

          <Text style={styles.label}>User's phone or email</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number or email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={setValue}
            editable={!submitting}
          />
          <Text style={styles.hint}>
            The user must already have a Manchly account with this phone or
            email.
          </Text>

          <TouchableOpacity
            style={[styles.grantBtn, !isValid && styles.grantBtnDisabled]}
            onPress={handleGrant}
            disabled={!isValid || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.grantBtnText}>
                Grant {productType === 'course' ? 'course' : 'webinar'} access
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddUserModal;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: wp(22),
    paddingTop: hp(8),
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: hp(8),
    marginBottom: hp(4),
  },
  handle: {
    width: wp(44),
    height: hp(4),
    borderRadius: wp(3),
    backgroundColor: HANDLE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
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
    marginBottom: hp(18),
  },
  subtitleStrong: {
    color: ACCENT,
    fontWeight: '700',
  },
  label: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    fontSize: fp(15),
    color: colors.white,
  },
  hint: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(8),
    marginBottom: hp(20),
  },
  grantBtn: {
    backgroundColor: GOLD,
    borderRadius: wp(12),
    paddingVertical: hp(15),
    alignItems: 'center',
  },
  grantBtnDisabled: {
    opacity: 0.4,
  },
  grantBtnText: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.bg,
  },
});
