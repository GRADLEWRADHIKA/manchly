import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import moment from 'moment-timezone';
import colors from '../../../../../utils/colors';
import {
  Calendar,
  Video as VideoIcon,
  PhoneCall,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const modeLabel = (mode?: string) =>
  mode === 'VIDEO' ? '1:1 Video Session' : '1:1 Call Session';

const PurchaseSessionCard = ({ item, onJoinPress }: any) => {
  const expert = item?.receiver;
  const status = item?.status; // PENDING | ACTIVE | COMPLETED | CANCELLED
  const scheduled = item?.scheduled_at ? moment(item.scheduled_at) : null;
  const endTime = scheduled
    ? moment(scheduled).add(item?.duration || 0, 'minutes')
    : null;

  const isUpcoming = status === 'PENDING' || status === 'ACTIVE';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {expert?.profile_image ? (
          <Image source={{ uri: expert.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]} />
        )}

        <View style={styles.content}>
          <Text style={styles.expertName} numberOfLines={1}>
            {expert?.name || 'Expert'}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {modeLabel(item?.mode)}
          </Text>

          {scheduled && (
            <View style={styles.dateRow}>
              <Calendar size={wp(12)} color={colors.user.subHeading} />
              <Text style={styles.dateText} numberOfLines={1}>
                {scheduled.format('ddd, D MMM YYYY')} ·{' '}
                {scheduled.format('h:mm A')}
                {endTime ? ` - ${endTime.format('h:mm A')}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {isUpcoming && (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => onJoinPress?.(item)}
            activeOpacity={0.8}
          >
            {item?.mode === 'VIDEO' ? (
              <VideoIcon size={wp(13)} color={colors.user.accentText} />
            ) : (
              <PhoneCall size={wp(13)} color={colors.user.accentText} />
            )}
            <Text style={styles.joinText}>Join Session</Text>
          </TouchableOpacity>
        )}
        {isCompleted && (
          <View style={styles.statusBadgeCompleted}>
            <CheckCircle2 size={wp(13)} color={colors.creatorGreenDark} />
            <Text style={styles.statusTextCompleted}>Completed</Text>
          </View>
        )}
        {isCancelled && (
          <View style={styles.statusBadgeCancelled}>
            <XCircle size={wp(13)} color={colors.error} />
            <Text style={styles.statusTextCancelled}>Cancelled</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PurchaseSessionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(12),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.user.border,
    gap: hp(10),
  },
  row: { flexDirection: 'row', gap: wp(10) },
  avatar: { width: wp(48), height: wp(48), borderRadius: wp(24) },
  avatarFallback: { backgroundColor: colors.user.accentSoft },
  content: { flex: 1, justifyContent: 'center', gap: hp(3) },
  expertName: { fontSize: fp(14), fontWeight: '700', color: colors.user.text },
  title: { fontSize: fp(12), color: colors.user.subHeading },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    marginTop: hp(2),
  },
  dateText: { fontSize: fp(11), color: colors.user.subHeading },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.greenButtonDark,
    borderRadius: 99,
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
  },
  joinText: {
    fontSize: fp(12),
    fontWeight: '700',
   color: '#FFFFFF',
  },
  statusBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: colors.creatorGreenLight,
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
  },
  statusTextCompleted: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.creatorGreenDark,
  },
  statusBadgeCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
  },
  statusTextCancelled: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.error,
  },
});
