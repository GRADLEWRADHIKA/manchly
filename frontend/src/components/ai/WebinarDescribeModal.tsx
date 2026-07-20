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

type Props = {visible: boolean; onClose: () => void; title?: string};

const WebinarDescribeModal: React.FC<Props> = ({visible, onClose, title: prefillTitle}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [title, setTitle] = useState(prefillTitle || '');

  const generate = async () => {
    if (!title.trim()) {
      Toast.show({type: 'error', text1: 'Title is required', position: 'top'});
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/webinar/describe', {title: title.trim()});
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

  const handleClose = () => { setResult(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Webinar Description</Text>
          <TouchableOpacity onPress={handleClose}><X size={wp(22)} color={colors.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Generate a compelling webinar description</Text>
              <Text style={s.label}>Webinar Title *</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="e.g. Mastering Personal Branding" placeholderTextColor={colors.textMuted} value={title} onChange={setTitle} />
              <AiButton label="Generate Description" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <CopyBlock label="Tagline" text={result.tagline} onCopy={copyText} />
              <CopyBlock label="Description" text={result.description} onCopy={copyText} />
              {result.key_takeaways?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Key Takeaways</Text>
                  {result.key_takeaways.map((t: string, i: number) => (
                    <Text key={i} style={s.bullet}>{'\u2022'} {t}</Text>
                  ))}
                </View>
              )}
              <CopyBlock label="Who Should Attend" text={result.who_should_attend} onCopy={copyText} />
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
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={s.sectionTitle}>{label}</Text>
        <TouchableOpacity onPress={() => onCopy(text)}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
      </View>
      <Text style={s.body}>{text}</Text>
    </View>
  );
};

export default WebinarDescribeModal;

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white},
  headerTitle: {fontSize: fp(18), fontWeight: '700', color: colors.text},
  scroll: {padding: wp(16), paddingBottom: hp(40)},
  center: {paddingTop: hp(20), gap: hp(8)},
  subtitle: {fontSize: fp(14), color: colors.textSecondary, textAlign: 'center', marginBottom: hp(16)},
  label: {fontSize: fp(12), fontWeight: '600', color: colors.text, marginBottom: hp(4)},
  input: {borderRadius: 10, paddingHorizontal: wp(12), height: hp(44), width: '100%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, marginBottom: hp(12)},
  inputText: {color: colors.text, fontSize: fp(14)},
  section: {backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14), marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight},
  sectionTitle: {fontSize: fp(13), fontWeight: '700', color: colors.text, marginBottom: hp(6)},
  body: {fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22)},
  bullet: {fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20), marginBottom: hp(2)},
  regenerate: {alignItems: 'center', marginTop: hp(8)},
});
