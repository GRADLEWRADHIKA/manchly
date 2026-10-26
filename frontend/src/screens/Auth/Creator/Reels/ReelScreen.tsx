import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useFocusEffect } from '@react-navigation/native';
import RNBlobUtil from 'react-native-blob-util';
import { Clapperboard, Plus, AlertCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  getMyReels,
  createReelUpload,
  updateReel,
  deleteReel,
} from '../../../../store/ReelSlice';
import { fetchCourses } from '../../../../store/CourseSlice';
import ReelTile from './components/ReelTitle';
import UploadReelModal from './components/UploadReelModal';
import { instance } from '../../../../utils/AxiosInstance';

const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const POLL_MS = 5000;
const MAX_POLLS = 60;

const ReelsScreen: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const { list: reels, loading } = useSelector(
    (state: any) => state.reelReducer,
  );
  const { list: courses } = useSelector((state: any) => state.coursesReducer);

  const [modalOpen, setModalOpen] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const pollTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    return () => Object.values(pollTimers.current).forEach(clearInterval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(getMyReels());
      dispatch(
        fetchCourses({ my_courses: true, status: 'ALL', page: 1, limit: 100 }),
      );
    }, [dispatch]),
  );

  const handleToggleHidden = (reel: any) => {
    const hide = reel.status === 'READY';
    dispatch(updateReel({ reelId: reel.id, body: { hidden: hide } }))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          text1: hide ? 'Reel hidden from the feed' : 'Reel is live again',
          position: 'top',
        });
      })
      .catch(() => {});
  };

  const handleDelete = (reel: any) => {
    Alert.alert(
      'Delete this reel?',
      'The video is removed and cannot be recovered. The course itself is untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteReel(reel.id));
          },
        },
      ],
    );
  };

const { user } = useSelector((state: any) => state.userReducer);

