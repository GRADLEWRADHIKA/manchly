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

// Kept exactly as-is per instruction — do not change the logout button's color
const SALMON = '#F5A9A0';
const SALMON_DARK_TEXT = '#7A2E24';

const LogoutModal: React.FC<Props> = ({ visible, onCancel, onConfirm, variant = 'light' }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <LogOut size={wp(24)} color={SALMON} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Log Out</Text>
          <Text style={styles.message}>
            Are you sure you want to log out of Manchly?
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
              style={[styles.btn, styles.cancel]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(24),
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: wp(20),
    backgroundColor: '#141414',
    padding: wp(22),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
    }),
  },
  iconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontSize: fp(18),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
    textAlign: 'center',
  },
  message: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
    marginBottom: hp(22),
    textAlign: 'center',
    lineHeight: fp(20),
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cancelText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.white,
  },
  danger: {
    backgroundColor: SALMON,
  },
  dangerText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: SALMON_DARK_TEXT,
  },
});