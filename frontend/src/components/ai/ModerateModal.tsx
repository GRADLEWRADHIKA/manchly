import React, {useState} from 'react';
import {View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {X, ShieldCheck, ShieldAlert} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import {wp, hp, fp} from '../../utils/responsive';
import {aiCall} from '../../utils/aiApi';
import AiButton from '../AiButton';
import CustomTextInput from '../CustomInput';

type Props = {visible: boolean; onClose: () => void};

const ModerateModal: React.FC<Props> = ({visible, onClose}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [text, setText] = useState('');

  const moderate = async () => {
    if (!text.trim()) {
      Toast.show({type: 'error', text1: 'Text is required', position: 'top'});
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/moderate', {text: text.trim()});
      setResult(data);
    } catch {
      Toast.show({type: 'error', text1: 'Moderation failed', position: 'top'});
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setResult(null); setText(''); onClose(); };
  const flagged = result?.flagged;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Content Moderator</Text>
          <TouchableOpacity onPress={handleClose}><X size={wp(22)} color={colors.text} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {!result ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Check if your content is safe to publish</Text>
              <Text style={s.label}>Content to check *</Text>
              <CustomTextInput inputContainerStyle={[s.input, {height: hp(140)}]} inputStyle={[s.inputText, {textAlignVertical: 'top'}]} placeholder="Paste your text here..." placeholderTextColor={colors.textMuted} value={text} onChange={setText} multiline numberOfLines={6} />
              <AiButton label="Check Content" onPress={moderate} loading={loading} />
            </View>
          ) : (
            <>
              <View style={[s.resultCard, {backgroundColor: flagged ? '#FEF2F2' : '#F0FDF4', borderColor: flagged ? '#FECACA' : '#BBF7D0'}]}>
                {flagged ? <ShieldAlert size={wp(32)} color="#EF4444" /> : <ShieldCheck size={wp(32)} color="#22C55E" />}
                <Text style={[s.resultTitle, {color: flagged ? '#EF4444' : '#22C55E'}]}>
                  {flagged ? 'Content Flagged' : 'Content is Safe'}
                </Text>
                {result.reason && <Text style={s.resultReason}>{result.reason}</Text>}
              </View>

              {result.categories && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Categories Checked</Text>
                  {Object.entries(result.categories).map(([key, val]) => (
                    <View key={key} style={s.catRow}>
                      <Text style={s.catName}>{key}</Text>
                      <Text style={[s.catStatus, {color: val ? '#EF4444' : '#22C55E'}]}>
                        {val ? 'Flagged' : 'Clean'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {result.severity && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Severity: <Text style={{fontWeight: '400'}}>{result.severity}</Text></Text>
                </View>
              )}

              <View style={s.regenerate}>
                <AiButton label="Check Another" onPress={() => { setResult(null); setText(''); }} loading={false} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ModerateModal;

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
  resultCard: {borderRadius: wp(16), padding: wp(20), alignItems: 'center', gap: hp(8), marginBottom: hp(16), borderWidth: 1},
  resultTitle: {fontSize: fp(18), fontWeight: '800'},
  resultReason: {fontSize: fp(13), color: colors.textSecondary, textAlign: 'center'},
  section: {backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14), marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight},
  sectionTitle: {fontSize: fp(13), fontWeight: '700', color: colors.text, marginBottom: hp(8)},
  catRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(4)},
  catName: {fontSize: fp(13), color: colors.text, textTransform: 'capitalize'},
  catStatus: {fontSize: fp(13), fontWeight: '700'},
  regenerate: {alignItems: 'center', marginTop: hp(8)},
});
