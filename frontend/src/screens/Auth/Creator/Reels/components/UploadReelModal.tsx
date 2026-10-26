import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import { UploadCloud, X, AlertCircle } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const MAX_MB = 200;

const UploadReelModal = ({ visible, courses, onClose, onSubmit }: any) => {
  const [courseId, setCourseId] = useState(courses?.[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<any>(null);
  const [error, setError] = useState('');

  const pickVideo = async () => {
    try {
      const res = await pick({ type: [types.video] });
      if (!res?.length) return;
      const picked = res[0];

      if (picked.size && picked.size > MAX_MB * 1024 * 1024) {
        setError(`Keep it under ${MAX_MB} MB`);
        return;
      }
      setError('');
      setFile({
        uri: picked.uri,
        type: picked.type || 'video/mp4',
        name: picked.name || 'reel.mp4',
        size: picked.size,
      });
    } catch (err) {
      // user cancelled the picker — no error needed
    }
  };

  const submit = () => {
    if (!courseId) return setError('Pick a course');
    if (!file) return setError('Choose a video');
    onSubmit({ courseId, caption: caption.trim(), file });
    setCaption('');
    setFile(null);
    setError('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>New Reel</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={wp(16)} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Course this reel promotes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursePickerRow}>
              {(Array.isArray(courses) ? courses : []).map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCourseId(c.id)}
                  style={[styles.courseChip, courseId === c.id && styles.courseChipActive]}
                >
                  <Text
                    style={[styles.courseChipText, courseId === c.id && styles.courseChipTextActive]}
                    numberOfLines={1}
                  >
                    {c.title}
                    {String(c.status).toUpperCase() !== 'PUBLISHED' ? ' (draft)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.hint}>Only reels on published courses appear in the learner feed.</Text>

            <Text style={styles.label}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={t => setCaption(t.slice(0, 300))}
              multiline
              numberOfLines={3}
              placeholder="Facebook page kaise banaye — full guide in this course"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.textArea}
            />
            <Text style={styles.hint}>{caption.length}/300</Text>

            <Text style={styles.label}>Video</Text>
            <TouchableOpacity style={styles.dropzone} onPress={pickVideo} activeOpacity={0.8}>
              <UploadCloud size={wp(22)} color={GOLD_CREAM} />
              <Text style={styles.dropzoneTitle}>
                {file ? file.name : 'Tap to choose a vertical video'}
              </Text>
              <Text style={styles.dropzoneSubtitle}>
                {file
                  ? file.size
                    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                    : ''
                  : `9:16, 15–60 seconds, up to ${MAX_MB} MB`}
              </Text>
            </TouchableOpacity>

            {!!error && (
              <View style={styles.errorRow}>
                <AlertCircle size={wp(14)} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={submit} activeOpacity={0.85}>
                <UploadCloud size={wp(15)} color="#3A2C12" />
                <Text style={styles.uploadBtnText}>Upload Reel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default UploadReelModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1C1B1B',
    borderTopLeftRadius: wp(22),
    borderTopRightRadius: wp(22),
    paddingHorizontal: wp(20),
    paddingTop: hp(18),
    paddingBottom: hp(28),
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(16) },
  title: { fontSize: fp(18), fontWeight: '800', color: colors.white },
  closeBtn: {
    width: wp(28), height: wp(28), borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: fp(12.5), fontWeight: '700', color: colors.white, marginTop: hp(14), marginBottom: hp(6) },
  coursePickerRow: { flexGrow: 0 },
  courseChip: {
    paddingHorizontal: wp(14), paddingVertical: hp(9), borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginRight: wp(8), maxWidth: wp(180),
  },
  courseChipActive: { backgroundColor: 'rgba(214,156,63,0.18)', borderColor: GOLD_DEEP },
  courseChipText: { fontSize: fp(12.5), color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  courseChipTextActive: { color: GOLD_CREAM },
  hint: { fontSize: fp(11), color: 'rgba(255,255,255,0.4)', marginTop: hp(6) },
  textArea: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: wp(12),
    paddingHorizontal: wp(12), paddingVertical: hp(10), color: colors.white,
    backgroundColor: '#0F0F0F', fontSize: fp(14), textAlignVertical: 'top', minHeight: hp(70),
  },
  dropzone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: wp(14), paddingVertical: hp(24), alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dropzoneTitle: { fontSize: fp(13), fontWeight: '600', color: colors.white, marginTop: hp(8) },
  dropzoneSubtitle: { fontSize: fp(11.5), color: 'rgba(255,255,255,0.45)', marginTop: hp(3) },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: wp(6), marginTop: hp(10) },
  errorText: { color: '#EF4444', fontSize: fp(12.5) },
  buttonsRow: { flexDirection: 'row', gap: wp(10), marginTop: hp(22) },
  cancelBtn: {
    flex: 1, height: hp(46), borderRadius: wp(12), alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: { color: colors.white, fontWeight: '600', fontSize: fp(14) },
  uploadBtn: {
    flex: 1, flexDirection: 'row', gap: wp(6), height: hp(46), borderRadius: wp(12),
    alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD_DEEP,
  },
  uploadBtnText: { color: '#3A2C12', fontWeight: '700', fontSize: fp(14) },
});