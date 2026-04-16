import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const RefundPolicyModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Refund Policy</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.company}>Agnivora Digital Pvt Ltd</Text>
          <Text style={styles.subInfo}>Platform: Manchly (App only, India)</Text>
          <Text style={styles.subInfo}>Contact: help@manchly.com</Text>

          <Text style={styles.body}>
            At Agnivora Digital Private Limited, we strive to deliver high-quality digital products, courses, and services. Please read our refund policy carefully before making a purchase.
          </Text>

          <Text style={styles.sectionTitle}>1. General Policy</Text>
          <Text style={styles.body}>
            All purchases made on our platform are for digital products/services, including but not limited to:
          </Text>
          <Text style={styles.body}>
            - Online courses{'\n'}- Webinars{'\n'}- Digital content{'\n'}- Memberships/subscriptions
          </Text>
          <Text style={styles.body}>
            Due to the nature of digital delivery, all sales are final unless stated otherwise.
          </Text>

          <Text style={styles.sectionTitle}>2. Refund Eligibility</Text>
          <Text style={styles.body}>
            Refunds will only be considered under the following conditions:
          </Text>
          <Text style={styles.body}>
            - Duplicate payment made by the customer{'\n'}- Technical issue from our end preventing access to the product{'\n'}- Incorrect product purchased due to a system error
          </Text>
          <Text style={styles.body}>
            In such cases, you must raise a request within 48 hours of purchase.
          </Text>

          <Text style={styles.sectionTitle}>3. Non-Refundable Scenarios</Text>
          <Text style={styles.body}>
            Refunds will not be applicable in the following cases:
          </Text>
          <Text style={styles.body}>
            - Change of mind after purchase{'\n'}- Lack of usage or completion of course{'\n'}- Failure to understand the product before purchase{'\n'}- Partial consumption of digital content{'\n'}- Delay in joining live sessions/webinars
          </Text>
          <Text style={styles.body}>
            Once digital content is accessed, it is typically considered non-returnable under Indian consumer norms.
          </Text>

          <Text style={styles.sectionTitle}>4. Refund Process</Text>
          <Text style={styles.body}>
            To request a refund, email us at: help@manchly.com{'\n\n'}Include:{'\n'}- Order ID{'\n'}- Payment proof{'\n'}- Reason for refund
          </Text>
          <Text style={styles.body}>
            Once your request is received:{'\n'}- We will review it within 3-5 business days{'\n'}- If approved, refund will be processed within 7-10 business days to the original payment method
          </Text>

          <Text style={styles.sectionTitle}>5. Cancellation Policy</Text>
          <Text style={styles.body}>
            - Orders once placed cannot be cancelled after successful payment{'\n'}- Subscription-based services (if any) must be cancelled before the next billing cycle
          </Text>

          <Text style={styles.sectionTitle}>6. Chargebacks & Disputes</Text>
          <Text style={styles.body}>
            If a chargeback is initiated without contacting us:{'\n'}- Your account may be suspended permanently{'\n'}- Access to all products/services may be revoked
          </Text>

          <Text style={styles.sectionTitle}>7. Policy Updates</Text>
          <Text style={styles.body}>
            Agnivora Digital Private Limited reserves the right to modify this policy at any time and update terms without prior notice. Customers are advised to review this page periodically.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default RefundPolicyModal;

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
  company: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(4),
  },
  subInfo: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginTop: hp(20),
    marginBottom: hp(6),
  },
  body: {
    fontSize: fp(14),
    color: colors.textSecondary,
    lineHeight: fp(21),
    marginBottom: hp(8),
  },
});
