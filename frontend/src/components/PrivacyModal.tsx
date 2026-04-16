import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.company}>Agnivora Digital Pvt Ltd</Text>
          <Text style={styles.subInfo}>Platform: Manchly (App only, India)</Text>
          <Text style={styles.subInfo}>Contact: help@manchly.com</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.body}>
            Agnivora Digital respects your privacy and is committed to protecting personal data collected via the Manchly app ("Platform"). This Privacy Policy explains what data we collect, how we use it, and your rights under Indian laws.
          </Text>

          <Text style={styles.sectionTitle}>2. Data We Collect</Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Personal Information:</Text> Name, email, phone number, account credentials.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Payment Information:</Text> Details processed securely via Cashfree (we do not store full card details).
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Usage Data:</Text> Device info, app activity, analytics, cookies.
          </Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
          <Text style={styles.body}>
            - To provide and improve the Platform.{'\n'}- To process payments and manage refunds.{'\n'}- To communicate updates, offers, and support.{'\n'}- To ensure security and prevent misuse.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.body}>
            We may share data with:{'\n'}- Payment processors (Cashfree) for transaction processing.{'\n'}- Analytics providers for performance insights.{'\n'}- Legal authorities if required by Indian law.
          </Text>
          <Text style={styles.body}>
            We do not sell or rent your personal information to third parties.
          </Text>

          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.body}>
            Data is retained only as long as necessary for platform operations, legal compliance, and transaction purposes.
          </Text>

          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.body}>
            We implement reasonable technical and organizational measures to protect your data from unauthorized access, disclosure, or alteration.
          </Text>

          <Text style={styles.sectionTitle}>7. User Rights</Text>
          <Text style={styles.body}>
            - Access, correct, or delete your personal data.{'\n'}- Withdraw consent for non-essential processing.{'\n'}- Report concerns via help@manchly.com.
          </Text>

          <Text style={styles.sectionTitle}>8. Cookies and Tracking</Text>
          <Text style={styles.body}>
            We use cookies and similar technologies to enhance app performance and understand user behavior. Users may disable cookies via device settings, though some features may not function properly.
          </Text>

          <Text style={styles.sectionTitle}>9. Third-Party Links</Text>
          <Text style={styles.body}>
            The Platform may include links to third-party services. Agnivora Digital is not responsible for the privacy practices of these external sites.
          </Text>

          <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
          <Text style={styles.body}>
            The Platform is not intended for children under 18. We do not knowingly collect personal data from minors.
          </Text>

          <Text style={styles.sectionTitle}>11. Changes to Privacy Policy</Text>
          <Text style={styles.body}>
            We may update this Policy periodically. Users will be notified in-app. Continued use constitutes acceptance of changes.
          </Text>

          <Text style={styles.sectionTitle}>12. Governing Law & Jurisdiction</Text>
          <Text style={styles.body}>
            This Policy is governed by the laws of India. Disputes fall under the exclusive jurisdiction of courts in Madhepura, Bihar, India.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default PrivacyModal;

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
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
});
