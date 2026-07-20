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

const LessonSummaryModal: React.FC<Props> = ({visible, onClose}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [text, setText] = useState('');

  const generate = async () => {
    if (!text.trim() || text.trim().length < 80) {
      Toast.show({type: 'error', text1: 'Text must be at least 80 characters', position: 'top'});
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/lesson/summarize', {text: text.trim()});
      setResult(data);
    } catch {
      Toast.show({type: 'error', text1: 'Failed to summarize', position: 'top'});
    } finally {
      setLoading(false);
    }
  };

  const copyText = (t: string) => {
    Clipboard.setString(t);
    Toast.show({type: 'success', text1: 'Copied!', position: 'top'});
  };

  const handleClose = () => { setResult(null); setText(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Lesson Summarizer</Text>
          <TouchableOpacity onPress={handleClose}><X size={wp(22)} color={colors.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Paste your lesson content to get a concise summary</Text>
              <Text style={s.label}>Lesson Content * (min 80 chars)</Text>
              <CustomTextInput inputContainerStyle={[s.input, {height: hp(160)}]} inputStyle={[s.inputText, {textAlignVertical: 'top'}]} placeholder="Paste your lesson text here..." placeholderTextColor={colors.textMuted} value={text} onChange={setText} multiline numberOfLines={8} />
              <AiButton label="Summarize Lesson" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <View style={s.section}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={s.sectionTitle}>Summary</Text>
                  <TouchableOpacity onPress={() => copyText(result.summary || '')}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <Text style={s.body}>{result.summary}</Text>
              </View>
              {result.key_points?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Key Points</Text>
                  {result.key_points.map((p: string, i: number) => (
                    <Text key={i} style={s.bullet}>{'\u2022'} {p}</Text>
                  ))}
                </View>
              )}
              {result.action_items?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Action Items</Text>
                  {result.action_items.map((a: string, i: number) => (
                    <Text key={i} style={s.bullet}>{'\u2022'} {a}</Text>
                  ))}
                </View>
              )}
              <View style={s.regenerate}><AiButton label="Summarize Again" onPress={generate} loading={loading} /></View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default LessonSummaryModal;

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white},
  headerTitle: {fontSize: fp(18), fontWeight: '700', color: colors.text},
  scroll: {padding: wp(16), paddingBottom: hp(40)},
  center: {paddingTop: hp(20), gap: hp(8)},
  subtitle: {fontSize: fp(14), color: colors.textSecondary, textAlign: 'center', marginBottom: hp(12)},
  label: {fontSize: fp(12), fontWeight: '600', color: colors.text, marginBottom: hp(4)},
  input: {borderRadius: 10, paddingHorizontal: wp(12), height: hp(44), width: '100%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, marginBottom: hp(12)},
  inputText: {color: colors.text, fontSize: fp(14)},
  section: {backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14), marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight},
  sectionTitle: {fontSize: fp(13), fontWeight: '700', color: colors.text, marginBottom: hp(6)},
  body: {fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22)},
  bullet: {fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20), marginBottom: hp(2)},
  regenerate: {alignItems: 'center', marginTop: hp(8)},
});
