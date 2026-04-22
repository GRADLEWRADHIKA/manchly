import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Video, X } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../../../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import { pick, types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  createVideoUpload,
  updateVideo,
  addActiveUpload,
  updateUploadProgress,
  completeUpload,
  failUpload,
  removeUpload,
} from '../../../../../store/VideoSlice';
import { uploadShipDoc } from '../../../../../store/Common';
import BackgroundUploadService from '../../../../../services/BackgroundUploadService';

const CourseAddVideoModal = ({
  onClose,
  setRefresh,
  videoData,
  isUpdate,
  setIsModalVisible,
}) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false); // main submit
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
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
      title: videoData?.title || '',
      description: videoData?.description || '',
      is_free: false,
      order: String(videoData?.order ?? ''),
      thumbnail_url: videoData?.thumbnail_url || '',
    },
  });

  // 🔹 Update video
  const onSubmitUpdate = (data: any) => {
    setLoading(true);
    const payload = {
      videoId: videoData?.id,
      body: {
        title: data?.title,
        description: data?.description,
        is_free: false,
        order: data?.order,
        thumbnail_url: data?.thumbnail_url,
      },
    };
    dispatch(updateVideo(payload))
      .unwrap()
      .then(() => {
        reset();
        setRefresh((prev: boolean) => !prev);
        Toast.show({
          type: 'success',
          text1: 'Video updated successfully',
          position: 'bottom',
        });
        onClose();
        setIsModalVisible(false);
      })
      .catch(err => {
        console.error('Update Error:', err);
        setIsModalVisible(false);
        Toast.show({
          type: 'error',
          text1: 'Update failed',
          position: 'bottom',
        });
      })
      .finally(() => setLoading(false));
  };

  // 🔹 Pick a Video
  const handleVideoSelect = async () => {
    try {
      const response = await pick({
        type: [types.video],
        allowMultiSelection: false,
      });

      if (response?.length > 0) {
        const video = response[0];
        setSelectedVideo(video);
        Toast.show({
          type: 'success',
          text1: 'Video selected',
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

  // 🔹 Pick and upload thumbnail
  const imagePicker = async (onChange: (val: string) => void) => {
    try {
      const res = await pick({ type: [types.images] });
      if (!res || res.length === 0) return;

      const picked = {
        uri: res[0].uri,
        type: res[0].type,
        name: res[0].name,
      };

      await uploadThumbnail(picked, onChange);
    } catch (err: any) {
      console.error('Image Picker Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Image Picker Error',
        text2: 'Unable to pick image',
        position: 'bottom',
      });
    }
  };

  const uploadThumbnail = async (
    file: any,
    onChange: (val: string) => void,
  ) => {
    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });

      const res: any = await dispatch(uploadShipDoc(formData)).unwrap();
      const newUrl = res?.data?.url;
      onChange(newUrl);

      Toast.show({
        type: 'success',
        text1: 'Thumbnail uploaded successfully',
        position: 'bottom',
      });
    } catch (err) {
      console.error('Thumbnail Upload Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Thumbnail upload failed',
        text2: 'Please try again',
        position: 'bottom',
      });
    } finally {
      setThumbnailUploading(false);
    }
  };

  // 🔹 Submit and upload video in background
  const onSubmit = async (data: any) => {
    console.log('=== onSubmit called ===');
    console.log('selectedVideo:', JSON.stringify(selectedVideo, null, 2));
    console.log('courseId:', courseId);
    console.log('form data:', JSON.stringify(data, null, 2));

    if (!selectedVideo) {
      Toast.show({
        type: 'error',
        text1: 'Please select a video first',
        position: 'bottom',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('=== Calling createVideoUpload API ===');
      const res = await dispatch(
        createVideoUpload({
          courseId: courseId,
          body: {
            title: data.title,
            description: data.description,
            is_free: false,
            order: data.order,
            thumbnail_url: data?.thumbnail_url,
          },
        }),
      ).unwrap();

      console.log('=== createVideoUpload response ===', JSON.stringify(res, null, 2));

      const uploadUrl = res?.upload_url;
      const videoId = res?.video?.id;
      console.log('uploadUrl:', uploadUrl);
      console.log('videoId:', videoId);

      if (!uploadUrl || !videoId)
        throw new Error('Invalid upload URL or video ID');

      console.log('=== Starting background upload ===');
      console.log('fileUri:', selectedVideo.uri);
      console.log('uploadUrl:', uploadUrl);

      // Use a mutable ref so callbacks can access the uploadId after it resolves
      let resolvedUploadId: string | null = null;

      // Start background upload — modal closes immediately
      const uploadId = await BackgroundUploadService.startUpload({
        fileUri: selectedVideo.uri,
        uploadUrl: uploadUrl,
        videoTitle: data.title,
        onProgress: (progress) => {
          console.log('=== onProgress callback, uploadId:', resolvedUploadId, 'progress:', progress);
          if (resolvedUploadId) {
            dispatch(updateUploadProgress({ uploadId: resolvedUploadId, progress }));
          }
        },
        onComplete: () => {
          console.log('=== Background upload COMPLETE, uploadId:', resolvedUploadId);
          if (resolvedUploadId) {
            dispatch(completeUpload(resolvedUploadId));
            setTimeout(() => dispatch(removeUpload(resolvedUploadId!)), 3000);
          }
          setRefresh((prev: any) => !prev);
        },
        onError: (error) => {
          console.error('=== Background upload ERROR ===', error, 'uploadId:', resolvedUploadId);
          if (resolvedUploadId) {
            dispatch(failUpload({ uploadId: resolvedUploadId, error }));
            setTimeout(() => dispatch(removeUpload(resolvedUploadId!)), 5000);
          }
        },
      });

      // Now set the resolved ID so callbacks can use it
      resolvedUploadId = uploadId;
      console.log('=== Background upload started, uploadId:', uploadId);

      if (uploadId) {
        dispatch(addActiveUpload({
          uploadId,
          videoTitle: data.title,
          courseId,
        }));
      }

      Toast.show({
        type: 'info',
        text1: 'Video uploading in background',
        text2: 'You can continue using the app',
        position: 'bottom',
      });

      reset();
      setSelectedVideo(null);
      onClose();
    } catch (error: any) {
      console.error('=== Upload CATCH error ===', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', JSON.stringify(error?.response?.data, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: error.message || 'Something went wrong',
        position: 'bottom',
      });
    } finally {
      setIsModalVisible(false);
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {isUpdate ? 'Update Video' : 'Add Course Video'}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <X color={colors.text} size={wp(22)} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Title */}
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

        {/* Video Picker */}
        {!isUpdate && (
          <>
            <Text style={styles.label}>Select Video</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleVideoSelect}
            >
              <Video color={colors.primary} size={wp(22)} />
              <Text style={styles.uploadText}>
                {selectedVideo?.name || 'Tap to select video'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Description */}
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
              placeholder="Enter description"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        {/* Thumbnail Upload */}
        <Text style={styles.label}>Choose Thumbnail</Text>
        <Controller
          name="thumbnail_url"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View>
              <TouchableOpacity
                onPress={() => imagePicker(onChange)}
                style={styles.button}
                disabled={thumbnailUploading}
              >
                {thumbnailUploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.buttonText}>
                    {value ? 'Change Thumbnail' : 'Choose Thumbnail'}
                  </Text>
                )}
              </TouchableOpacity>

              {value ? (
                <Image
                  source={{ uri: value }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          )}
        />

        {/* Order */}
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

        {/* Free / Paid Dropdown */}
        {/* <Text style={styles.label}>Is this Video Free?</Text>
        <Controller
          control={control}
          name="is_free"
          rules={{ required: 'Status is required' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Dropdown
              style={[styles.dropdown, error && styles.errorBorder]}
              placeholderStyle={styles.placeholder}
              selectedTextStyle={styles.selectedText}
              data={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ]}
              labelField="label"
              valueField="value"
              placeholder="Select option"
              value={value}
              dropdownPosition="top"
              onChange={item => onChange(item.value)}
            />
          )}
        /> */}
      </ScrollView>

      {/* Footer */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            loading && { opacity: 0.7 },
          ]}
          disabled={loading}
          onPress={handleSubmit(isUpdate ? onSubmitUpdate : onSubmit)}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isUpdate ? 'Update' : 'Save'}
            </Text>
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
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: wp(1),
    borderColor: colors.border,
    padding: wp(16),
  },
  modalTitle: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  closeButton: { padding: wp(4) },
  modalContent: { padding: wp(20) },
  label: {
    fontSize: fp(14),
    color: colors.heading,
    fontWeight: '600',
    marginBottom: hp(6),
    marginTop: hp(12),
  },
  inputField: {
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    backgroundColor: colors.white,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.borderColor,
    borderWidth: wp(1),
    borderRadius: wp(8),
    height: hp(44),
    paddingHorizontal: wp(10),
    backgroundColor: colors.white,
  },
  uploadText: {
    marginLeft: wp(10),
    fontSize: fp(16),
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
    marginBottom: hp(4),
    gap: wp(10),
  },
  progressText: {
    fontSize: fp(14),
    color: colors.primary,
    fontWeight: '600',
  },
  dropdown: {
    height: hp(44),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(8),
    paddingHorizontal: wp(12),
    justifyContent: 'center',
  },
  placeholder: { color: colors.borderColor },
  selectedText: { color: colors.primary, fontSize: fp(16) },
  errorBorder: { borderColor: 'red' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(10),
    marginHorizontal: wp(20),
    marginBottom: hp(20),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(10),
    borderWidth: wp(1),
    borderColor: colors.border,
    borderRadius: wp(8),
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.text, fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: colors.white, fontWeight: '600', fontSize: fp(16) },
  button: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textSecondary,
    fontSize: fp(14),
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: hp(150),
    borderRadius: wp(8),
    marginTop: hp(10),
  },
});
