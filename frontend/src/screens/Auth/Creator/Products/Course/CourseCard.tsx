import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
  Share,
  ActivityIndicator,
} from 'react-native';
import { createDynamicLink } from 'react-native-chottulink-sdk';
import {
  Users,
  Clock,
  Edit3,
  Trash2,
  ChevronRight,
  Link,
  Info,
} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 60;

interface Props {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const CourseCard: React.FC<Props> = ({ item, onEdit, onDelete, onView }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<any>();
  const [sharing, setSharing] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.courseCard,
        {
          transform: [{ scale: scaleAnim }],
          width: CARD_WIDTH,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onView}
        style={styles.touchable}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{
              uri:
                item.thumbnail ||
                'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
            }}
            style={styles.thumbnail}
          />
        </View>

        {/* Course Content */}
        <View style={styles.courseContent}>
          <View style={styles.titleRow}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item?.title.toUpperCase()}
            </Text>
            <ChevronRight size={wp(16)} color={colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.courseCategory}>{item?.category}</Text>

            <Text style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
          </View>

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <TouchableOpacity
                style={styles.metaItem}
                onPress={() => {
                  navigation.navigate('CourseDetailsScreen', {
                    courseId: item?.id,
                  });
                }}
              >
                <Info size={wp(14)} color={colors.primary} />
                <Text style={styles.metaText}>Info</Text>
              </TouchableOpacity>
              <View style={styles.durationContainer}>
                <Text style={styles.durationText}>
                  {item.duration || '8h 30m'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={wp(14)} color={colors.primary} />
                <Text style={styles.metaText}>{item?.level || 'Beginner'}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Edit3 size={wp(16)} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.actionSeparator} />

            <TouchableOpacity
              style={styles.actionBtn}
              disabled={sharing}
              onPress={async () => {
                Share.share({
                  message: `https://manchly.chottu.link/course/${item?.id}`,
                });
                // try {
                //   setSharing(true);
                //   const result = await createDynamicLink({
                //     destinationURL: `https://manchly.chottu.link/course/${item?.id}`,
                //     domain: 'manchly.chottu.link',
                //     androidBehaviour: 2,
                //     linkName: item?.title || 'Course Link',
                //     socialTitle: item?.title,
                //     socialDescription: item?.description,
                //     socialImageUrl: item?.thumbnail,
                //   });
                //   await Share.share({
                //     message: result.shortURL,
                //   });
                // } catch {
                //   // Fallback to direct URL if dynamic link creation fails
                //   await Share.share({
                //     message: `https://manchly.chottu.link/course/${item?.id}`,
                //   });
                // } finally {
                //   setSharing(false);
                // }
              }}
            >
              {sharing ? (
                <ActivityIndicator size={wp(16)} color={colors.primary} />
              ) : (
                <Link size={wp(16)} color={colors.primary} />
              )}
              <Text style={styles.editBtnText}>Link</Text>
            </TouchableOpacity>

            <View style={styles.actionSeparator} />

            <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
              <Trash2 size={wp(16)} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: wp(20),
    marginHorizontal: wp(8),
    marginBottom: hp(16),
    padding: wp(16),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: wp(1),
    borderColor: 'rgba(0,0,0,0.05)',
    height: hp(380),
  },
  touchable: {
    flex: 1,
  },
  thumbnailContainer: {
    marginBottom: hp(12),
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    borderRadius: wp(12),
    backgroundColor: '#F3F4F6',
  },
  courseContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginRight: wp(8),
    lineHeight: fp(20),
  },
  courseCategory: {
    color: colors.primary,
    fontSize: fp(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fp(13),
  },
  metaContainer: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(12),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: wp(6),
    color: colors.text,
    fontSize: fp(12),
    fontWeight: '600',
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    color: colors.text,
    fontSize: fp(12),
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(4),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(10),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
  },
  editBtnText: {
    color: colors.primary,
    fontSize: fp(14),
    fontWeight: '700',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: fp(14),
    fontWeight: '700',
  },
  actionSeparator: {
    width: wp(1),
    height: hp(20),
    backgroundColor: '#E5E7EB',
    marginVertical: hp(4),
  },
});
