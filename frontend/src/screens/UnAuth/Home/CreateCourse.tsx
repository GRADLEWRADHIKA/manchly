import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../utils/colors';

const CreateCourse = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded selections (simulates picking files)
  const pickHardcodedThumbnail = () => {
    // In a real app you'd launch image picker. Here we hardcode.
    setThumbnail({ name: 'thumbnail-preview.jpg', size: '120KB' });
    Toast.show({ text1: 'Thumbnail selected', type: 'info' });
  };

  const pickHardcodedVideo = () => {
    setVideo({ name: 'course-intro.mp4', size: '18.2MB', duration: '4:12' });
    Toast.show({ text1: 'Video selected', type: 'info' });
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a course title');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Validation', 'Please enter a price for the course');
      return;
    }

    if (!thumbnail || !video) {
      Alert.alert('Validation', 'Please select both a thumbnail and a video');
      return;
    }

    // Simulate upload / creation process
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Course created',
        text2: `"${title}" has been created successfully`,
      });

      // Optionally clear form
      setTitle('');
      setPrice('');
      setDetails('');
      setThumbnail(null);
      setVideo(null);
    }, 5000); // 5 seconds loader as requested
  };

  return (
    <View style={screenStyles.root}>
      <AppHeaderWithBack title="Create Course" />

      <KeyboardAvoidingView
        style={screenStyles.flexGrow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={screenStyles.scrollArea}>
          <View style={screenStyles.formCard}>
            <Text style={screenStyles.label}>Course Title</Text>
            <TextInput
              placeholder="Enter title"
              value={title}
              onChangeText={setTitle}
              style={screenStyles.inputField}
              placeholderTextColor="#999"
            />

            <Text style={screenStyles.label}>Price (INR)</Text>
            <TextInput
              placeholder="e.g. 499"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={screenStyles.inputField}
              placeholderTextColor="#999"
            />

            <Text style={screenStyles.label}>About this course</Text>
            <TextInput
              placeholder="Write a short description"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              style={[screenStyles.inputField, screenStyles.textArea]}
              placeholderTextColor="#999"
            />

            <Text style={screenStyles.label}>Thumbnail (hardcoded)</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={screenStyles.selectorRow}
              onPress={pickHardcodedThumbnail}
              disabled={loading}
            >
              <View style={screenStyles.iconWrapper}>
                <ImageIcon width={20} height={20} color={colors.primary} />
              </View>
              <Text style={screenStyles.selectorText}>
                {thumbnail ? thumbnail.name : 'Select thumbnail'}
              </Text>
            </TouchableOpacity>

            <Text style={screenStyles.label}>Intro Video (hardcoded)</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={screenStyles.selectorRow}
              onPress={pickHardcodedVideo}
              disabled={loading}
            >
              <View style={screenStyles.iconWrapper}>
                <VideoIcon width={20} height={20} color={colors.primary} />
              </View>
              <Text style={screenStyles.selectorText}>{video ? video.name : 'Select video'}</Text>
            </TouchableOpacity>

            <View style={screenStyles.actionsRow}>
              <TouchableOpacity
                style={[
                  screenStyles.createButton,
                  loading ? screenStyles.buttonDisabled : null,
                ]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={screenStyles.createButtonText}>Create Course</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={screenStyles.hintBox}>
              <Text style={screenStyles.hintTitle}>Selected files</Text>
              <Text style={screenStyles.hintText}>Thumbnail: {thumbnail ? thumbnail.name : '—'}</Text>
              <Text style={screenStyles.hintText}>Video: {video ? `${video.name} (${video.duration || '—'})` : '—'}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast must be mounted at the root of your app (or this screen) */}
      <Toast />
    </View>
  );
};

export default CreateCourse;

const screenStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  flexGrow: { flex: 1 },
  scrollArea: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    color: '#333',
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f7f7f7',
  },
  selectorText: { fontSize: 14, color: '#333' },
  actionsRow: { marginTop: 18, alignItems: 'flex-end' },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  createButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.65 },
  hintBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9fb',
  },
  hintTitle: { fontWeight: '700', marginBottom: 6 },
  hintText: { color: '#444' },
});
