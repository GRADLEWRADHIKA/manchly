import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Clock, Link } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const STORAGE_KEY = 'webinars';

const CreateWebinarScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [presenter, setPresenter] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDateTime(new Date().toLocaleString());
  }, []);

  const generateDummyZoom = () => {
    const meetingId = Math.floor(
      1000000000 + Math.random() * 9000000000,
    ).toString();
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const link = `https://zoom.us/j/${meetingId}?pwd=${passcode}`;
    return { meetingId, passcode, link };
  };

  const showSuccess = message => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
    });
  };

  const showError = message => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
    });
  };

  const saveWebinar = async () => {
    if (!title.trim()) {
      showError('Please add a webinar title.');
      return;
    }
    if (!presenter.trim()) {
      showError('Please add presenter name.');
      return;
    }

    setSaving(true);

    setTimeout(async () => {
      try {
        const { meetingId, passcode, link } = generateDummyZoom();
        const newWebinar = {
          id: `webinar_${Date.now()}`,
          title: title.trim(),
          presenter: presenter.trim(),
          dateTime: dateTime || new Date().toLocaleString(),
          durationMinutes: Number(duration) || 60,
          description: description.trim(),
          createdAt: new Date().toISOString(),
          zoom: {
            meetingId,
            passcode,
            joinLink: link,
          },
        };

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(newWebinar);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

        showSuccess(`Webinar "${newWebinar.title}" created successfully 🎉`);

        navigation.goBack();
      } catch (err) {
        console.error('saveWebinar error', err);
        showError('Unable to save webinar. Try again.');
      } finally {
        setSaving(false);
      }
    }, 5000);
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#fff" />
      <AppHeaderWithBack title="Create Webinar" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                placeholder="e.g. How to scale React Native apps"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholderTextColor="#999"
                editable={!saving}
              />
            </View>

            <View style={[styles.row, { marginTop: 15 }]}>
              <View style={[styles.rowItem]}>
                <Text style={styles.label}>Presenter</Text>
                <TextInput
                  keyboardType="default"
                  value={String(presenter)}
                  onChangeText={setPresenter}
                  style={styles.input}
                  placeholder="Presenter Name"
                  placeholderTextColor="#999"
                  editable={!saving}
                />
              </View>

              <View style={[styles.rowItem, { marginLeft: 8 }]}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(duration)}
                  onChangeText={setDuration}
                  style={styles.input}
                  placeholder="60"
                  placeholderTextColor="#999"
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date & Time</Text>
              <View style={styles.inputWithIcon}>
                <Calendar width={18} height={18} />
                <TextInput
                  placeholder="e.g. 2025-10-02 16:00"
                  value={dateTime}
                  onChangeText={setDateTime}
                  style={styles.inputInside}
                  placeholderTextColor="#999"
                  editable={!saving}
                />
              </View>
              <Text style={styles.hint}>
                (Dummy value — type any date/time string)
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Short description for the webinar"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
                editable={!saving}
              />
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Zoom (dummy) details</Text>
              <View style={styles.previewRow}>
                <Link width={16} height={16} />
                <Text style={styles.previewText}>
                  Meeting link will be generated.
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Clock width={16} height={16} />
                <Text style={styles.previewText}>
                  Stored locally in AsyncStorage.
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.primaryButton]}
                onPress={saveWebinar}
                disabled={saving}
              >
                {saving ? (
                  <View style={styles.savingRow}>
                    <ActivityIndicator size="small" />
                    <Text style={[styles.primaryText, { marginLeft: 8 }]}>
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryText}>Create Webinar</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {saving && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8 }}>Creating webinar...</Text>
          </View>
        </View>
      )}

      <Toast />
    </View>
  );
};

export default CreateWebinarScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 16 },
  keyboardWrapper: { flex: 1 },
  formScroll: { paddingBottom: 24 },
  field: { marginTop: 12 },
  label: { fontSize: 13, marginBottom: 6, color: '#333', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowItem: { flex: 1 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  inputInside: { marginLeft: 8, flex: 1, fontSize: 15, color: '#222' },
  hint: { marginTop: 6, fontSize: 12, color: '#777' },
  previewCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  previewTitle: { fontWeight: '700', marginBottom: 8, color: '#333' },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  previewText: { marginLeft: 8, color: '#555', fontSize: 14 },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  cancelText: { color: '#444', fontWeight: '700' },
  primaryButton: { backgroundColor: colors.primary },
  primaryText: { color: '#fff', fontWeight: '800' },

  savingRow: { flexDirection: 'row', alignItems: 'center' },

  // overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    minWidth: 160,
  },
});
