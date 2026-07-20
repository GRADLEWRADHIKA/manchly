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

type Props = {visible: boolean; onClose: () => void; name?: string; expertise?: string};

const ExpertBioModal: React.FC<Props> = ({visible, onClose, name: prefillName, expertise: prefillExpertise}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [name, setName] = useState(prefillName || '');
  const [expertise, setExpertise] = useState(prefillExpertise || '');
  const [years, setYears] = useState('');

  const generate = async () => {
    if (!name.trim() || !expertise.trim()) {
      Toast.show({type: 'error', text1: 'Name and expertise are required', position: 'top'});
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/expert/bio', {
        name: name.trim(),
        expertise: expertise.trim(),
        years_experience: years ? Number(years) : undefined,
      });
      setResult(data);
    } catch {
      Toast.show({type: 'error', text1: 'Failed to generate bio', position: 'top'});
    } finally {
      setLoading(false);
    }
  };

  const copyText = (t: string) => {
    Clipboard.setString(t);
    Toast.show({type: 'success', text1: 'Copied!', position: 'top'});
  };

  const handleClose = () => { setResult(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Expert Bio Generator</Text>
          <TouchableOpacity onPress={handleClose}><X size={wp(22)} color={colors.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Generate a professional bio for your expert profile</Text>
              <Text style={s.label}>Name *</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="Your name" placeholderTextColor={colors.textMuted} value={name} onChange={setName} />
              <Text style={s.label}>Expertise *</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="e.g. Financial Planning, Career Coaching" placeholderTextColor={colors.textMuted} value={expertise} onChange={setExpertise} />
              <Text style={s.label}>Years of Experience</Text>
              <CustomTextInput inputContainerStyle={s.input} inputStyle={s.inputText} placeholder="e.g. 8" placeholderTextColor={colors.textMuted} value={years} onChange={setYears} keyboardType="numeric" />
              <AiButton label="Generate Bio" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              <View style={s.section}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={s.sectionTitle}>Short Bio</Text>
                  <TouchableOpacity onPress={() => copyText(result.short_bio || '')}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <Text style={s.body}>{result.short_bio}</Text>
              </View>
              <View style={s.section}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={s.sectionTitle}>Full Bio</Text>
                  <TouchableOpacity onPress={() => copyText(result.full_bio || '')}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                <Text style={s.body}>{result.full_bio}</Text>
              </View>
              {result.headline && (
                <View style={s.section}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={s.sectionTitle}>Headline</Text>
                    <TouchableOpacity onPress={() => copyText(result.headline)}><Copy size={wp(16)} color={colors.textSecondary} /></TouchableOpacity>
                  </View>
                  <Text style={s.body}>{result.headline}</Text>
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

export default ExpertBioModal;

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
  regenerate: {alignItems: 'center', marginTop: hp(8)},
});
