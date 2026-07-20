import React, {useState} from 'react';
import {View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {X, Copy} from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import {wp, hp, fp} from '../../utils/responsive';
import {aiCall} from '../../utils/aiApi';
import AiButton from '../AiButton';
import CustomTextInput from '../CustomInput';

type Props = {visible: boolean; onClose: () => void};

const CourseMetaModal: React.FC<Props> = ({visible, onClose}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');

  const generate = async () => {
    if (!topic.trim()) {
      Toast.show({type: 'error', text1: 'Topic is required', position: 'top'});
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/course/generate-meta', {
        topic: topic.trim(),
        audience: audience.trim() || 'general learners',
      });
      setResult(data);
    } catch {
      Toast.show({type: 'error', text1: 'Failed to generate', position: 'top'});
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    Clipboard.setString(text);
    Toast.show({type: 'success', text1: 'Copied!', position: 'top'});
  };

  const handleClose = () => {
    setResult(null);
    setTopic('');
    setAudience('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Course Meta Generator</Text>
          <TouchableOpacity onPress={handleClose}><X size={wp(22)} color={colors.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Generate title, description, and curriculum for your course</Text>
              <Text style={s.label}>Topic *</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="e.g. React Native for Beginners" placeholderTextColor={colors.textMuted} value={topic} onChange={setTopic} />
              <Text style={s.label}>Target Audience</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="e.g. junior developers" placeholderTextColor={colors.textMuted} value={audience} onChange={setAudience} />
              <AiButton label="Generate Course Meta" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <CopyBlock label="Title" text={result.title} onCopy={copyText} />
              <CopyBlock label="Subtitle" text={result.subtitle} onCopy={copyText} />
              <CopyBlock label="Description" text={result.description} onCopy={copyText} />
              {result.learning_outcomes?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Learning Outcomes</Text>
                  {result.learning_outcomes.map((o: string, i: number) => (
                    <Text key={i} style={s.bullet}>{'\u2022'} {o}</Text>
                  ))}
                </View>
              )}
              {result.modules?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Curriculum</Text>
                  {result.modules.map((m: any, i: number) => (
                    <View key={i} style={s.moduleItem}>
                      <Text style={s.moduleName}>{i + 1}. {m.module}</Text>
                      {m.lessons?.map((l: string, j: number) => (
                        <Text key={j} style={s.lessonText}>   {'\u2022'} {l}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              <View style={s.regenerate}><AiButton label="Regenerate" onPress={generate} loading={loading} /></View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const CopyBlock = ({label, text, onCopy}: {label: string; text?: string; onCopy: (t: string) => void}) => {
  if (!text) return null;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{label}</Text>
        <TouchableOpacity onPress={() => onCopy(text)}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
      </View>
      <Text style={s.body}>{text}</Text>
    </View>
  );
};

export default CourseMetaModal;

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white},
  title: {fontSize: fp(18), fontWeight: '700', color: colors.text},
  scroll: {padding: wp(16), paddingBottom: hp(40)},
  center: {paddingTop: hp(20), gap: hp(8)},
  subtitle: {fontSize: fp(14), color: colors.textSecondary, textAlign: 'center', marginBottom: hp(16)},
  label: {fontSize: fp(12), fontWeight: '600', color: colors.text, marginBottom: hp(4)},
  input: {borderRadius: 10, paddingHorizontal: wp(12), height: hp(44), width: '100%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, marginBottom: hp(12)},
  inputText: {color: colors.text, fontSize: fp(14)},
  section: {backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14), marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: fp(13), fontWeight: '700', color: colors.text, marginBottom: hp(6)},
  body: {fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22)},
  bullet: {fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20), marginBottom: hp(2)},
  moduleItem: {marginBottom: hp(8)},
  moduleName: {fontSize: fp(14), fontWeight: '600', color: colors.text},
  lessonText: {fontSize: fp(12), color: colors.textSecondary, lineHeight: fp(18)},
  regenerate: {alignItems: 'center', marginTop: hp(8)},
});
