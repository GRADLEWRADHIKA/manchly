import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star,
  Video,
  Clock,
  Globe,
  User2,
  Calendar,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFDropCheckoutPayment,
  CFThemeBuilder,
} from 'cashfree-pg-api-contract';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { instance } from '../../../../utils/AxiosInstance';
import { getExpertDetail, bookSession, verifySessionPayment, getExpertAvailability } from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';
import BookingConfirmModal from './BookingConfirmModal';

const ExpertDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();

  const expertParam = route.params?.expert;
  const [expert, setExpert] = useState<any>(expertParam);
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState<{
    label: string;
    hour: number;
    minute: number;
  } | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const pendingOrderRef = useRef<string | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (!expert?.id) return;
    dispatch(getExpertAvailability(expert.id))
      .unwrap()
      .then((res: any) => {
        const slots = res?.data || res || [];
        setAvailability(slots);
      })
      .catch(() => {});
  }, [expert?.id]);

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const next7Days = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push({
        date: d,
        day: DAY_NAMES[d.getDay()],
        num: d.getDate(),
        month: MONTH_NAMES[d.getMonth()],
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const timeSlots = useMemo(() => {
    const selectedDayOfWeek = next7Days[selectedDate]?.date.getDay();
    const dailySlots = availability.filter((slot: any) => Number(slot.day_of_week) === selectedDayOfWeek);

    if (dailySlots.length === 0) {
      // Fallback default slots
      const slots: { label: string; hour: number; minute: number }[] = [];
      for (let h = 10; h < 18; h++) {
        const displayH = h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        slots.push({ label: `${displayH}:00 ${ampm}`, hour: h, minute: 0 });
        slots.push({ label: `${displayH}:30 ${ampm}`, hour: h, minute: 30 });
      }
      return slots;
    }

    const generatedSlots: { label: string; hour: number; minute: number }[] = [];
    dailySlots.forEach((slot: any) => {
      if (!slot.start || !slot.end) return;
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);

      let currentH = startH;
      let currentM = startM;

      while (currentH < endH || (currentH === endH && currentM < endM)) {
        const displayH = currentH > 12 ? currentH - 12 : currentH === 0 ? 12 : currentH;
        const ampm = currentH >= 12 ? 'PM' : 'AM';
        generatedSlots.push({
          label: `${displayH}:${currentM === 0 ? '00' : '30'} ${ampm}`,
          hour: currentH,
          minute: currentM,
        });

        currentM += 30;
        if (currentM >= 60) {
          currentM = 0;
          currentH += 1;
        }
      }
    });

    return generatedSlots.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  }, [availability, selectedDate, next7Days]);

  useEffect(() => {
    if (expertParam?.id) {
      dispatch(getExpertDetail(expertParam.id))
        .unwrap()
        .then((res: any) => {
          const data = res?.data;
          if (data) setExpert({ ...expertParam, ...data });
        })
        .catch(() => {});
    }
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!expert?.id) return;
    const dateObj = next7Days[selectedDate]?.date;
    if (!dateObj) return;
    const dateStr = `${dateObj.getFullYear()}-${String(
      dateObj.getMonth() + 1,
    ).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    instance
      .get(`sessions/experts/${expert.id}/booked-slots?date=${dateStr}`)
      .then((res: any) => {
        const slots = res?.data?.data?.booked_slots || [];
        const booked = new Set<string>();
        slots.forEach((s: any) => {
          if (!s.scheduled_at) return;
          const st = new Date(s.scheduled_at);
          const h = st.getHours();
          const m = st.getMinutes();
          const displayH = h > 12 ? h - 12 : h;
          const ampm = h >= 12 ? 'PM' : 'AM';
          booked.add(`${displayH}:${m === 0 ? '00' : '30'} ${ampm}`);
        });
        setBookedSlots(booked);
      })
      .catch(() => setBookedSlots(new Set()));
  }, [selectedDate, expert?.id]);

  // Listen for real-time availability changes
  useEffect(() => {
    const handler = (data: {expert_id: string; user_id: string; is_available: boolean}) => {
      if (data.expert_id === expert?.id || data.user_id === expert?.user_id) {
        setExpert((prev: any) => ({...prev, is_available: data.is_available}));
      }
    };
    SocketService.on('expert_availability_updated', handler);
    return () => { SocketService.off('expert_availability_updated', handler); };
  }, [expert?.id, expert?.user_id]);

  const pollSessionPaymentVerify = async (orderId: string, retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await dispatch(verifySessionPayment({ order_id: orderId })).unwrap();
        return res;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // Register Cashfree payment callbacks
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: async (orderIdFromSDK: string) => {
        const orderId = pendingOrderRef.current;
        if (!orderId) return;
        pendingOrderRef.current = null;

        try {
          await pollSessionPaymentVerify(orderId);
          setShowConfirm(false);
          navigation.navigate('UserBottomTab', { screen: 'UserSessions' });
        } catch (e) {
          console.error('Session payment verification failed:', e);
        } finally {
          setBooking(false);
        }
      },
      onError: (error: any) => {
        pendingOrderRef.current = null;
        setBooking(false);
        const msg =
          error?.message || error?.code || 'Payment was cancelled or failed';
        Toast.show({
          type: 'error',
          text1: 'Payment Failed',
          text2: msg,
          position: 'bottom',
        });
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  const eu = expert?.user || expertParam?.user;
  const videoRate = expert?.video_rate ?? expertParam?.video_rate ?? 0;

  const handleConfirm = () => {
    if (!selectedTime) return;
    const dateObj = new Date(next7Days[selectedDate].date.getTime());
    dateObj.setHours(selectedTime.hour, selectedTime.minute, 0, 0);

    // Final check: prevent booking a past time
    if (dateObj.getTime() <= Date.now()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Time',
        text2: 'You cannot book a session in the past. Please select an upcoming time.',
        position: 'top',
      });
      setSelectedTime(null);
      return;
    }

    setBooking(true);
    dispatch(
      bookSession({
        expert_id: expert.id,
        mode: 'video',
        duration: 30,
        scheduled_at: dateObj.toISOString(),
      }),
    )
      .unwrap()
      .then((res: any) => {
        const data = res?.data;

        // Free session — no payment needed
        if (data?.is_free) {
          setShowConfirm(false);
          Toast.show({
            type: 'success',
            text1: 'Session Booked!',
            text2: 'The expert will connect with you shortly.',
            position: 'bottom',
          });
          navigation.navigate('UserBottomTab', { screen: 'UserSessions' });
          setBooking(false);
          return;
        }

        // Paid session — launch Cashfree checkout
        const { cashfree_order, cashfree_env } = data || {};
        if (!cashfree_order?.payment_session_id || !cashfree_order?.order_id) {
          throw new Error('Invalid payment order');
        }

        pendingOrderRef.current = cashfree_order.order_id;

        const env =
          cashfree_env === 'PRODUCTION'
            ? CFEnvironment.PRODUCTION
            : CFEnvironment.SANDBOX;

        const session = new CFSession(
          cashfree_order.payment_session_id,
          cashfree_order.order_id,
          env,
        );

        const theme = new CFThemeBuilder()
          .setNavigationBarBackgroundColor(colors.primary)
          .setNavigationBarTextColor('#FFFFFF')
          .setButtonBackgroundColor(colors.secPrimary)
          .setButtonTextColor('#FFFFFF')
          .build();

        const dropPayment = new CFDropCheckoutPayment(session, null, theme);
        CFPaymentGatewayService.doPayment(dropPayment);
      })
      .catch((err: any) => {
        Alert.alert('Booking Failed', err?.message || 'Something went wrong');
        setBooking(false);
      });
  };

  const rate = videoRate;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Expert Profile" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + hp(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              {eu?.profile_image ? (
                <Image
                  source={{ uri: eu.profile_image }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User2 size={wp(28)} color={colors.secPrimary} />
                </View>
              )}
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: expert?.is_available
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{eu?.name || 'Expert'}</Text>
              <Text style={styles.profileProf}>{expert?.profession}</Text>
              <View style={styles.onlineRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: expert?.is_available
                        ? colors.success
                        : colors.textMuted,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: expert?.is_available
                        ? colors.success
                        : colors.textMuted,
                    },
                  ]}
                >
                  {expert?.is_available ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Star
                size={wp(16)}
                color={colors.golden}
                fill={colors.golden}
                strokeWidth={1}
              />
              <Text style={styles.statVal}>
                {(expert?.rating || 0).toFixed(1)}
              </Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Clock size={wp(16)} color={colors.info} strokeWidth={1.8} />
              <Text style={styles.statVal}>{expert?.experience || 0} yrs</Text>
              <Text style={styles.statLbl}>Exp</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Video
                size={wp(16)}
                color={colors.secPrimary}
                strokeWidth={1.8}
              />
              <Text style={styles.statVal}>{expert?.total_sessions || 0}</Text>
              <Text style={styles.statLbl}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* About */}
        {expert?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{expert.bio}</Text>
          </View>
        )}

        {/* Languages */}
        {expert?.languages?.length > 0 && (
          <View style={styles.langRow}>
            <Globe
              size={wp(14)}
              color={colors.textSecondary}
              strokeWidth={1.8}
            />
            <Text style={styles.langText}>{expert.languages.join(', ')}</Text>
          </View>
        )}

        {/* Book a Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book a Video Session</Text>
          <View style={styles.videoRateCard}>
            <Video
              size={wp(20)}
              color={colors.white}
              strokeWidth={1.8}
            />
            <Text style={styles.videoRateText}>
              Video Call · ₹{videoRate}/min
            </Text>
          </View>
        </View>

        {/* Select Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={wp(16)} color={colors.text} strokeWidth={1.8} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Select Date
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {next7Days.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  selectedDate === i && styles.dateCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedDate(i);
                  setSelectedTime(null);
                }}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate === i && styles.dateDayActive,
                  ]}
                >
                  {d.isToday ? 'Today' : d.day}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    selectedDate === i && styles.dateNumActive,
                  ]}
                >
                  {d.num}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    selectedDate === i && styles.dateMonthActive,
                  ]}
                >
                  {d.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Select Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={wp(16)} color={colors.text} strokeWidth={1.8} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Select Time
            </Text>
          </View>
          <View style={styles.timeGrid}>
            {timeSlots.map(t => {
              const isBooked = bookedSlots.has(t.label);
              const isToday = selectedDate === 0;
              const now = new Date();
              const isPast = isToday && (t.hour < now.getHours() || (t.hour === now.getHours() && t.minute <= now.getMinutes()));
              const isDisabled = isBooked || isPast;
              return (
                <TouchableOpacity
                  key={t.label}
                  style={[
                    styles.timeSlot,
                    selectedTime?.label === t.label && styles.timeSlotActive,
                    isDisabled && styles.timeSlotBooked,
                  ]}
                  activeOpacity={0.8}
                  disabled={isDisabled}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime?.label === t.label && styles.timeTextActive,
                      isDisabled && styles.timeTextBooked,
                    ]}
                  >
                    {t.label}
                  </Text>
                  {isBooked && <Text style={styles.bookedLabel}>Booked</Text>}
                  {isPast && !isBooked && <Text style={styles.bookedLabel}>Passed</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Categories */}
        {expert?.categories?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expertise</Text>
            <View style={styles.chipRow}>
              {expert.categories.map((c: string) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + hp(10) }]}
      >
        <View>
          <Text style={styles.bottomPrice}>₹{rate}/min</Text>
          <Text style={styles.bottomSubText}>
            {selectedTime
              ? `${next7Days[selectedDate]?.day}, ${next7Days[selectedDate]?.num} ${next7Days[selectedDate]?.month} · ${selectedTime.label}`
              : 'Select date & time'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bottomBtn,
            !selectedTime && styles.bottomBtnDisabled,
          ]}
          activeOpacity={0.8}
          disabled={!selectedTime}
          onPress={() => setShowConfirm(true)}
        >
          <Video size={wp(16)} color={colors.white} strokeWidth={2} />
          <Text style={styles.bottomBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      <BookingConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        booking={booking}
        expertName={eu?.name || 'Expert'}
        rate={rate}
        dateLabel={`${next7Days[selectedDate]?.day}, ${next7Days[selectedDate]?.num} ${next7Days[selectedDate]?.month}`}
        timeLabel={selectedTime?.label || ''}
      />
      
    </View>
  );
};

export default ExpertDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: hp(14) },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.surface,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: wp(64), height: wp(64), borderRadius: wp(32) },
  avatarPlaceholder: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.info + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: wp(2),
    right: wp(2),
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { marginLeft: wp(14), flex: 1 },
  profileName: { fontSize: fp(17), fontWeight: '700', color: colors.textPrimary },
  profileProf: {
    fontSize: fp(12),
    color: colors.textPrimary,
    marginTop: hp(2),
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    gap: wp(4),
  },
  statusDot: { width: wp(7), height: wp(7), borderRadius: wp(4) },
  statusText: { fontSize: fp(11), fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    marginTop: hp(16),
    paddingTop: hp(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface,
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', gap: hp(3) },
  statVal: { fontSize: fp(14), fontWeight: '700', color: colors.textPrimary },
  statLbl: { fontSize: fp(10), color: colors.textPrimary },
  statDiv: { width: 1, backgroundColor: colors.surface },
  section: { marginTop: hp(18), paddingHorizontal: wp(16) },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(10),
  },
  aboutText: {
    fontSize: fp(13),
    color: colors.textPrimary,
    lineHeight: fp(20),
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(10),
    paddingHorizontal: wp(16),
  },
  langText: { fontSize: fp(12), color: colors.textPrimary },
  videoRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    backgroundColor: colors.info,
    borderRadius: wp(14),
    paddingVertical: hp(14),
    paddingHorizontal: wp(16),
  },
  videoRateText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(10),
  },
  dateRow: { gap: wp(8), paddingRight: wp(8) },
  dateCard: {
    width: wp(68),
    alignItems: 'center',
    paddingVertical: hp(12),
    borderRadius: wp(14),
    backgroundColor: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  dateCardActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  dateDay: { fontSize: fp(11), fontWeight: '600', color: colors.textSecondary },
  dateDayActive: { color: 'rgba(255,255,255,0.7)' },
  dateNum: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.text,
    marginVertical: hp(2),
  },
  dateNumActive: { color: colors.textPrimary },
  dateMonth: { fontSize: fp(10), fontWeight: '500', color: colors.textMuted },
  dateMonthActive: { color: 'rgba(255,255,255,0.7)' },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: hp(12),
    borderRadius: wp(12),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  timeSlotActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  timeSlotBooked: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.7,
  },
  timeText: { fontSize: fp(11), fontWeight: '600', color: colors.textPrimary },
  timeTextActive: { color: colors.textPrimary },
  timeTextBooked: { color: colors.muted, textDecorationLine: 'line-through' },
  bookedLabel: {
    fontSize: fp(5),
    color: colors.info,
    fontWeight: '700',
    backgroundColor: colors.error,
    borderRadius: wp(4),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    marginTop: hp(3),
    position: 'absolute',
    top: hp(1),
    right: wp(4),
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(8) },
  chip: {
    backgroundColor: colors.info + '10',
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
  },
  chipText: { fontSize: fp(12), color: colors.textPrimary, fontWeight: '500' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface,
  },
  bottomPrice: { fontSize: fp(16), fontWeight: '700', color: colors.textPrimary },
  bottomSubText: {
    fontSize: fp(11),
    color: colors.textPrimary,
    marginTop: hp(2),
  },
  bottomBtn: {
    backgroundColor: colors.info,
    borderRadius: wp(12),
    paddingHorizontal: wp(22),
    paddingVertical: hp(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  bottomBtnDisabled: { opacity: 0.4 },
  bottomBtnText: { fontSize: fp(14), fontWeight: '700', color: colors.textPrimary },
});