const safeCourses = Array.isArray(courses) ? courses : [];
const myCourses = safeCourses.filter(
  c => (c.creator_id ?? c.creator?.id) === user?.id,
);
const canCreateReel = myCourses.length > 0;

  const putWithProgress = (
    url: string,
    file: { uri: string; type: string; name: string },
    onPct: (pct: number) => void,
  ) =>
    new Promise<void>((resolve, reject) => {
      RNBlobUtil.fetch(
        'PUT',
        url,
        { 'Content-Type': file.type || 'video/mp4' },
        RNBlobUtil.wrap(file.uri),
      )
        .uploadProgress({ interval: 250 }, (written, total) => {
          if (total > 0) onPct(Math.round((written / total) * 100));
        })
        .then(res => {
          const status = res?.info()?.status;
          if (status && status >= 200 && status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed (${status})`));
          }
        })
        .catch(err =>
          reject(new Error(err?.message || 'Network error during upload')),
        );
    });

  const pollStatus = (reelId: string, key: string) => {
    let tries = 0;
    pollTimers.current[key] = setInterval(async () => {
      tries += 1;
      try {
        const res = await instance.get(`reels/${reelId}/status`);
        const status = res.data?.data?.reel?.status;
        if (status === 'READY' || status === 'FAILED' || tries > MAX_POLLS) {
          clearInterval(pollTimers.current[key]);
          delete pollTimers.current[key];
          setUploads(u => u.filter(x => x.key !== key));
          if (status === 'FAILED') {
            Toast.show({
              type: 'error',
              text1: 'Could not process that video',
              position: 'top',
            });
          } else if (status === 'READY') {
            Toast.show({
              type: 'success',
              text1: 'Reel is live 🎬',
              position: 'top',
            });
          }
          dispatch(getMyReels());
        }
      } catch {
        if (tries > MAX_POLLS) {
          clearInterval(pollTimers.current[key]);
          delete pollTimers.current[key];
          setUploads(u => u.filter(x => x.key !== key));
        }
      }
    }, POLL_MS);
  };

  const startUpload = async ({ courseId, caption, file }: any) => {
    const key = `${courseId}-${file.name}-${file.size || Date.now()}`;
    setModalOpen(false);
    setUploads(u => [
      ...u,
      { key, title: file.name, pct: 0, status: 'uploading' },
    ]);

    try {
      const res = await dispatch(
        createReelUpload({ courseId, caption }),
      ).unwrap();
      const uploadUrl = res?.upload_url;
      const reelId = res?.reel?.id;
      if (!uploadUrl || !reelId)
        throw new Error('Server did not return an upload URL');

      await putWithProgress(uploadUrl, file, pct =>
        setUploads(u => u.map(x => (x.key === key ? { ...x, pct } : x))),
      );
      
      setUploads(u =>
        u.map(x =>
          x.key === key ? { ...x, pct: 100, status: 'processing' } : x,
        ),
      );
      pollStatus(reelId, key);
    } catch (e: any) {
      setUploads(u =>
        u.map(x =>
          x.key === key ? { ...x, status: 'failed', error: e?.message } : x,
        ),
      );
      Toast.show({
        type: 'error',
        text1: e?.message || 'Upload failed',
        position: 'top',
      });
    }
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Reels" bgColor="transparent" textColor='#FFF' />
      {/* In-flight uploads */}
      {uploads.map(u => (
        <View key={u.key} style={styles.uploadRow}>
          {u.status === 'failed' ? (
            <AlertCircle size={wp(16)} color="#EF4444" />
          ) : (
            <ActivityIndicator size="small" color={GOLD_DEEP} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadRowTitle} numberOfLines={1}>
              {u.title}
            </Text>
            <Text style={styles.uploadRowStatus}>
              {u.status === 'uploading' && `Uploading… ${u.pct}%`}
              {u.status === 'processing' &&
                'Processing — this can take a minute'}
              {u.status === 'failed' && (u.error || 'Upload failed')}
            </Text>
            {u.status !== 'failed' && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${u.pct}%` }]} />
              </View>
            )}
          </View>
        </View>
      ))}
      <UploadReelModal
        visible={modalOpen}
        courses={myCourses}
        onClose={() => setModalOpen(false)}
        onSubmit={startUpload}
      />
      <View style={styles.headerRow}>
        <Text style={styles.headerSubtitle}>
          Short vertical videos that promote your courses
        </Text>
        <TouchableOpacity
          style={[
            styles.newReelBtn,
          ]}
          onPress={() => {
            if (!canCreateReel) {
              Toast.show({
                type: 'info',
                text1: 'Create a course first',
                position: 'top',
              });
              return;
            }
            setModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={wp(16)} color="#3A2C12" strokeWidth={2.4} />
          <Text style={styles.newReelBtnText}>New Reel</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={GOLD_DEEP} />
        </View>
      ) : !reels?.length ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Clapperboard size={wp(30)} color={GOLD_CREAM} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>No reels yet</Text>
          <Text style={styles.emptySubtitle}>
            {canCreateReel
              ? 'Upload a 15–60 second vertical video promoting one of your courses.'
              : 'Publish a course first — a reel always points at a course.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <ReelTile
              reel={item}
              onToggleHidden={() => handleToggleHidden(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  headerRow: {
    paddingHorizontal: wp(16),
    paddingTop: hp(6),
    paddingBottom: hp(14),
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.55)',
    marginBottom: hp(12),
    lineHeight: fp(18),
  },
  newReelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: wp(12),
  },
  newReelBtnDisabled: { opacity: 0.5 },
  newReelBtnText: { color: '#3A2C12', fontWeight: '700', fontSize: fp(13) },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
  },
  emptyIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(18),
    backgroundColor: 'rgba(214,156,63,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(214,156,63,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(14),
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(6),
  },
  emptySubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: fp(18),
  },
  gridContent: { paddingHorizontal: wp(16), paddingBottom: hp(30) },
  gridRow: { gap: wp(12), marginBottom: hp(12) },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    backgroundColor: 'rgba(28,27,27,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: wp(12),
    padding: wp(12),
    marginHorizontal: wp(16),
    marginBottom: hp(10),
  },
  uploadRowTitle: {
    fontSize: fp(12.5),
    fontWeight: '600',
    color: colors.white,
  },
  uploadRowStatus: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(2),
  },
  progressTrack: {
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: hp(6),
  },
  progressFill: {
    height: '100%',
    borderRadius: hp(2),
    backgroundColor: GOLD_DEEP,
  },
});
