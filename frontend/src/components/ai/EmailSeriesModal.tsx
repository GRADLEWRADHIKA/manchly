import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, Copy } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Email = { subject: string; body: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  scheduledAt?: string;
  joinUrl?: string;
};

const TABS = [
  { key: 'confirmation', label: 'Confirmation' },
  { key: 'reminder_24hr', label: '24hr Reminder' },
  { key: 'reminder_6hr', label: '6hr Reminder' },
  { key: 'post_webinar', label: 'Post-Webinar' },
];

const EmailSeriesModal: React.FC<Props> = ({
  visible, onClose, title, scheduledAt, joinUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<Record<string, Email> | null>(null);
  const [activeTab, setActiveTab] = useState('confirmation');

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/webinar/email-series', {
        title,
        ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
        ...(joinUrl ? { join_url: joinUrl } : {}),
      });
      setEmails(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate emails', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = () => {
    const email = emails?.[activeTab];
    if (email) {
      Clipboard.setString(`Subject: ${email.subject}\n\n${email.body}`);
      Toast.show({ type: 'success', text1: 'Email copied!', position: 'bottom' });
    }
  };

  const handleClose = () => { setEmails(null); setActiveTab('confirmation'); onClose(); };
  const current = emails?.[activeTab];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Email Series</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!emails ? (
          <View style={styles.center}>
            <Text style={styles.subtitle}>Generate 4 emails for your webinar</Text>
            <AiButton label="Generate Emails" onPress={generate} loading={loading} />
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {current && (
                <View style={styles.emailCard}>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectLabel}>Subject:</Text>
                    <Text style={styles.subjectText}>{current.subject}</Text>
                  </View>
                  <Text style={styles.body}>{current.body}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={copyEmail}>
                    <Copy size={wp(14)} color={colors.white} />
                    <Text style={styles.copyText}>Copy Email</Text>
                  </TouchableOpacity>
                </View>
              )}
              <AiButton label="Regenerate" onPress={generate} loading={loading} />
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

export default EmailSeriesModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  tabBar: { flexGrow: 0, backgroundColor: colors.white, paddingHorizontal: wp(12), paddingVertical: hp(8) },
  tab: {
    paddingHorizontal: wp(14), paddingVertical: hp(8), borderRadius: wp(20),
    backgroundColor: colors.surface, marginRight: wp(8), borderWidth: 1, borderColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fp(12), fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  emailCard: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(16),
    marginBottom: hp(16), borderWidth: 1, borderColor: colors.borderLight,
  },
  subjectRow: { marginBottom: hp(12) },
  subjectLabel: { fontSize: fp(11), fontWeight: '600', color: colors.textMuted, marginBottom: hp(2) },
  subjectText: { fontSize: fp(15), fontWeight: '700', color: colors.text },
  body: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22) },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(6), alignSelf: 'flex-end',
    backgroundColor: colors.primary, paddingHorizontal: wp(14), paddingVertical: hp(8),
    borderRadius: wp(8), marginTop: hp(14),
  },
  copyText: { fontSize: fp(12), fontWeight: '600', color: colors.white },
});
