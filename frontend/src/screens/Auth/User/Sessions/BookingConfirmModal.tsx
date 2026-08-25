import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import {
  Video,
  Clock,
  IndianRupee,
  Shield,
  Calendar,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';

interface BookingConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  booking: boolean;
  expertName: string;
  rate: number;
  dateLabel: string;
  timeLabel: string;
}

const BookingConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  booking,
  expertName,
  rate,
  dateLabel,
  timeLabel,
}: BookingConfirmModalProps) => {
  const initials = (expertName || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={() => {}}
        >
          <Text style={styles.title}>Confirm Booking</Text>

          <View style={styles.infoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.infoText}>
              <Text style={styles.name}>{expertName}</Text>
              <Text style={styles.sub}>Video Call</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <IndianRupee
              size={wp(16)}
              color={colors.uSubHeading}
              strokeWidth={1.8}
            />
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>₹{rate}/min</Text>
          </View>

          <View style={styles.row}>
            <Calendar size={wp(16)} color={colors.uSubHeading} strokeWidth={1.8} />
            <Text style={styles.label}>Date & Time</Text>
            <Text style={styles.value}>
              {dateLabel} · {timeLabel}
            </Text>
          </View>

          <View style={styles.row}>
            <Clock size={wp(16)} color={colors.uSubHeading} strokeWidth={1.8} />
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>30 min</Text>
          </View>

          <View style={styles.row}>
            <IndianRupee
              size={wp(16)}
              color={colors.uSubHeading}
              strokeWidth={1.8}
            />
            <Text style={styles.label}>Total</Text>
            <Text style={styles.totalValue}>₹{rate * 30}</Text>
          </View>

          <View style={styles.note}>
            <Shield size={wp(14)} color={colors.success} strokeWidth={1.8} />
            <Text style={styles.noteText}>
              Secure session. Billed per minute of actual call.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onConfirm}
            disabled={booking}
          >
            <LinearGradient
              colors={[colors.btnGradientStart, colors.btnGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              <Video size={wp(18)} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.confirmBtnText}>
                {booking ? 'Processing...' : `Pay ₹${rate * 30} & Book`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default BookingConfirmModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 43, 0.85)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.uCard,
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    padding: wp(20),
    paddingBottom: hp(30),
  },
  title: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(16),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: wp(12) },
  avatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.uSubtext,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoText: { flex: 1 },
  name: { fontSize: fp(15), fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: fp(12), color: colors.uSubHeading, marginTop: hp(2) },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.uSubtext,
    marginVertical: hp(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(12),
  },
  label: { fontSize: fp(13), color: colors.uSubHeading, flex: 1 },
  value: { fontSize: fp(14), fontWeight: '600', color: colors.white },
  totalValue: { fontSize: fp(14), fontWeight: '800', color: colors.btnGradientStart },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: wp(10),
    padding: wp(12),
    marginTop: hp(4),
    marginBottom: hp(20),
  },
  noteText: { fontSize: fp(11), color: colors.success, flex: 1 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    borderRadius: wp(14),
    paddingVertical: hp(16),
    //backgroundColor: colors.info,
  },
  confirmBtnText: { fontSize: fp(16), fontWeight: '700', color: colors.white },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: hp(12),
    marginTop: hp(4),
  },
  cancelBtnText: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.white,
  },
});
