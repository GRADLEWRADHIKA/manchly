import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Lock, Sparkles, X, Check} from 'lucide-react-native';
import {useDispatch} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import colors from '../utils/colors';
import {fp, hp, wp} from '../utils/responsive';
import {createSubscriptionCheckout, verifySubscription, setPremiumStatus} from '../store/UserSlice';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  title?: string;
  description?: string;
};

const BENEFITS = [
  'Unlimited creator profile views',
  'Contact creators with 10K+ followers',
  'Priority marketplace access',
  'Advanced analytics & insights',
];

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  title = 'Free profile view limit reached',
  description = 'You have used your 5 free creator profile views. Upgrade to Premium to unlock unlimited profile insights and high-value creator contact actions.',
}) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (onUpgrade) {
      // If caller provided a custom handler, use that
      onUpgrade();
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(createSubscriptionCheckout({plan: 'premium'})).unwrap();
      const checkoutData = result?.data;

      if (checkoutData?.payment_session_id || checkoutData?.order_id) {
        // If Cashfree returns a session, verify after user completes payment
        // For now, auto-verify for the flow
        const verifyPayload: any = {};
        if (checkoutData.order_id) verifyPayload.order_id = checkoutData.order_id;
        if (checkoutData.payment_session_id) verifyPayload.payment_session_id = checkoutData.payment_session_id;

        await dispatch(verifySubscription(verifyPayload)).unwrap();
        dispatch(setPremiumStatus(true));
        onClose();
      } else {
        Toast.show({type: 'error', text1: 'Unable to start checkout'});
      }
    } catch {
      // Error already shown via thunk toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close paywall">
            <X size={wp(18)} color="#A1A1AA" />
          </TouchableOpacity>

          <View style={styles.iconRing}>
            <Lock size={wp(28)} color={colors.white} />
          </View>

          <Text style={styles.eyebrow}>Premium Access</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.benefitsList}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Check size={wp(14)} color="#FACC15" />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.limitPill}>
            <Sparkles size={wp(15)} color="#FACC15" />
            <Text style={styles.limitText}>5 free profile views included</Text>
          </View>

          <TouchableOpacity
            style={[styles.upgradeButton, loading && {opacity: 0.7}]}
            activeOpacity={0.88}
            onPress={handleUpgrade}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#09090B" />
            ) : (
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
            )}
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
    shadowOffset: {width: 0, height: 16},
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
  benefitsList: {
    marginTop: hp(16),
    gap: hp(8),
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  benefitText: {
    color: '#D4D4D8',
    fontSize: fp(13),
    fontWeight: '500',
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
    marginTop: hp(16),
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
    marginTop: hp(20),
  },
  upgradeText: {
    color: '#09090B',
    fontSize: fp(15),
    fontWeight: '900',
  },
});
