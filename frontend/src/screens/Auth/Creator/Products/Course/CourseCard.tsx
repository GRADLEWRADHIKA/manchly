import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
} from 'react-native';
import { Users, Clock, Edit3, Trash2, ChevronRight } from 'lucide-react-native';
import colors from '../../../../../utils/colors';

interface Props {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const CourseCard: React.FC<Props> = ({ item, onEdit, onDelete, onView }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onView}
      >
        <View style={styles.cardHeader}>
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

          <View style={styles.courseInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {item?.title}
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.courseCategory}>{item?.category}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'No description available for this course.'}
            </Text>
          </View>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Users size={14} color={colors.primary} />
              <Text style={styles.metaText}>{item?.language || 'English'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.primary} />
              <Text style={styles.metaText}>{item?.level || 'Beginner'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.durationText}>
                {item.duration || '8h 30m'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Edit3 size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.actionSeparator} />

          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Trash2 size={16} color={colors.error} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  thumbnailContainer: { position: 'relative', marginRight: 12 },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  courseInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  courseCategory: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: {
    marginLeft: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});
