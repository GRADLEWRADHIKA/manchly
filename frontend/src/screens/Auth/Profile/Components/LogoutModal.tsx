import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const LogoutModal: React.FC<Props> = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Logout</Text>
          <Text style={styles.message}>Are you sure you want to logout?</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancel]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.danger]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Logout</Text>
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
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(24),
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: wp(16),
    backgroundColor: colors.surface,
    padding: wp(18),
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.text,
    marginBottom: hp(6),
  },
  message: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginBottom: hp(16),
  },
  actions: {
    flexDirection: 'row',
    gap: wp(90),
  },
  btn: {
    minWidth: wp(96),
    paddingVertical: hp(12),
    paddingHorizontal: wp(14),
    borderRadius: wp(10),
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: colors.white,
    borderWidth: wp(1),
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
  },
  danger: {
    backgroundColor: colors.error,
  },
  btnText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
});
