import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  variant?: 'light' | 'dark';
};

const SALMON = '#F5A9A0';
const SALMON_DARK_TEXT = '#7A2E24';
const ICON_BG = '#3A2426';

const LogoutModal: React.FC<Props> = ({ visible, onCancel, onConfirm, variant = 'light' }) => {
  const isDark = variant === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.iconWrap}>
            <LogOut size={wp(24)} color={SALMON} strokeWidth={2} />
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>Log Out</Text>
          <Text style={[styles.message, isDark && styles.messageDark]}>
            Are you sure you want to log out of Munchly?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.danger]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, isDark ? styles.cancelDark : styles.cancel]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, isDark ? styles.cancelTextDark : styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(24),
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: wp(20),
    backgroundColor: colors.surface,
    padding: wp(22),
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.3,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  cardDark: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  title: {
    fontSize: fp(18),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(8),
    textAlign: 'center',
  },
  titleDark: {
    color: colors.textPrimary,
  },
  message: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginBottom: hp(22),
    textAlign: 'center',
    lineHeight: fp(20),
  },
  messageDark: {
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'column',
    width: '100%',
    gap: hp(12),
  },
  btn: {
    width: '100%',
    paddingVertical: hp(15),
    paddingHorizontal: wp(14),
    borderRadius: wp(12),
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: colors.inputBg,
    borderWidth: wp(1),
    borderColor: colors.border,
  },
  cancelDark: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textPrimary,
  },
  cancelTextDark: {
    color: colors.textPrimary,
  },
  danger: {
    backgroundColor: SALMON,
  },
  dangerText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: SALMON_DARK_TEXT,
  },
  btnText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.white,
  },
});