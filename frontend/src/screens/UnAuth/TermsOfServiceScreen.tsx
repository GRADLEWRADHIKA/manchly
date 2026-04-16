import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { ArrowLeft } from 'lucide-react-native';

const TermsOfServiceScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={wp(22)} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: wp(22) }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.company}>Agnivora Digital Pvt Ltd</Text>
        <Text style={styles.subInfo}>Platform: Manchly (App only, India)</Text>
        <Text style={styles.subInfo}>Contact: help@manchly.com</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using the Manchly app ("Platform"), you agree to comply with these Terms of Service ("Terms"). If you do not agree, do not use the Platform.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years old and a resident of India. By using the Platform, you represent and warrant that you meet these criteria.
        </Text>

        <Text style={styles.sectionTitle}>3. User Roles</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Creators:</Text> Upload, share, sell content, manage communities. Responsible for legal compliance of all content.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Learners/Customers:</Text> Access and purchase content. Agree not to redistribute content without permission.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Admins:</Text> Manage Platform operations.
        </Text>

        <Text style={styles.sectionTitle}>4. Account Registration</Text>
        <Text style={styles.body}>
          Users must provide accurate, complete, and up-to-date information. Account credentials are confidential; users are responsible for all activity under their accounts.
        </Text>

        <Text style={styles.sectionTitle}>5. Payments & Refunds</Text>
        <Text style={styles.body}>All payments are processed via Cashfree.</Text>
        <Text style={styles.bodyBold}>Price Breakup at Checkout</Text>
        <Text style={styles.body}>
          Final payable amount = Course Price + 18% GST + 5% Platform Fee
        </Text>
        <Text style={styles.bodyBold}>Refund Policy</Text>
        <Text style={styles.body}>
          All sales are final due to the nature of digital delivery. Refunds are only considered for duplicate payments, technical issues preventing access, or system errors. Requests must be raised within 48 hours at help@manchly.com.
        </Text>

        <Text style={styles.sectionTitle}>6. Creator Payouts, Withdrawals & TDS</Text>
        <Text style={styles.body}>
          Creators can request withdrawal of their available balance once every 48 hours. Withdrawal requests made before the 48-hour cooldown period will not be processed.
        </Text>
        <Text style={styles.body}>
          All payouts are subject to:{'\n'}- Platform verification and fraud checks{'\n'}- Payment gateway processing timelines{'\n'}- Applicable taxes and deductions
        </Text>
        <Text style={styles.body}>
          As per Government of India regulations:{'\n'}- 2% TDS will be deducted from creator payouts.{'\n'}- The final credited amount may vary due to tax, compliance, or settlement adjustments.
        </Text>

        <Text style={styles.sectionTitle}>7. Content Ownership</Text>
        <Text style={styles.body}>
          Users retain ownership of content they upload. By using the Platform, users grant Agnivora Digital a worldwide, royalty-free license to host, display, and distribute content for platform functionality.
        </Text>
        <Text style={styles.body}>
          The Manchly brand, trademarks, and IP remain the property of Agnivora Digital.
        </Text>

        <Text style={styles.sectionTitle}>8. Prohibited Activities</Text>
        <Text style={styles.body}>
          You agree not to:{'\n'}- Violate applicable laws or regulations.{'\n'}- Infringe intellectual property rights of others.{'\n'}- Upload harmful, offensive, or illegal content.{'\n'}- Attempt to interfere with the Platform's security or functionality.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.body}>
          Agnivora Digital may suspend or terminate accounts for violations, misuse, or inactivity. Users may terminate accounts at any time via in-app settings or support.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.body}>
          The Platform is provided "as-is." Agnivora Digital is not liable for indirect, incidental, or consequential damages arising from use of the Platform.
        </Text>

        <Text style={styles.sectionTitle}>11. Indemnification</Text>
        <Text style={styles.body}>
          You agree to indemnify Agnivora Digital, its affiliates, and employees against claims arising from your use of the Platform, breach of these Terms, or violation of laws.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law & Jurisdiction</Text>
        <Text style={styles.body}>
          These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Madhepura, Bihar, India.
        </Text>

        <Text style={styles.sectionTitle}>13. Modifications</Text>
        <Text style={styles.body}>
          Agnivora Digital reserves the right to update these Terms at any time. Users will be notified in-app, and continued use constitutes acceptance.
        </Text>
      </ScrollView>
    </View>
  );
};

export default TermsOfServiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(15),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: wp(4),
  },
  headerTitle: {
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
  bodyBold: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    marginTop: hp(6),
    marginBottom: hp(4),
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
});
