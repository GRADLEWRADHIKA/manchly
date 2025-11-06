import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Video, X } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import { pick, types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { createVideoUpload } from '../../../../store/VideoSlice';

const CourseAddVideoModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const route = useRoute();
  const { token } = useSelector((state: any) => state.userReducer);
  const courseId = route?.params?.item?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      is_free: '',
      order: '',
    },
  });

  const requestVideoPermission = async () => {
    if (Platform.OS === 'android') {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleVideoSelect = async () => {
    try {
      const hasPermission = await requestVideoPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission denied',
          text2: 'Please allow video access in settings',
          position: 'bottom',
        });
        return;
      }

      const response = await pick({
        type: [types.video],
        allowMultiSelection: false,
      });

      if (response?.length > 0) {
        const video = response[0];
        setSelectedVideo(video);
        Toast.show({
          type: 'success',
          text1: 'Video Selected',
          text2: video.name || '1 video selected',
          position: 'bottom',
        });
      }
    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;
      Toast.show({
        type: 'error',
        text1: 'Error selecting video',
        text2: err.message || 'Something went wrong',
        position: 'bottom',
      });
    }
  };

  // 🔹 Main form submit + video upload
  const onSubmit = async (data: any) => {
    if (!selectedVideo) {
      Toast.show({
        type: 'error',
        text1: 'Please select a video before submitting',
        position: 'bottom',
      });
      return;
    }

    try {
      setLoading(true);

      const res = await dispatch(
        createVideoUpload({
          courseId: courseId,
          body: {
            title: data.title,
            description: data.description,
            is_free: data.is_free,
            order: data.order,
          },
        }),
      ).unwrap();

      const uploadUrl = res?.upload_url;
      const videoId = res?.video?.id;
      if (!uploadUrl || !videoId) {
        throw new Error('Invalid upload URL or video ID');
      }

      setUploading(true);
      setUploadProgress(0);

      const fileBlob = await fetch(selectedVideo.uri).then(response => {
        if (!response.ok) throw new Error('Failed to read video file');
        return response.blob();
      });

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'video/mp4');
      xhr.timeout = 600000;

      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          Toast.show({
            type: 'success',
            text1: 'Video uploaded successfully',
            position: 'bottom',
          });
          reset();
          setSelectedVideo(null);
          setTimeout(onClose, 1000);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Upload failed',
            text2: `Status ${xhr.status}`,
            position: 'bottom',
          });
        }
      };

      xhr.onerror = () => {
        Toast.show({
          type: 'error',
          text1: 'Upload error',
          text2: 'Network issue or invalid upload URL',
          position: 'bottom',
        });
      };

      xhr.send(fileBlob);
    } catch (error: any) {
      console.log('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: error.message || 'Something went wrong',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Add Course Video</Text>
        <TouchableOpacity
          onPress={!uploading ? onClose : undefined}
          style={[styles.closeButton, uploading && { opacity: 0.4 }]}
          disabled={uploading}
        >
          <X color={colors.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Video Title</Text>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'Title is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.inputField,
                errors.title && styles.errorBorder,
              ]}
              placeholder="Enter video title"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Select Video</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={!uploading ? handleVideoSelect : undefined}
          disabled={uploading}
        >
          <Video color={colors.primary} size={22} />
          <Text style={styles.uploadText}>
            {selectedVideo?.name || 'Tap to select video'}
          </Text>
        </TouchableOpacity>

        {uploading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        <Text style={styles.label}>Video Description</Text>
        <Controller
          name="description"
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.inputField,
                errors.description && styles.errorBorder,
              ]}
              placeholder="Enter video description"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Video Order</Text>
        <Controller
          name="order"
          control={control}
          rules={{ required: 'Order is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[
                styles.inputField,
                errors.order && styles.errorBorder,
              ]}
              placeholder="Enter order (e.g., 1, 2, 3)"
              keyboardType="numeric"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Text style={styles.label}>Is this Video Free?</Text>
        <Controller
          control={control}
          name="is_free"
          rules={{ required: 'Status is required' }}
          render={({ field: { onChange, value } }) => (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholder}
              selectedTextStyle={styles.selectedText}
              data={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ]}
              dropdownPosition="top"
              labelField="label"
              valueField="value"
              placeholder="Select option"
              value={value}
              onChange={item => onChange(item.value)}
            />
          )}
        />
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={!uploading ? onClose : undefined}
          disabled={loading || uploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (loading || uploading) && { opacity: 0.7 },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading || uploading}
        >
          {loading || uploading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CourseAddVideoModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeButton: { padding: 4 },
  modalContent: { padding: 20 },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  inputField: {
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: colors.white,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  uploadText: { marginLeft: 10, fontSize: 16, color: colors.textSecondary },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  progressText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  placeholder: { color: colors.borderColor },
  selectedText: { color: colors.primary, fontSize: 16 },
  errorBorder: { borderColor: 'red' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.text, fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
});
