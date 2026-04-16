import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import React, { useState } from 'react';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import { X, Mail, Phone } from 'lucide-react-native';
import RefundPolicyModal from './RefundPolicyModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ContactUsModal: React.FC<Props> = ({ visible, onClose }) => {
  const [showRefund, setShowRefund] = useState(false);

  const handleEmail = () => {
    Linking.openURL('mailto:support@manchly.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+916363790659');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Contact Us</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>
            We're here to help. Reach out to the Manchly support team and we'll
            get back to you shortly.
          </Text>

          {/* Email Support */}
          <TouchableOpacity style={styles.card} onPress={handleEmail} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Mail size={wp(24)} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardValue}>help@manchly.com</Text>
            <Text style={styles.cardNote}>
              We respond within 24-48 business hours
            </Text>
          </TouchableOpacity>

          {/* Phone Support */}
          <TouchableOpacity style={styles.card} onPress={handlePhone} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Phone size={wp(24)} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Phone Support</Text>
            <Text style={styles.cardValue}>+91 63637 90659</Text>
            <Text style={styles.cardNote}>
              Mon - Sat, 10:00 AM - 6:00 PM IST
            </Text>
          </TouchableOpacity>

          {/* Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              For refund requests, please include your Order ID and payment
              proof. Requests must be raised within 48 hours of purchase. See
              our{' '}
              <Text
                style={styles.noteLink}
                onPress={() => setShowRefund(true)}>
                Refund Policy
              </Text>{' '}
              for details.
            </Text>
          </View>
        </ScrollView>
      </View>

      <RefundPolicyModal
        visible={showRefund}
        onClose={() => setShowRefund(false)}
      />
    </Modal>
  );
};

export default ContactUsModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: wp(16),
    paddingBottom: hp(40),
  },
  subtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    lineHeight: fp(21),
    marginBottom: hp(24),
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: wp(16),
    padding: wp(20),
    alignItems: 'center',
    marginBottom: hp(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
  },
  iconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  cardTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(4),
  },
  cardValue: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.primary,
    marginBottom: hp(6),
  },
  cardNote: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },
  noteBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: wp(12),
    padding: wp(16),
    marginTop: hp(8),
  },
  noteText: {
    fontSize: fp(13),
    color: '#92400E',
    lineHeight: fp(20),
  },
  noteLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
