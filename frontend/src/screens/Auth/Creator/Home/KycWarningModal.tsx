import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

interface KycWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const KycWarningModal: React.FC<KycWarningModalProps> = ({
  visible,
  onDismiss,
}) => {
  const navigation = useNavigation<any>();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <ShieldAlert size={wp(36)} color="#F59E0B" />
          </View>
          <Text style={styles.modalTitle}>Complete Your KYC</Text>
          <Text style={styles.modalDesc}>
            Verify your identity to unlock all features — create courses, go
            live, offer sessions, and start earning.
          </Text>
          <TouchableOpacity
            style={styles.modalPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              onDismiss();
              navigation.navigate('KYCVerificationScreen');
            }}
          >
            <Text style={styles.modalPrimaryText}>Verify Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalCancelBtn}
            activeOpacity={0.7}
            onPress={onDismiss}
          >
            <Text style={styles.modalCancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default memo(KycWarningModal);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(24),
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: wp(20),
    padding: wp(24),
    alignItems: 'center',
    width: '100%',
  },
  modalIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  modalTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.primary,
    marginBottom: hp(8),
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(20),
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(12),
    paddingVertical: hp(12),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  modalPrimaryText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  modalCancelBtn: {
    paddingVertical: hp(8),
  },
  modalCancelText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textMuted,
  },
});
