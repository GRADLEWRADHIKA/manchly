import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  productTitle: string;
  learnerContext?: string;
  durationMin?: number;
};

const SECTIONS = [
  { key: 'expert_checklist', label: 'Your Checklist', color: colors.info },
  { key: 'questions_to_ask_first', label: 'Questions to Ask First', color: colors.success },
  { key: 'potential_directions', label: 'Potential Directions', color: colors.secondary },
  { key: 'red_flags', label: 'Red Flags', color: colors.error },
];

const PrepChecklistModal: React.FC<Props> = ({
  visible, onClose, productTitle, learnerContext, durationMin,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    expert_checklist: true,
  });

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/session/prep-checklist', {
        product_title: productTitle,
        ...(learnerContext ? { learner_context: learnerContext } : {}),
        ...(durationMin ? { duration_min: durationMin } : {}),
      });
      setResult(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate checklist', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleClose = () => { setResult(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>Pre-call Prep</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={wp(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {!result ? (
              <View style={styles.center}>
                <Text style={styles.subtitle}>Prepare for your session</Text>
                <Text style={styles.productName}>{productTitle}</Text>
                <AiButton label="Generate Prep" onPress={generate} loading={loading} />
              </View>
            ) : (
              SECTIONS.map(sec => {
                const items: string[] = result[sec.key] || [];
                if (items.length === 0) return null;
                const isOpen = expanded[sec.key];
                return (
                  <View key={sec.key} style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle(sec.key)}>
                      <View style={[styles.dot, { backgroundColor: sec.color }]} />
                      <Text style={styles.sectionTitle}>{sec.label}</Text>
                      {isOpen
                        ? <ChevronUp size={wp(18)} color={colors.textMuted} />
                        : <ChevronDown size={wp(18)} color={colors.textMuted} />}
                    </TouchableOpacity>
                    {isOpen && items.map((item, i) => (
                      <Text key={i} style={styles.bullet}>{'\u2022'} {item}</Text>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PrepChecklistModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20),
    maxHeight: '85%', paddingBottom: hp(30),
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  heading: { fontSize: fp(17), fontWeight: '700', color: colors.text },
  scroll: { padding: wp(16) },
  center: { alignItems: 'center', paddingVertical: hp(30), gap: hp(10) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  productName: { fontSize: fp(15), fontWeight: '700', color: colors.text },
  section: {
    backgroundColor: colors.surface, borderRadius: wp(12), padding: wp(14),
    marginBottom: hp(10),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(8) },
  dot: { width: wp(8), height: wp(8), borderRadius: wp(4) },
  sectionTitle: { flex: 1, fontSize: fp(14), fontWeight: '700', color: colors.text },
  bullet: {
    fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20),
    marginTop: hp(6), paddingLeft: wp(16),
  },
});
