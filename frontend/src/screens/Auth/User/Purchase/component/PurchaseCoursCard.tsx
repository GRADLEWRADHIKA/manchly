import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { GraduationCap } from 'lucide-react-native';

const PurchaseCoursCard = ({ item, transaction, onPress }) => {
  const courseId = item.id || item._id || item.course_id;
  const courseTitle = item.title || item.course_title || 'Untitled Course';
  const enrolledDate = item.enrolled_at || item.created_at;
  const progress = item.progress || 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <GraduationCap size={20} color={colors.primary} />
        <Text style={styles.title} numberOfLines={2}>{courseTitle}</Text>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.type}>Course</Text>
        {enrolledDate && (
          <Text style={styles.date}>
            Enrolled: {new Date(enrolledDate).toDateString()}
          </Text>
        )}
      </View>

      {/* Transaction */}
      {transaction && (
        <View style={styles.priceRow}>
          <Text style={styles.purchasedFor}>Purchased for</Text>
          <Text style={styles.priceValue}>₹{transaction.amount}</Text>
        </View>
      )}

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.status, progress === 100 ? styles.completed : styles.inProgress]}>
          {progress === 100 ? 'Completed' : 'In Progress'}
        </Text>

        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <Text style={styles.actionText}>
            {progress === 100 ? 'Review' : 'Continue Learning'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PurchaseCoursCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', marginLeft: 8, flexShrink: 1 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  type: { fontSize: 13, color: '#777' },
  date: { fontSize: 13, color: '#777' },
  purchasedFor: { fontSize: 13, color: '#555', fontWeight: '600' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceValue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  progressContainer: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: colors.textSecondary, fontWeight: '600' },
  progressPercent: { color: colors.primary, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '600' },
  status: { fontSize: 13, fontWeight: '500' },
  completed: { color: 'green' },
  inProgress: { color: colors.primary },
});
