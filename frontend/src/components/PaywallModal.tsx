import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Lock, Sparkles, X } from 'lucide-react-native';
import colors from '../utils/colors';
import { fp, hp, wp } from '../utils/responsive';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  title?: string;
  description?: string;
};

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  title = 'Free profile view limit reached',
  description = 'You have used your 5 free creator profile views. Upgrade to Premium to unlock unlimited profile insights and high-value creator contact actions.',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close paywall"
          >
            <X size={wp(18)} color="#A1A1AA" />
          </TouchableOpacity>

          <View style={styles.iconRing}>
            <Lock size={wp(28)} color={colors.white} />
          </View>

          <Text style={styles.eyebrow}>Premium Access</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.limitPill}>
            <Sparkles size={wp(15)} color="#FACC15" />
            <Text style={styles.limitText}>5 free profile views included</Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            activeOpacity={0.88}
            onPress={onUpgrade}
          >
            <Text style={styles.upgradeText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PaywallModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(18),
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  card: {
    width: '100%',
    borderRadius: wp(22),
    paddingHorizontal: wp(22),
    paddingTop: hp(30),
    paddingBottom: hp(24),
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: hp(12),
    right: wp(12),
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
  },
  iconRing: {
    width: wp(62),
    height: wp(62),
    borderRadius: wp(31),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: hp(18),
  },
  eyebrow: {
    color: '#A1A1AA',
    textAlign: 'center',
    fontSize: fp(12),
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: hp(8),
  },
  title: {
    color: colors.white,
    textAlign: 'center',
    fontSize: fp(22),
    fontWeight: '900',
    lineHeight: fp(28),
  },
  description: {
    color: '#D4D4D8',
    textAlign: 'center',
    fontSize: fp(13),
    lineHeight: fp(20),
    marginTop: hp(12),
  },
  limitPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(7),
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: wp(999),
    backgroundColor: '#18181B',
    marginTop: hp(20),
    borderWidth: 1,
    borderColor: '#27272A',
  },
  limitText: {
    color: '#E4E4E7',
    fontSize: fp(12),
    fontWeight: '700',
  },
  upgradeButton: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    marginTop: hp(24),
  },
  upgradeText: {
    color: '#09090B',
    fontSize: fp(15),
    fontWeight: '900',
  },
});
