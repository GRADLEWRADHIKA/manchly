import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  PermissionsAndroid,
  Platform,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Play, BookOpen, Users, Award, TrendingUp, X } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import KycCard from '../../Home/KeyCard';
import AppHeader from '../../../../components/AppHeader';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { createCourse, fetchCourses } from '../../../../store/CourseSlice';
import { updateCourse, deleteCourse } from '../../../../store/CourseSlice';
import { createVideoUpload, checkVideoStatus as checkVideoStatusAPI, updateVideo, deleteVideo } from '../../../../store/VideoSlice';
import DocumentPicker, { pick, types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const [active, setActive] = useState(true);
  const { token } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const courses = useSelector((s: any) => s.coursesReducer.list);
  const loading = useSelector((s: any) => s.coursesReducer.loading);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const [activeUploads, setActiveUploads] = useState<Record<string, {
    progress: number;
    processingText: string | null;
    pollTimer: any;
    xhr?: XMLHttpRequest;
    videoId?: string;
  }>>({});
  const pollTimersRef = useRef<Record<string, any>>({});

  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    is_free: false,
    order: 1,
  });
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [showEditVideoForm, setShowEditVideoForm] = useState(false);
  const [editVideoForm, setEditVideoForm] = useState({
    title: '',
    description: '',
    is_free: false,
    order: 1,
  });

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 10 }));
  }, [dispatch]);

  const onCreateCourse = async () => {
    if (!title.trim()) return;
    const result = await dispatch(
      createCourse({
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        category: category.trim() || 'General',
        level,
        status,
      }),
    );
    
    // Refresh course list after creation
    if (createCourse.fulfilled.match(result)) {
      await dispatch(fetchCourses({ page: 1, limit: 10 }));
    }
    
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
  };

  const clearPoll = (videoId: string) => {
    if (pollTimersRef.current[videoId]) {
      clearInterval(pollTimersRef.current[videoId]);
      delete pollTimersRef.current[videoId];
    }
  };

  const startPollingStatus = (videoId: string, uploadKey: string) => {
    if (!videoId || videoId === '') {
      console.error('Cannot start polling: videoId is missing');
      return;
    }
    
    const videoIdStr = String(videoId);
    clearPoll(videoIdStr);
    
    console.log('Starting polling for videoId:', videoIdStr, 'uploadKey:', uploadKey);
    
    let retryCount = 0;
    const maxRetries = 60; // 5 minutes max (60 * 5 seconds)
    const max404Retries = 5; // Stop after 5 consecutive 404s
    
    let consecutive404s = 0;
    let isStopped = false; // Flag to prevent further polling
    
    // Start polling immediately (don't wait for first interval)
    const pollOnce = async () => {
      // Stop if polling was already stopped
      if (isStopped) {
        console.log('Polling already stopped, skipping poll');
        return;
      }
      
      try {
        retryCount++;
        console.log(`Polling video status (attempt ${retryCount}/${maxRetries}):`, videoIdStr);
        
        const status = await dispatch(checkVideoStatusAPI(videoIdStr)).unwrap();
        consecutive404s = 0; // Reset 404 counter on success
        
        // Check multiple possible state fields (case-insensitive)
        const stateRaw = status?.state || status?.status || status?.current_video_status || status?.video_status;
        const state = stateRaw ? String(stateRaw).toUpperCase().trim() : null;
        console.log('Video status received (raw):', stateRaw, 'normalized:', state);
        console.log('Full status response:', JSON.stringify(status, null, 2));
        
        if (state) {
          const statusText = state === 'UPLOADING' ? 'Uploading to server...' :
                             state === 'PROCESSING' ? 'Processing video...' :
                             state === 'READY' ? 'Video ready!' :
                             state === 'ERROR' ? 'Processing failed' :
                             `Status: ${state}`;
          
          setActiveUploads(prev => ({
            ...prev,
            [uploadKey]: { 
              ...prev[uploadKey], 
              progress: 100, // Keep at 100% during processing
              processingText: statusText 
            }
          }));
        }
        
        // Check if ready (case-insensitive)
        if (state === 'READY') {
          console.log('✅ Video is READY! Stopping polling immediately');
          isStopped = true; // Set flag to stop further polling
          clearPoll(videoIdStr); // Clear the interval
          setActiveUploads(prev => {
            const updated = { ...prev };
            delete updated[uploadKey];
            return updated;
          });
          Toast.show({ 
            type: 'success', 
            text1: 'Video processing complete', 
            position: 'bottom' 
          });
          // Refresh courses list to show the new video with READY status
          dispatch(fetchCourses({ page: 1, limit: 10 }));
          return;
        }
        
        if (state === 'ERROR') {
          console.log(' Video status is ERROR! Stopping polling');
          isStopped = true;
          clearPoll(videoIdStr);
          setActiveUploads(prev => {
            const updated = { ...prev };
            delete updated[uploadKey];
            return updated;
          });
          Toast.show({ 
            type: 'error', 
            text1: 'Video processing failed', 
            position: 'bottom' 
          });
          return;
        }
        
        // Stop polling after max retries
        if (retryCount >= maxRetries) {
          console.log('⏱️ Max retries reached, stopping polling');
          isStopped = true; // Set flag to stop further polling
          clearPoll(videoIdStr);
          setActiveUploads(prev => {
            const updated = { ...prev };
            delete updated[uploadKey];
            return updated;
          });
          Toast.show({ 
            type: 'info', 
            text1: 'Video is still processing', 
            text2: 'Check back later',
            position: 'bottom' 
          });
          return;
        }
      } catch (e: any) {
        console.log('Polling error:', e);
        const statusCode = e?.response?.status || e?.status;
        
        // Handle 404 errors specifically
        if (statusCode === 404) {
          consecutive404s++;
          console.log(`Video not found (404). Consecutive 404s: ${consecutive404s}`);
          
          if (consecutive404s >= max404Retries) {
            console.log('❌ Max 404 retries reached, stopping polling');
            isStopped = true; // Set flag to stop further polling
            clearPoll(videoIdStr);
            setActiveUploads(prev => {
              const updated = { ...prev };
              delete updated[uploadKey];
              return updated;
            });
            Toast.show({ 
              type: 'error', 
              text1: 'Video upload issue', 
              text2: 'Video was not registered properly. Please try again.',
              position: 'bottom' 
            });
            return;
          }
          
          // For first few 404s, wait longer before next poll (video might still be processing)
          if (consecutive404s === 1) {
            console.log('Waiting 10 seconds before retry...');
            // Don't increment retry count on first 404
          }
        } else {
          // Reset 404 counter for non-404 errors
          consecutive404s = 0;
        }
        
        // Stop polling after max retries even with errors
        if (retryCount >= maxRetries) {
          console.log('⏱️ Max retries reached with errors, stopping polling');
          isStopped = true; // Set flag to stop further polling
          clearPoll(videoIdStr);
          setActiveUploads(prev => {
            const updated = { ...prev };
            delete updated[uploadKey];
            return updated;
          });
          return;
        }
      }
    };
    
    // Poll immediately, then every 5 seconds
    pollOnce();
    pollTimersRef.current[videoIdStr] = setInterval(pollOnce, 5000);
    
    console.log('Polling timer set for videoId:', videoIdStr);
  };

  const handleAddVideo = async (course: any) => {
    // Set selected course and show form
    setSelectedCourse(course);
    const defaultOrder = course?.videos?.length ? course.videos.length + 1 : 1;
    setVideoForm({
      title: '',
      description: '',
      is_free: false,
      order: defaultOrder,
    });
    setShowVideoForm(true);
  };

  const handleVideoFileSelect = async () => {
    if (!selectedCourse) return;

    try {
      // Runtime permission for Android
      if (Platform.OS === 'android') {
        // Android 13+ (API 33+) uses READ_MEDIA_VIDEO, older versions use READ_EXTERNAL_STORAGE
        const permission = Platform.Version >= 33
          ? ('android.permission.READ_MEDIA_VIDEO' as any)
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        // Check if already granted
        const checkResult = await PermissionsAndroid.check(permission as any);
        if (!checkResult) {
          const granted = await PermissionsAndroid.request(permission as any, {
            title: 'Video Access Permission',
            message: 'This app needs access to your videos to upload course content.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          });
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Toast.show({ 
              type: 'error', 
              text1: 'Permission denied', 
              text2: 'Please grant video access permission in app settings.',
              position: 'bottom' 
            });
            return;
          }
        }
      }

      Toast.show({ type: 'info', text1: 'Opening video picker…', position: 'bottom' });
      const result = await pick({
        type: [types.video],
      });
      
      if (!result || result.length === 0) {
        setShowVideoForm(false);
        return;
      }
      
      const file = result[0];

      // Save course ID and form data before closing modal
      const courseId = String(selectedCourse?.id || selectedCourse?._id);
      const videoTitle = videoForm.title.trim() || (file.name || 'New Video').replace(/\.[^.]+$/, '');
      const videoDescription = videoForm.description.trim() || '';
      const videoIsFree = videoForm.is_free;
      const videoOrder = Number(videoForm.order) || 1;

      // Close modal immediately after video is selected
      setShowVideoForm(false);
      setSelectedCourse(null);
      setVideoForm({ title: '', description: '', is_free: false, order: 1 });
      
      const res = await dispatch(createVideoUpload({
        courseId: courseId,
        body: { 
          title: videoTitle, 
          description: videoDescription, 
          is_free: videoIsFree, 
          order: videoOrder 
        },
      })).unwrap();

      const uploadUrl = res?.upload_url || res?.uploadUrl;
      const video = res?.video || res;
      const videoId = String(video?.id || video?._id || res?.video_id || res?.videoId || '');
    
      
      if (!videoId || videoId === '') {
        console.error('No video ID found in response:', res);
        Toast.show({ 
          type: 'error', 
          text1: 'Missing video ID', 
          text2: 'Could not get video ID from server response',
          position: 'bottom' 
        });
        return;
      }
      
      if (!uploadUrl) {
        Toast.show({ type: 'error', text1: 'No upload URL received', position: 'bottom' });
        return;
      }

      // Refresh courses immediately to show the new video in the list
      dispatch(fetchCourses({ page: 1, limit: 10 }));

      // Use videoId as the upload key so it matches when displaying progress
      const uploadKey = videoId;
      
      // Upload using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Store videoId in closure to ensure it's accessible in event handlers
      const currentVideoId = String(videoId);
      
      setActiveUploads(prev => ({
        ...prev,
        [uploadKey]: { 
          progress: 0, 
          processingText: 'Preparing upload...', 
          pollTimer: null,
          xhr: xhr,
          videoId: currentVideoId
        }
      }));
      
      // Read file as blob for upload
      console.log('Reading file as blob...');
      const fileBlob = await fetch(file.uri).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.status}`);
        }
        return response.blob();
      });
      
      console.log('File blob size:', fileBlob.size);
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && e.total > 0) {
            // Cap progress at 100%
            const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
            setActiveUploads(prev => ({
              ...prev,
              [uploadKey]: { ...prev[uploadKey], progress: percent, processingText: `Uploading: ${percent}%` }
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload to Mux successful (100%), starting status polling for videoId:', currentVideoId);
            // Set to 100% on completion - upload to Mux is complete
            setActiveUploads(prev => ({
              ...prev,
              [uploadKey]: { 
                ...prev[uploadKey], 
                progress: 100, 
                processingText: 'Upload complete, processing...',
                xhr: undefined
              }
            }));
            
            // Start polling immediately after upload reaches 100%
            if (currentVideoId && currentVideoId !== '') {
              console.log('Starting polling with videoId:', currentVideoId, 'uploadKey:', uploadKey);
              startPollingStatus(currentVideoId, uploadKey);
            } else {
              console.error('Cannot start polling: videoId is missing or empty');
            }
            
            // Refresh courses list to show updated video status
            dispatch(fetchCourses({ page: 1, limit: 10 }));
            
            Toast.show({ type: 'success', text1: 'Video uploaded to Mux successfully', position: 'bottom' });
            resolve();
          } else {
            console.log('Upload failed:', xhr.status, xhr.responseText);
            // Update active uploads to show error
            setActiveUploads(prev => ({
              ...prev,
              [uploadKey]: { 
                ...prev[uploadKey], 
                progress: 0, 
                processingText: 'Upload failed',
                xhr: undefined
              }
            }));
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText || 'Unknown error'}`));
          }
        });

        xhr.addEventListener('error', (error) => {
          console.log('XHR error:', error);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'));
        });

        xhr.open('PUT', uploadUrl);
        // Mux expects the video file directly as binary
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        // Don't set any other headers - Mux handles authentication via URL
        xhr.timeout = 600000; // 10 minutes timeout for large files
        xhr.send(fileBlob);
      });
    } catch (e: any) {
      console.log('Video upload error:', e);
      const errorMsg = e?.message || e?.response?.data?.message || 'Failed to add video';
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to add video', 
        text2: errorMsg,
        position: 'bottom' 
      });
      // Clean up any active uploads for this course if error occurred during setup
      // Note: courseId might not be defined if error occurred before file selection
      if (selectedCourse) {
        const errorCourseId = String(selectedCourse?.id || selectedCourse?._id);
        setActiveUploads(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (key.startsWith(errorCourseId + '_')) {
              delete updated[key];
            }
          });
          return updated;
        });
      }
    }
  };

  // Inline edit/delete for courses
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const beginEdit = (item: any) => {
    const id = String(item?.id || item?._id);
    setEditingId(id);
    setEditTitle(item?.title || '');
    setEditDescription(item?.description || '');
    setEditPrice(String(item?.price ?? ''));
    setEditStatus(item?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await dispatch(updateCourse({
      id: editingId,
      body: {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: Number(editPrice) || 0,
        status: editStatus,
      },
    }));
    setEditingId(null);
    dispatch(fetchCourses({ page: 1, limit: 10 }));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const removeCourse = async (id: string) => {
    await dispatch(deleteCourse(id));
    dispatch(fetchCourses({ page: 1, limit: 10 }));
  };

  const cancelUpload = async (uploadKey: string) => {
    const upload = activeUploads[uploadKey];
    const videoId = upload?.videoId;
    
    // Abort the upload if in progress
    if (upload?.xhr) {
      upload.xhr.abort();
    }
    
    // Clear polling if active
    if (videoId && pollTimersRef.current[videoId]) {
      clearPoll(videoId);
    }
    
    // Delete the video from backend if it exists
    if (videoId) {
      try {
        await dispatch(deleteVideo(videoId));
      } catch (e) {
        console.log('Error deleting video on cancel:', e);
      }
    }
    
    // Remove from active uploads
    setActiveUploads(prev => {
      const updated = { ...prev };
      delete updated[uploadKey];
      return updated;
    });
    
    // Refresh courses to update video array
    dispatch(fetchCourses({ page: 1, limit: 10 }));
    
    Toast.show({ type: 'info', text1: 'Upload cancelled', position: 'bottom' });
  };

  const checkVideoStatus = async (videoId: string, uploadKey?: string) => {
    try {
      const status = await dispatch(checkVideoStatusAPI(videoId)).unwrap();
      const state = status?.state || status?.status;
      const statusText = state === 'UPLOADING' ? 'Uploading to server...' :
                         state === 'PROCESSING' ? 'Processing video...' :
                         state === 'READY' ? 'Video ready!' :
                         state === 'ERROR' ? 'Processing failed' :
                         `Status: ${state}`;
      
      // Update active uploads if uploadKey provided (for in-progress uploads)
      if (uploadKey && activeUploads[uploadKey]) {
        setActiveUploads(prev => ({
          ...prev,
          [uploadKey]: { 
            ...prev[uploadKey], 
            progress: 100,
            processingText: statusText 
          }
        }));
      }

      // Refresh courses to get updated video data
      dispatch(fetchCourses({ page: 1, limit: 10 }));
      
      Toast.show({ 
        type: 'success', 
        text1: `Status: ${statusText}`, 
        position: 'bottom' 
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to check status', position: 'bottom' });
    }
  };

  const deleteVideoHandler = async (videoId: string) => {
    try {
      await dispatch(deleteVideo(videoId));
      // Refresh courses to update the video list
      dispatch(fetchCourses({ page: 1, limit: 10 }));
      Toast.show({ 
        type: 'success', 
        text1: 'Video deleted successfully', 
        position: 'bottom' 
      });
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to delete video', 
        position: 'bottom' 
      });
    }
  };

  const updateVideoStatus = async (videoId: string, status: string) => {
    try {
      await dispatch(updateVideo({ 
        videoId, 
        body: { status } 
      }));
      // Refresh courses to get updated video data
      dispatch(fetchCourses({ page: 1, limit: 10 }));
      Toast.show({ 
        type: 'success', 
        text1: 'Video status updated', 
        position: 'bottom' 
      });
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to update status', 
        position: 'bottom' 
      });
    }
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setEditVideoForm({
      title: video?.title || '',
      description: video?.description || '',
      is_free: video?.is_free ?? false,
      order: video?.order || 1,
    });
    setShowEditVideoForm(true);
  };

  const handleSaveVideoEdit = async () => {
    if (!editingVideo) return;

    try {
      await dispatch(updateVideo({
        videoId: editingVideo?.id || editingVideo?._id,
        body: {
          title: editVideoForm.title.trim(),
          description: editVideoForm.description.trim() || '',
          is_free: editVideoForm.is_free,
          order: Number(editVideoForm.order) || 1,
        },
      }));
      
      // Refresh courses to get updated video data
      dispatch(fetchCourses({ page: 1, limit: 10 }));
      
      // Close modal and reset
      setShowEditVideoForm(false);
      setEditingVideo(null);
      setEditVideoForm({ title: '', description: '', is_free: false, order: 1 });
      
      Toast.show({
        type: 'success',
        text1: 'Video updated successfully',
        position: 'bottom',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update video',
        position: 'bottom',
      });
    }
  };

  const quickStats = [
    {
      label: 'Active Courses',
      value: '12',
      icon: <BookOpen size={24} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '5.2K',
      icon: <Users size={24} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '94%',
      icon: <Award size={24} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹12.5K',
      icon: <TrendingUp size={24} color={colors.golden} />,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <RNStatusBar barStyle="light-content" />
      <AppHeader title="Manchly" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            A Manch for every Creator...
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {active ? (
              <KycCard />
            ) : (
              quickStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={styles.statIcon}>{stat.icon}</View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your Courses</Text>
          <FlatList
            data={courses}
            keyExtractor={(item: any, idx) => String(item?.id || item?._id || idx)}
            refreshing={loading}
            onRefresh={() => dispatch(fetchCourses({ page: 1, limit: 10 }))}
            renderItem={({ item }: any) => (
              <View style={styles.courseCard}>
                <View style={{ flex: 1 }}>
                  {editingId === String(item?.id || item?._id) ? (
                    <>
                      <TextInput
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Title"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.input}
                      />
                      <TextInput
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder="Description"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { height: 70 }]}
                        multiline
                      />
                      <View style={{ flexDirection: 'row' }}>
                        <TextInput
                          value={editPrice}
                          onChangeText={setEditPrice}
                          placeholder="Price"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="decimal-pad"
                          style={[styles.input, { flex: 1, marginRight: 8 }]}
                        />
                        <TouchableOpacity
                          onPress={() => setEditStatus(prev => (prev === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'))}
                          style={[styles.pill, { backgroundColor: `${colors.secondary}15` }]}
                        >
                          <Text style={styles.pillText}>Status: {editStatus}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginRight: 8 }]} onPress={saveEdit}>
                          <Text style={styles.primaryBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.pill, { flex: 1, backgroundColor: '#eee' }]} onPress={cancelEdit}>
                          <Text style={styles.pillText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.courseTitle}>{item?.title}</Text>
                      <Text style={styles.courseMeta} numberOfLines={2}>{item?.description}</Text>
                      <Text style={styles.courseMeta}>Price: {item?.price ?? 0}</Text>
                    </>
                  )}
                  <View style={{ height: 8 }} />
                  <TouchableOpacity onPress={() => handleAddVideo(item)} style={[styles.pill, { backgroundColor: `${colors.primary}15`, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.pillText, { color: colors.primary }]}>Add Video</Text>
                  </TouchableOpacity>
                  {editingId !== String(item?.id || item?._id) && (
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity onPress={() => beginEdit(item)} style={[styles.pill, { backgroundColor: '#eee' }]}>
                        <Text style={styles.pillText}>Edit</Text>
                      </TouchableOpacity>
                      <View style={{ width: 8 }} />
                      <TouchableOpacity onPress={() => removeCourse(String(item?.id || item?._id))} style={[styles.pill, { backgroundColor: '#fdecef' }]}>
                        <Text style={[styles.pillText, { color: '#d00' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {item?.videos && item.videos.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.courseMeta, { fontWeight: '700', marginBottom: 8 }]}>
                        Videos ({item.videos.length})
                      </Text>
                      {item.videos.map((video: any) => {
                        const videoStatus = video?.status || video?.current_video_status;
                        const isReady = videoStatus === 'READY';
                        const isUploading = videoStatus === 'UPLOADING';
                        const isProcessing = videoStatus === 'PROCESSING';
                        const hasError = videoStatus === 'ERROR';
                        
                        const videoId = String(video?.id || video?._id);
                        const activeUpload = activeUploads[videoId];
                        const showUploadProgress = activeUpload && (activeUpload.progress < 100 || activeUpload.progress === 100);
                        
                        return (
                          <View key={video?.id} style={styles.videoCard}>
                            <View style={styles.videoThumbnailContainer}>
                              {isReady && video?.thumbnail_url ? (
                                <Image 
                                  source={{ uri: video.thumbnail_url }} 
                                  style={styles.videoThumbnail}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={[styles.videoThumbnail, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                                  <Text style={{ color: colors.textSecondary, fontSize: 24 }}>📹</Text>
                                </View>
                              )}
                              {isReady && (
                                <View style={styles.playButton}>
                                  <Play size={16} color="#fff" />
                                </View>
                              )}
                            </View>
                            
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.videoTitle} numberOfLines={1}>{video?.title || 'Untitled Video'}</Text>
                              <Text style={styles.courseMeta}>
                                {video?.duration ? `${video.duration}s` : 'N/A'}
                              </Text>
                              
                              {showUploadProgress && (
                                <View style={{ marginTop: 8, marginBottom: 4 }}>
                                  {activeUpload.progress < 100 && (
                                    <>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <View style={{ flex: 1 }}>
                                          <View style={styles.progressBarTrack}>
                                            <View style={[styles.progressBarFill, { width: `${activeUpload.progress}%` }]} />
                                          </View>
                                          <Text style={styles.courseMeta}>
                                            Uploading: {activeUpload.progress}%
                                          </Text>
                                        </View>
                                        {activeUpload.xhr && (
                                          <TouchableOpacity 
                                            onPress={() => {
                                              cancelUpload(videoId);
                                            }}
                                            style={[styles.pill, { backgroundColor: '#f44336', marginLeft: 8 }]}
                                          >
                                            <Text style={[styles.pillText, { color: '#fff' }]}>Cancel</Text>
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                    </>
                                  )}
                                  {activeUpload.progress === 100 && (
                                    <>
                                      <View style={styles.progressBarTrack}>
                                        <View style={[
                                          styles.progressBarFill, 
                                          { 
                                            width: '100%',
                                            backgroundColor: isReady ? '#4caf50' : hasError ? '#f44336' : colors.primary 
                                          }
                                        ]} />
                                      </View>
                                      <Text style={[
                                        styles.courseMeta,
                                        { 
                                          fontWeight: '600',
                                          color: isReady ? '#4caf50' : hasError ? '#f44336' : colors.text,
                                          marginTop: 4
                                        }
                                      ]}>
                                        {activeUpload.processingText || 'Processing...'}
                                      </Text>
                                    </>
                                  )}
                                </View>
                              )}
                              
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: showUploadProgress ? 8 : 4 }}>
                                <View style={[
                                  styles.videoStatusBadge,
                                  { 
                                    backgroundColor: isReady ? '#4caf50' : hasError ? '#f44336' : `${colors.primary}20`
                                  }
                                ]}>
                                  <Text style={[
                                    styles.videoStatusText,
                                    { color: isReady ? '#fff' : hasError ? '#fff' : colors.primary }
                                  ]}>
                                    {videoStatus || 'UNKNOWN'}
                                  </Text>
                                </View>
                                
                                {(isUploading || isProcessing) && !showUploadProgress && (
                                  <TouchableOpacity 
                                    onPress={() => {
                                      if (video?.id) {
                                        checkVideoStatus(video.id);
                                      }
                                    }}
                                    style={{ marginLeft: 8 }}
                                  >
                                    <Text style={[styles.pillText, { color: colors.primary, fontSize: 11 }]}>
                                      Check Status
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                              
                              {isReady && video?.playback_url && (
                                <TouchableOpacity 
                                  onPress={() => {
                                    console.log('Playback URL:', video.playback_url);
                                  }}
                                  style={{ marginTop: 4 }}
                                >
                                  <Text style={[styles.courseMeta, { color: colors.primary }]} numberOfLines={1}>
                                    {video.playback_url}
                                  </Text>
                                </TouchableOpacity>
                              )}
                              
                              {hasError && (
                                <Text style={[styles.courseMeta, { color: '#f44336', marginTop: 4 }]}>
                                  Upload failed
                                </Text>
                              )}

                              <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                                <TouchableOpacity
                                  onPress={() => handleEditVideo(video)}
                                  style={[styles.videoActionBtn, { backgroundColor: `${colors.primary}15`, marginRight: 8, marginBottom: 4 }]}
                                >
                                  <Text style={[styles.videoActionText, { color: colors.primary }]}>
                                    Edit
                                  </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  onPress={() => deleteVideoHandler(video?.id || video?._id)}
                                  style={[styles.videoActionBtn, { backgroundColor: '#f44336', marginRight: 8, marginBottom: 4 }]}
                                >
                                  <Text style={[styles.videoActionText, { color: '#fff' }]}>Delete</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${(item?.status === 'PUBLISHED' ? colors.primary : colors.textSecondary)}20` }] }>
                  <Text style={{ color: item?.status === 'PUBLISHED' ? colors.primary : colors.textSecondary, fontWeight: '600' }}>{item?.status || 'DRAFT'}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={!loading ? (
              <Text style={{ color: colors.textSecondary }}>No courses yet.</Text>
            ) : null}
          />
        </View> */}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRight]}
              onPress={() => navigation.navigate('CreateWebinar')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Play size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Start Live</Text>
              <Text style={styles.actionSubtitle}>Go live instantly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateCourse')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.secondary}20` },
                ]}
              >
                <BookOpen size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>Create Course</Text>
              <Text style={styles.actionSubtitle}>Build new content</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Video Form Modal */}
      <Modal
        visible={showVideoForm}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowVideoForm(false);
          setSelectedCourse(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Video</Text>
            
            <TextInput
              placeholder="Video Title"
              placeholderTextColor={colors.textSecondary}
              value={videoForm.title}
              onChangeText={(text) => setVideoForm(prev => ({ ...prev, title: text }))}
              style={styles.input}
            />
            
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={videoForm.description}
              onChangeText={(text) => setVideoForm(prev => ({ ...prev, description: text }))}
              style={[styles.input, { height: 80 }]}
              multiline
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.courseMeta, { flex: 1 }]}>Free Video</Text>
              <Switch
                value={videoForm.is_free}
                onValueChange={(value) => setVideoForm(prev => ({ ...prev, is_free: value }))}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            
            <TextInput
              placeholder="Order (default: auto)"
              placeholderTextColor={colors.textSecondary}
              value={String(videoForm.order)}
              onChangeText={(text) => {
                const num = Number(text);
                if (!isNaN(num) && num > 0) {
                  setVideoForm(prev => ({ ...prev, order: num }));
                } else if (text === '') {
                  setVideoForm(prev => ({ ...prev, order: 1 }));
                }
              }}
              keyboardType="number-pad"
              style={styles.input}
            />
            
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowVideoForm(false);
                  setSelectedCourse(null);
                  setVideoForm({ title: '', description: '', is_free: false, order: 1 });
                }}
                style={[styles.pill, { flex: 1, backgroundColor: '#eee', marginRight: 8 }]}
              >
                <Text style={styles.pillText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleVideoFileSelect}
                style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
              >
                <Text style={styles.primaryBtnText}>Select Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Video Modal */}
      <Modal
        visible={showEditVideoForm}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditVideoForm(false);
          setEditingVideo(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Video</Text>
            
            <Text style={[styles.courseMeta, { marginBottom: 8, color: colors.textSecondary, fontStyle: 'italic' }]}>
              Note: Video file cannot be changed. Only metadata can be updated.
            </Text>
            
            <TextInput
              placeholder="Video Title"
              placeholderTextColor={colors.textSecondary}
              value={editVideoForm.title}
              onChangeText={(text) => setEditVideoForm(prev => ({ ...prev, title: text }))}
              style={styles.input}
            />
            
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={editVideoForm.description}
              onChangeText={(text) => setEditVideoForm(prev => ({ ...prev, description: text }))}
              style={[styles.input, { height: 80 }]}
              multiline
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.courseMeta, { flex: 1 }]}>Free Video</Text>
              <Switch
                value={editVideoForm.is_free}
                onValueChange={(value) => setEditVideoForm(prev => ({ ...prev, is_free: value }))}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            
            <TextInput
              placeholder="Order"
              placeholderTextColor={colors.textSecondary}
              value={String(editVideoForm.order)}
              onChangeText={(text) => {
                const num = Number(text);
                if (!isNaN(num) && num > 0) {
                  setEditVideoForm(prev => ({ ...prev, order: num }));
                } else if (text === '') {
                  setEditVideoForm(prev => ({ ...prev, order: 1 }));
                }
              }}
              keyboardType="number-pad"
              style={styles.input}
            />
            
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditVideoForm(false);
                  setEditingVideo(null);
                  setEditVideoForm({ title: '', description: '', is_free: false, order: 1 });
                }}
                style={[styles.pill, { flex: 1, backgroundColor: '#eee', marginRight: 8 }]}
              >
                <Text style={styles.pillText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveVideoEdit}
                style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
              >
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: colors.white },
  welcomeSection: { padding: 16, alignItems: 'center' },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  formSection: { padding: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderColor || '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },
  pill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 12,
  },
  pillText: { color: colors.text, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  listSection: { padding: 16 },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  courseTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  courseMeta: { fontSize: 12, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  actionsSection: { padding: 16 },
  actionsGrid: { flexDirection: 'row' },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionCardRight: { marginRight: 12 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  actionSubtitle: { fontSize: 12, color: colors.textSecondary },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderColor || '#eee',
  },
  videoThumbnailContainer: {
    position: 'relative',
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  videoStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  videoStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  videoActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  videoActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
});
