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
import { X, UserPlus } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
  productTitle: string;
  productType: 'course' | 'webinar';
  /** Should resolve on success and reject on failure (e.g. dispatch(...).unwrap()). */
  onGrant: (phone: string) => Promise<any>;
};

const AddUserModal: React.FC<Props> = ({
  visible,
  onClose,
  productTitle,
  productType,
  onGrant,
}) => {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = /^\d{10}$/.test(phone.trim());

  const close = () => {
    if (submitting) return;
    setPhone('');
    onClose();
  };

  const handleGrant = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onGrant(phone.trim());
      setPhone('');
      onClose();
    } catch {
      // Error toast is handled by the caller's thunk; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <UserPlus size={wp(18)} color={colors.gold} />
              <Text style={styles.title}>Add User</Text>
            </View>
            <TouchableOpacity
              onPress={close}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={wp(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Grant access to{' '}
            <Text style={styles.subtitleStrong}>{productTitle}</Text> without a
            payment. The user is notified once added.
          </Text>

          <Text style={styles.label}>User's phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))}
            editable={!submitting}
          />
          <Text style={styles.hint}>
            The user must already have a Manchly account with this number.
          </Text>

          <TouchableOpacity
            style={[styles.grantBtn, !isValid && styles.grantBtnDisabled]}
            onPress={handleGrant}
            disabled={!isValid || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.grantBtnText}>
                Grant {productType === 'course' ? 'course' : 'webinar'} access
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddUserModal;

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
    paddingVertical: hp(12),
    fontSize: fp(15),
    color: colors.white,
    letterSpacing: 1,
  },
  hint: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(8),
    marginBottom: hp(20),
  },
  grantBtn: {
    backgroundColor: colors.cAccentLight,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: 'center',
  },
  grantBtnDisabled: {
    opacity: 0.4,
  },
  grantBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
});
