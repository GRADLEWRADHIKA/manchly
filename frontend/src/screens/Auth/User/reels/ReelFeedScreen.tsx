import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useNavigation } from '@react-navigation/native';
import { Play } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { instance } from '../../../../utils/AxiosInstance';
import { getFeedReels } from '../../../../store/ReelSlice';
import ReelFeedSlide from './components/ReelFeedSlide';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const PAGE_SIZE = 8;
const VIEW_COUNT_DELAY_MS = 1500;

const ReelsFeedScreen: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const navigation = useNavigation<any>();
  const { height: windowHeight } = useWindowDimensions();

  const { feed, feedLoading, feedHasMore, feedPage, feedSeed } = useSelector(
    (state: any) => state.reelReducer,
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [containerHeight, setContainerHeight] = useState(0);
  const tabBarHeight = useBottomTabBarHeight();

  const seenRef = useRef<Set<string>>(new Set());
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!hasLoadedOnce.current && feed.length === 0) {
      hasLoadedOnce.current = true;
      dispatch(getFeedReels({ page: 1, limit: PAGE_SIZE, seed: feedSeed }));
    }
  }, [dispatch, feed.length, feedSeed]);

  const loadMore = useCallback(() => {
    if (!feedHasMore || feedLoading) return;
    dispatch(
      getFeedReels({ page: feedPage + 1, limit: PAGE_SIZE, seed: feedSeed }),
    );
  }, [dispatch, feedHasMore, feedLoading, feedPage, feedSeed]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  useEffect(() => {
    const reel = feed[activeIndex];
    if (!reel || seenRef.current.has(reel.id)) return;
    const t = setTimeout(() => {
      seenRef.current.add(reel.id);
      instance.post(`reels/${reel.id}/view`).catch(() => {});
    }, VIEW_COUNT_DELAY_MS);
    return () => clearTimeout(t);
  }, [activeIndex, feed]);

  const openCourse = useCallback(
    (courseId: string) => {
      navigation.navigate('CourseDetailsScreen', { courseId });
    },
    [navigation],
  );

  const openCreator = useCallback(
    (creatorId?: string) => {
      if (!creatorId) return;
      navigation.navigate('CreatorPublicProfile', { creatorId });
    },
    [navigation],
  );

  if (feedLoading && feed.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.centeredText}>Loading reels…</Text>
      </View>
    );
  }

  if (!feedLoading && feed.length === 0) {
    return (
      <View style={styles.centered}>
        <Play size={wp(38)} color="rgba(255,255,255,0.5)" />
        <Text style={styles.emptyTitle}>No reels yet</Text>
        <Text style={styles.emptySubtitle}>
          Creators haven't posted any course reels yet.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={e => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 && (
        <FlatList
          data={feed}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ReelFeedSlide
              reel={item}
              height={containerHeight}
              bottomInset={0} // change to tabBarHeight only if the tab bar floats over content (see below)
              isActive={index === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
              onBuy={() => openCourse(item.course?.id)}
              onOpenCourse={() => openCourse(item.course?.id)}
              onOpenCreator={() => openCreator(item.course?.creator?.id)}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
        />
      )}
    </View>
  );
};

export default ReelsFeedScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
  },
  centeredText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(12),
    fontSize: fp(14),
  },
  emptyTitle: {
    color: colors.white,
    fontSize: fp(19),
    fontWeight: '700',
    marginTop: hp(14),
    marginBottom: hp(6),
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fp(14),
    textAlign: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
