import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  courseTitle: string;
  lessonTitle: string;
  level?: string;
};

const LessonScriptModal: React.FC<Props> = ({
  visible, onClose, courseTitle, lessonTitle, level,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [script, setScript] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/course/lesson-script', {
        course_title: courseTitle,
        lesson_title: lessonTitle,
        level: level || 'Beginner',
      });
      setResult(data);
      setScript(data.script || '');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate script', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setScript('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lesson Script</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={styles.center}>
              <Text style={styles.subtitle}>Generate a script for:</Text>
              <Text style={styles.lessonName}>{lessonTitle}</Text>
              <AiButton label="Generate Script" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              {result.hook && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hook</Text>
                  <Text style={styles.body}>{result.hook}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Script</Text>
                <TextInput
                  style={styles.textArea}
                  value={script}
                  onChangeText={setScript}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {result.talking_points?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Talking Points</Text>
                  {result.talking_points.map((pt: string, i: number) => (
                    <Text key={i} style={styles.bullet}>{'\u2022'} {pt}</Text>
                  ))}
                </View>
              )}

              {result.call_to_action && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Call to Action</Text>
                  <Text style={styles.body}>{result.call_to_action}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default LessonScriptModal;

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
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  lessonName: { fontSize: fp(16), fontWeight: '700', color: colors.text, textAlign: 'center' },
  section: { marginBottom: hp(20) },
  sectionTitle: { fontSize: fp(14), fontWeight: '700', color: colors.text, marginBottom: hp(8) },
  body: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22) },
  bullet: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22), marginBottom: hp(4) },
  textArea: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14),
    fontSize: fp(14), color: colors.text, minHeight: hp(200),
    borderWidth: 1, borderColor: colors.borderLight, lineHeight: fp(22),
  },
});
