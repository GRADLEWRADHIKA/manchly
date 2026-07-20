import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type TitleItem = { title: string; angle: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  topic: string;
  audience?: string;
  onSelect: (title: string) => void;
};

const ANGLE_COLORS: Record<string, string> = {
  outcome: colors.success,
  contrarian: colors.error,
  how_to: colors.info,
  story: colors.secondary,
  urgency: '#E11D48',
};

const TitleSuggestionsModal: React.FC<Props> = ({
  visible, onClose, topic, audience, onSelect,
}) => {
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<TitleItem[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/webinar/title-suggestions', {
        topic, audience: audience || '', count: 5,
      });
      setTitles(data.titles || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to get suggestions', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (t: string) => {
    onSelect(t);
    setTitles([]);
    onClose();
  };

  const handleClose = () => { setTitles([]); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>Suggested Titles</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={wp(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {titles.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.subtitle}>Get AI title ideas for your webinar</Text>
                <AiButton label="Suggest Titles" onPress={generate} loading={loading} />
              </View>
            ) : (
              <>
                {titles.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.card} onPress={() => handleSelect(item.title)}>
                    <View style={styles.cardTop}>
                      <View style={[styles.angleBadge, { backgroundColor: (ANGLE_COLORS[item.angle] || colors.info) + '20' }]}>
                        <Text style={[styles.angleText, { color: ANGLE_COLORS[item.angle] || colors.info }]}>
                          {item.angle?.replace('_', ' ')}
                        </Text>
                      </View>
                      <Check size={wp(16)} color={colors.textMuted} />
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
                <AiButton label="More suggestions" onPress={generate} loading={loading} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default TitleSuggestionsModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20),
    maxHeight: '80%', paddingBottom: hp(30),
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  heading: { fontSize: fp(17), fontWeight: '700', color: colors.text },
  scroll: { padding: wp(16) },
  center: { alignItems: 'center', paddingVertical: hp(30), gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface, borderRadius: wp(12), padding: wp(14),
    marginBottom: hp(10), borderWidth: 1, borderColor: colors.borderLight,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(6) },
  angleBadge: { paddingHorizontal: wp(8), paddingVertical: hp(3), borderRadius: wp(6) },
  angleText: { fontSize: fp(10), fontWeight: '700', textTransform: 'capitalize' },
  cardTitle: { fontSize: fp(14), fontWeight: '600', color: colors.text, lineHeight: fp(21) },
});
