import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { X, Copy, Send } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  sessionId?: string;
  learnerName?: string;
  productTitle?: string;
  actionItems?: string[];
};

const FollowUpModal: React.FC<Props> = ({
  visible, onClose, sessionId, learnerName, productTitle, actionItems,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [body, setBody] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const payload: any = { tone: 'warm' };
      if (sessionId) {
        payload.session_id = sessionId;
      } else {
        if (learnerName) payload.learner_name = learnerName;
        if (productTitle) payload.product_title = productTitle;
        if (actionItems?.length) payload.action_items = actionItems;
      }
      const data = await aiCall('/ai/session/follow-up-message', payload);
      setResult(data);
      setBody(data.body || '');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate follow-up', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = `Subject: ${result?.subject || ''}\n\n${body}\n\n${result?.signoff || ''}`;
    Clipboard.setString(text);
    Toast.show({ type: 'success', text1: 'Copied!', position: 'bottom' });
  };

  const handleClose = () => { setResult(null); setBody(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Follow-up Message</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={styles.center}>
              <Text style={styles.subtitle}>
                Draft a follow-up for {learnerName || 'your learner'}
              </Text>
              <AiButton label="Draft Follow-up" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Subject</Text>
                <Text style={styles.fieldValue}>{result.subject}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Body</Text>
                <TextInput
                  style={styles.textArea}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {result.signoff && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Sign-off</Text>
                  <Text style={styles.fieldValue}>{result.signoff}</Text>
                </View>
              )}

              {result.next_step_cta && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Next Step CTA</Text>
                  <Text style={styles.ctaText}>{result.next_step_cta}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.copyBtn} onPress={copyAll}>
                  <Copy size={wp(14)} color={colors.white} />
                  <Text style={styles.btnText}>Copy</Text>
                </TouchableOpacity>
                <AiButton label="Regenerate" onPress={generate} loading={loading} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default FollowUpModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  center: { alignItems: 'center', paddingTop: hp(40), gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary, textAlign: 'center' },
  field: { marginBottom: hp(16) },
  fieldLabel: { fontSize: fp(12), fontWeight: '600', color: colors.textMuted, marginBottom: hp(4) },
  fieldValue: { fontSize: fp(14), color: colors.text, lineHeight: fp(22) },
  textArea: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14),
    fontSize: fp(14), color: colors.text, minHeight: hp(180),
    borderWidth: 1, borderColor: colors.borderLight, lineHeight: fp(22),
  },
  ctaText: { fontSize: fp(14), color: colors.info, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: wp(12), alignItems: 'center', marginTop: hp(8) },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(6),
    backgroundColor: colors.primary, paddingHorizontal: wp(16), paddingVertical: hp(10),
    borderRadius: wp(10),
  },
  btnText: { fontSize: fp(13), fontWeight: '600', color: colors.white },
});
