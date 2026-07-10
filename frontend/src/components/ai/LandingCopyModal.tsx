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

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  price: number;
  audience?: string;
};

const LandingCopyModal: React.FC<Props> = ({
  visible, onClose, title, description, price, audience,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/course/landing-copy', {
        title, description, price, audience: audience || 'professionals',
      });
      setResult(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate copy', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    Clipboard.setString(text);
    Toast.show({ type: 'success', text1: 'Copied!', position: 'bottom' });
  };

  const handleClose = () => { setResult(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Landing Page Copy</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={styles.center}>
              <Text style={styles.subtitle}>Generate marketing copy for your course</Text>
              <AiButton label="Generate Copy" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <CopySection label="Headline" text={result.headline} onCopy={copyText} />
              <CopySection label="Sub-headline" text={result.sub_headline} onCopy={copyText} />

              {result.value_bullets?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Value Propositions</Text>
                  {result.value_bullets.map((b: string, i: number) => (
                    <Text key={i} style={styles.bullet}>{'\u2022'} {b}</Text>
                  ))}
                </View>
              )}

              {result.faq?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>FAQ</Text>
                  {result.faq.map((f: any, i: number) => (
                    <View key={i} style={styles.faqItem}>
                      <Text style={styles.faqQ}>Q: {f.q}</Text>
                      <Text style={styles.faqA}>A: {f.a}</Text>
                    </View>
                  ))}
                </View>
              )}

              <CopySection label="CTA Button" text={result.cta_button_text} onCopy={copyText} />
              <CopySection label="Social Proof" text={result.social_proof_template} onCopy={copyText} />

              <View style={styles.regenerate}>
                <AiButton label="Regenerate" onPress={generate} loading={loading} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const CopySection = ({ label, text, onCopy }: { label: string; text?: string; onCopy: (t: string) => void }) => {
  if (!text) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <TouchableOpacity onPress={() => onCopy(text)}>
          <Copy size={wp(16)} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
};

export default LandingCopyModal;

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
  section: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14),
    marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: fp(13), fontWeight: '700', color: colors.text, marginBottom: hp(6) },
  body: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22) },
  bullet: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22), marginBottom: hp(4) },
  faqItem: { marginBottom: hp(10) },
  faqQ: { fontSize: fp(14), fontWeight: '600', color: colors.text },
  faqA: { fontSize: fp(13), color: colors.textSecondary, marginTop: hp(2), lineHeight: fp(20) },
  regenerate: { alignItems: 'center', marginTop: hp(8) },
});
