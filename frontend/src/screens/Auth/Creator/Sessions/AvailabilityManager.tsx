import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {
  getMyAvailability,
  addAvailabilitySlot,
  removeAvailabilitySlot,
} from '../../../../store/SessionSlice';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    HOURS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

const AvailabilityManager: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const {availability} = useSelector((s: any) => s.sessionReducer);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(getMyAvailability()).finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(() => {
    if (startTime >= endTime) {
      Toast.show({type: 'error', text1: 'End time must be after start time'});
      return;
    }
    setAdding(true);
    dispatch(addAvailabilitySlot({day: selectedDay, start_time: startTime, end_time: endTime}))
      .unwrap()
      .then(() => {
        setShowAddModal(false);
        dispatch(getMyAvailability());
      })
      .catch(() => {})
      .finally(() => setAdding(false));
  }, [selectedDay, startTime, endTime]);

  const handleRemove = useCallback((slotId: string) => {
    dispatch(removeAvailabilitySlot(slotId));
  }, []);

  const groupedSlots: Record<string, any[]> = {};
  (availability || []).forEach((slot: any) => {
    const day = slot.day || 'Unknown';
    if (!groupedSlots[day]) groupedSlots[day] = [];
    groupedSlots[day].push(slot);
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={wp(22)} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Availability</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addHeaderBtn}>
          <Plus size={wp(18)} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.cAccentLight} />
        </View>
      ) : (availability || []).length === 0 ? (
        <View style={styles.centered}>
          <Calendar size={wp(48)} color={colors.cTextMuted} strokeWidth={1.2} />
          <Text style={styles.emptyTitle}>No availability set</Text>
          <Text style={styles.emptySub}>
            Add your available time slots so users can book sessions with you.
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
            <Plus size={wp(16)} color={colors.white} />
            <Text style={styles.addBtnText}>Add Time Slot</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {DAYS.filter(d => groupedSlots[d]).map(day => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>
              {groupedSlots[day].map((slot: any) => (
                <View key={slot.id} style={styles.slotCard}>
                  <View style={styles.slotLeft}>
                    <Clock size={wp(16)} color={colors.cAccentLight} />
                    <Text style={styles.slotTime}>
                      {slot.start_time} — {slot.end_time}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(slot.id)} style={styles.deleteBtn}>
                    <Trash2 size={wp(16)} color={colors.cError} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
          <View style={{height: hp(40)}} />
        </ScrollView>
      )}

      {/* Add Slot Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Time Slot</Text>

            <Text style={styles.modalLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                  onPress={() => setSelectedDay(d)}>
                  <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                    {d.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Text style={styles.modalLabel}>Start Time</Text>
                <ScrollView style={styles.timePicker} nestedScrollEnabled>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={`s-${h}`}
                      style={[styles.timeOption, startTime === h && styles.timeOptionActive]}
                      onPress={() => setStartTime(h)}>
                      <Text style={[styles.timeOptionText, startTime === h && styles.timeOptionTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.timeCol}>
                <Text style={styles.modalLabel}>End Time</Text>
                <ScrollView style={styles.timePicker} nestedScrollEnabled>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={`e-${h}`}
                      style={[styles.timeOption, endTime === h && styles.timeOptionActive]}
                      onPress={() => setEndTime(h)}>
                      <Text style={[styles.timeOptionText, endTime === h && styles.timeOptionTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, adding && {opacity: 0.7}]} onPress={handleAdd} disabled={adding}>
                {adding ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Add Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AvailabilityManager;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {padding: wp(4)},
  headerTitle: {fontSize: fp(17), fontWeight: '700', color: '#1A1A2E'},
  addHeaderBtn: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(10),
    backgroundColor: colors.cAccentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(32)},
  emptyTitle: {fontSize: fp(18), fontWeight: '700', color: '#1A1A2E', marginTop: hp(16)},
  emptySub: {
    fontSize: fp(13),
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(8),
    lineHeight: fp(20),
    marginBottom: hp(24),
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.cAccentLight,
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    borderRadius: wp(12),
  },
  addBtnText: {fontSize: fp(14), fontWeight: '700', color: colors.white},
  listContent: {padding: wp(16)},
  daySection: {marginBottom: hp(20)},
  dayTitle: {fontSize: fp(15), fontWeight: '700', color: '#1A1A2E', marginBottom: hp(8)},
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotLeft: {flexDirection: 'row', alignItems: 'center', gap: wp(10)},
  slotTime: {fontSize: fp(14), fontWeight: '600', color: '#1A1A2E'},
  deleteBtn: {padding: wp(8)},
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    padding: wp(20),
    paddingBottom: hp(36),
  },
  modalTitle: {fontSize: fp(18), fontWeight: '700', color: '#1A1A2E', marginBottom: hp(16)},
  modalLabel: {fontSize: fp(12), fontWeight: '600', color: '#64748B', marginBottom: hp(8)},
  dayPicker: {marginBottom: hp(16)},
  dayChip: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: '#F1F5F9',
    marginRight: wp(8),
  },
  dayChipActive: {backgroundColor: colors.cAccentLight},
  dayChipText: {fontSize: fp(13), fontWeight: '600', color: '#64748B'},
  dayChipTextActive: {color: colors.white},
  timeRow: {flexDirection: 'row', gap: wp(12), marginBottom: hp(20)},
  timeCol: {flex: 1},
  timePicker: {height: hp(150), backgroundColor: '#F8FAFC', borderRadius: wp(10), padding: wp(4)},
  timeOption: {paddingVertical: hp(8), paddingHorizontal: wp(12), borderRadius: wp(8)},
  timeOptionActive: {backgroundColor: colors.cAccentLight},
  timeOptionText: {fontSize: fp(14), color: '#1A1A2E', textAlign: 'center'},
  timeOptionTextActive: {color: colors.white, fontWeight: '700'},
  modalActions: {flexDirection: 'row', gap: wp(12)},
  cancelBtn: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelBtnText: {fontSize: fp(14), fontWeight: '600', color: '#64748B'},
  saveBtn: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: wp(12),
    backgroundColor: colors.cAccentLight,
    alignItems: 'center',
  },
  saveBtnText: {fontSize: fp(14), fontWeight: '700', color: colors.white},
});
