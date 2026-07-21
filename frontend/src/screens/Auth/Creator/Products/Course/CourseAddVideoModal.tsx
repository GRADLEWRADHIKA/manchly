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
import { Video, X, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { aiCall } from '../../../../../utils/aiApi';
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
  const [aiView, setAiView] = useState<null | { field: string; label: string }>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const route = useRoute();
  const { token } = useSelector((state: any) => state.userReducer);
  const courseId = route?.params?.item?.id;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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
          position: 'top',
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
          position: 'top',
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
          position: 'top',
        });
      }
    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;
      Toast.show({
        type: 'error',
        text1: 'Error selecting video',
        text2: err.message || 'Something went wrong',
        position: 'top',
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
        position: 'top',
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
        position: 'top',
      });
    } catch (err) {
      console.error('Thumbnail Upload Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Thumbnail upload failed',
        text2: 'Please try again',
        position: 'top',
      });
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleEnhance = async (field: string, label: string) => {
    const text = watch(field as any);
    console.log('[AI] Enhance pressed, field:', field, 'text:', text);
    if (!text || text.trim().length < 3) {
      setAiWarning(field);
      setTimeout(() => setAiWarning(null), 3000);
      return;
    }
    setAiWarning(null);
    setAiView({ field, label });
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const kind = field === 'title' ? 'headline' : 'description';
      const res = await aiCall<any>('ai/course/enhance', { text, kind, tone: 'conversational' });
      console.log('[AI] Response:', JSON.stringify(res));
      setAiSuggestion(res);
    } catch (err: any) {
      console.log('[AI] Error:', err?.message, err?.response?.data);
      Toast.show({ type: 'error', text1: 'Failed to enhance', position: 'top' });
      setAiView(null);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAi = (text: string) => {
    if (aiView) {
      setValue(aiView.field as any, text);
    }
    setAiView(null);
    setAiSuggestion(null);
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
        position: 'top',
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
        position: 'top',
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
        position: 'top',
      });
    } finally {
      setIsModalVisible(false);
      setLoading(false);
    }
  };

  // AI view — replaces form content
  if (aiView) {
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => { setAiView(null); setAiSuggestion(null); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}
          >
            <ArrowLeft color={colors.white} size={wp(20)} />
            <Text style={styles.modalTitle}>Enhance {aiView.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.white} size={wp(22)} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {aiLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: hp(40), gap: hp(12) }}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: fp(14) }}>Enhancing your {aiView.label.toLowerCase()}...</Text>
            </View>
          ) : aiSuggestion ? (
            <>
              <View style={styles.aiOriginalBlock}>
                <Text style={styles.aiSectionLabel}>Original</Text>
                <Text style={styles.aiOriginalText}>{aiSuggestion.original}</Text>
              </View>

              <View style={styles.aiEnhancedBlock}>
                <Text style={styles.aiEnhancedLabel}>Enhanced</Text>
                <Text style={styles.aiEnhancedText}>{aiSuggestion.enhanced}</Text>
                <TouchableOpacity style={styles.aiUseBtn} onPress={() => acceptAi(aiSuggestion.enhanced)}>
                  <Text style={styles.aiUseBtnText}>Use this</Text>
                  <ArrowRight size={wp(14)} color={colors.white} />
                </TouchableOpacity>
              </View>

              {aiSuggestion.changes_summary ? (
                <Text style={styles.aiSummary}>{aiSuggestion.changes_summary}</Text>
              ) : null}

              {aiSuggestion.alternatives?.length > 0 && (
                <>
                  <Text style={styles.aiAltLabel}>Alternatives</Text>
                  {aiSuggestion.alternatives.map((alt: string, i: number) => (
                    <TouchableOpacity key={i} style={styles.aiAltChip} onPress={() => acceptAi(alt)}>
                      <Text style={styles.aiAltText}>{alt}</Text>
                      <ArrowRight size={wp(12)} color={'#60A5FA'} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <TouchableOpacity
                style={styles.aiKeepBtn}
                onPress={() => { setAiView(null); setAiSuggestion(null); }}
              >
                <Text style={styles.aiKeepBtnText}>Keep original</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {isUpdate ? 'Update Video' : 'Add Course Video'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color={colors.white} size={wp(22)} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Video Title */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Video Title</Text>
          <TouchableOpacity style={styles.enhanceBtn} onPress={() => handleEnhance('title', 'Title')}>
            <Sparkles size={wp(12)} color={'#60A5FA'} />
            <Text style={styles.enhanceBtnText}>Enhance</Text>
          </TouchableOpacity>
        </View>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'Title is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[styles.inputField, errors.title && styles.errorBorder]}
              placeholder="Enter video title"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
        {aiWarning === 'title' && (
          <Text style={styles.warningText}>Type at least 3 characters to enhance</Text>
        )}

        {/* Video Picker */}
        {!isUpdate && (
          <>
            <Text style={[styles.label, { marginTop: hp(12), marginBottom: hp(6) }]}>Select Video</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleVideoSelect}>
              <Video color={colors.gold} size={wp(22)} />
              <Text style={styles.uploadText}>
                {selectedVideo?.name || 'Tap to select video'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Description */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Video Description</Text>
          <TouchableOpacity style={styles.enhanceBtn} onPress={() => handleEnhance('description', 'Description')}>
            <Sparkles size={wp(12)} color={'#60A5FA'} />
            <Text style={styles.enhanceBtnText}>Enhance</Text>
          </TouchableOpacity>
        </View>
        <Controller
          name="description"
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[styles.inputField, errors.description && styles.errorBorder]}
              placeholder="Enter description"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
        {aiWarning === 'description' && (
          <Text style={styles.warningText}>Type at least 3 characters to enhance</Text>
        )}

        {/* Thumbnail */}
        <Text style={[styles.label, { marginTop: hp(12), marginBottom: hp(6) }]}>Choose Thumbnail</Text>
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
                  <ActivityIndicator color={colors.gold} />
                ) : (
                  <Text style={styles.buttonText}>
                    {value ? 'Change Thumbnail' : 'Choose Thumbnail'}
                  </Text>
                )}
              </TouchableOpacity>
              {value ? (
                <Image source={{ uri: value }} style={styles.imagePreview} resizeMode="cover" />
              ) : null}
            </View>
          )}
        />

        {/* Order */}
        <Text style={[styles.label, { marginTop: hp(12), marginBottom: hp(6) }]}>Video Order</Text>
        <Controller
          name="order"
          control={control}
          rules={{ required: 'Order is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              inputContainerStyle={[styles.inputField, errors.order && styles.errorBorder]}
              placeholder="Enter order (e.g., 1, 2, 3)"
              keyboardType="numeric"
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit(isUpdate ? onSubmitUpdate : onSubmit)}
        >
          <LinearGradient
            colors={['#F3C36B', '#D49A3D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>{isUpdate ? 'Update' : 'Save'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CourseAddVideoModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: wp(16),
  },
  modalTitle: { fontSize: fp(18), fontWeight: '700', color: colors.textPrimary },
  closeButton: { padding: wp(4) },
  modalContent: { padding: wp(20) },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(12),
    marginBottom: hp(6),
  },
  label: {
    fontSize: fp(13),
    color: colors.gold,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    height: hp(42),
    backgroundColor: colors.inputBg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(240,192,64,0.4)',
    borderWidth: 1,
    borderRadius: wp(12),
    borderStyle: 'dashed',
    height: hp(42),
    paddingHorizontal: wp(12),
    backgroundColor: 'rgba(240,192,64,0.08)',
  },
  uploadText: {
    marginLeft: wp(10),
    fontSize: fp(14),
    color: colors.textPrimary,
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
    color: colors.golden,
    fontWeight: '600',
  },
  dropdown: {
    height: hp(42),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(12),
    paddingHorizontal: wp(14),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  placeholder: { color: colors.textPrimary, fontSize: fp(14) },
  selectedText: { color: colors.textPrimary, fontSize: fp(14) },
  errorBorder: { borderColor: colors.cError },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(10),
    marginHorizontal: wp(20),
    marginBottom: hp(20),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: wp(12),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cancelButtonText: { color: colors.textPrimary, fontWeight: '600', fontSize: fp(14) },
  saveButton: {
    flex: 1,
    borderRadius: wp(12),
    overflow: 'hidden',
  },
  saveButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
  },
  saveButtonText: { color: colors.black, fontWeight: '700', fontSize: fp(14) },
  button: {
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    height: hp(42),
    width: '100%',
    backgroundColor: 'rgba(240,192,64,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.gold,
    fontSize: fp(14),
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: hp(150),
    borderRadius: wp(12),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  warningText: {
    fontSize: fp(11),
    color: '#F59E0B',
    marginTop: hp(4),
    fontWeight: '500',
  },

  // Enhance button
  enhanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(96,165,250,0.12)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  enhanceBtnText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#60A5FA',
  },

  // AI view styles
  aiOriginalBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(10),
    padding: wp(12),
    marginBottom: hp(12),
  },
  aiSectionLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: hp(4),
  },
  aiOriginalText: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(21),
  },
  aiEnhancedBlock: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: wp(10),
    padding: wp(12),
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
    marginBottom: hp(10),
  },
  aiEnhancedLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
    marginBottom: hp(4),
  },
  aiEnhancedText: {
    fontSize: fp(14),
    color: colors.textPrimary,
    lineHeight: fp(21),
    marginBottom: hp(10),
  },
  aiUseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: wp(6),
    backgroundColor: '#60A5FA',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(10),
  },
  aiUseBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
  },
  aiSummary: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    marginBottom: hp(12),
    lineHeight: fp(18),
  },
  aiAltLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: hp(6),
  },
  aiAltChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: hp(8),
  },
  aiAltText: {
    flex: 1,
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: fp(19),
    marginRight: wp(8),
  },
  aiKeepBtn: {
    alignItems: 'center',
    paddingVertical: hp(12),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: hp(8),
  },
  aiKeepBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
});
