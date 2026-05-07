import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Star,
  Phone,
  Video,
  MessageCircle,
  Clock,
  IndianRupee,
  Users,
  Globe,
  Award,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const TIME_SLOTS = [
  {time: '9:00 AM', available: true},
  {time: '10:00 AM', available: false},
  {time: '11:00 AM', available: true},
  {time: '12:00 PM', available: true},
  {time: '2:00 PM', available: true},
  {time: '3:00 PM', available: false},
  {time: '4:00 PM', available: true},
  {time: '5:00 PM', available: true},
  {time: '6:00 PM', available: true},
];

const DATES = [
  {day: 'Today', date: '7 May', available: true},
  {day: 'Thu', date: '8 May', available: true},
  {day: 'Fri', date: '9 May', available: true},
  {day: 'Sat', date: '10 May', available: true},
  {day: 'Sun', date: '11 May', available: false},
  {day: 'Mon', date: '12 May', available: true},
  {day: 'Tue', date: '13 May', available: true},
];

const REVIEWS = [
  {
    id: '1',
    name: 'Rahul K.',
    rating: 5,
    comment: 'Very accurate predictions. Helped me with career decisions.',
    date: '2 days ago',
  },
  {
    id: '2',
    name: 'Priya S.',
    rating: 4,
    comment:
      'Great experience! The astrologer was very patient and explained everything clearly.',
    date: '1 week ago',
  },
  {
    id: '3',
    name: 'Amit D.',
    rating: 5,
    comment: 'Excellent consultation. Highly recommended!',
    date: '2 weeks ago',
  },
];

const AstrologerDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const astrologer = route.params?.astrologer || {
    id: '1',
    name: 'Pandit Rajesh Sharma',
    specialization: ['Vedic Astrology', 'Numerology'],
    experience: 12,
    rating: 4.8,
    reviews: 320,
    totalConsultations: 1520,
    pricePerMin: 15,
    languages: ['Hindi', 'English'],
    isOnline: true,
    modes: ['call', 'video'],
  };

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('call');

  const handleBookNow = () => {
    navigation.navigate('BookingConfirmation', {
      astrologer,
      date: DATES[selectedDate],
      time: selectedSlot,
      mode: selectedMode,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Astrologer Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + hp(100)},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {astrologer.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: astrologer.isOnline
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{astrologer.name}</Text>
              <Text style={styles.profileSpec}>
                {astrologer.specialization.join(' | ')}
              </Text>
              <View style={styles.onlineStatus}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: astrologer.isOnline
                        ? colors.success
                        : colors.textMuted,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: astrologer.isOnline
                        ? colors.success
                        : colors.textMuted,
                    },
                  ]}>
                  {astrologer.isOnline ? 'Online' : 'Offline'}
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
              <Text style={styles.statValue}>{astrologer.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Clock
                size={wp(16)}
                color={colors.info}
                strokeWidth={1.8}
              />
              <Text style={styles.statValue}>{astrologer.experience} yrs</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Users
                size={wp(16)}
                color={colors.secPrimary}
                strokeWidth={1.8}
              />
              <Text style={styles.statValue}>
                {astrologer.totalConsultations}+
              </Text>
              <Text style={styles.statLabel}>Consults</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <IndianRupee
                size={wp(16)}
                color={colors.success}
                strokeWidth={1.8}
              />
              <Text style={styles.statValue}>{astrologer.pricePerMin}</Text>
              <Text style={styles.statLabel}>Per Min</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            With over {astrologer.experience} years of experience in{' '}
            {astrologer.specialization.join(' and ')}, providing accurate
            predictions and life guidance. Specializes in career, marriage, and
            health-related consultations with a holistic approach to astrology.
          </Text>
          <View style={styles.langRow}>
            <Globe
              size={wp(14)}
              color={colors.textSecondary}
              strokeWidth={1.8}
            />
            <Text style={styles.langText}>
              {astrologer.languages.join(', ')}
            </Text>
          </View>
        </View>

        {/* Consultation Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Consultation Mode</Text>
          <View style={styles.modeSelector}>
            {astrologer.modes.includes('call') && (
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  selectedMode === 'call' && styles.modeOptionActive,
                ]}
                onPress={() => setSelectedMode('call')}
                activeOpacity={0.7}>
                <Phone
                  size={wp(20)}
                  color={selectedMode === 'call' ? colors.white : colors.info}
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    selectedMode === 'call' && styles.modeOptionTextActive,
                  ]}>
                  Audio Call
                </Text>
                <Text
                  style={[
                    styles.modePrice,
                    selectedMode === 'call' && styles.modePriceActive,
                  ]}>
                  Rs.{astrologer.pricePerMin}/min
                </Text>
              </TouchableOpacity>
            )}
            {astrologer.modes.includes('video') && (
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  selectedMode === 'video' && styles.modeOptionActive,
                ]}
                onPress={() => setSelectedMode('video')}
                activeOpacity={0.7}>
                <Video
                  size={wp(20)}
                  color={
                    selectedMode === 'video' ? colors.white : colors.success
                  }
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    selectedMode === 'video' && styles.modeOptionTextActive,
                  ]}>
                  Video Call
                </Text>
                <Text
                  style={[
                    styles.modePrice,
                    selectedMode === 'video' && styles.modePriceActive,
                  ]}>
                  Rs.{astrologer.pricePerMin + 5}/min
                </Text>
              </TouchableOpacity>
            )}
            {astrologer.modes.includes('chat') && (
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  selectedMode === 'chat' && styles.modeOptionActive,
                ]}
                onPress={() => setSelectedMode('chat')}
                activeOpacity={0.7}>
                <MessageCircle
                  size={wp(20)}
                  color={
                    selectedMode === 'chat' ? colors.white : colors.secondary
                  }
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    selectedMode === 'chat' && styles.modeOptionTextActive,
                  ]}>
                  Chat
                </Text>
                <Text
                  style={[
                    styles.modePrice,
                    selectedMode === 'chat' && styles.modePriceActive,
                  ]}>
                  Rs.{astrologer.pricePerMin - 5}/min
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}>
            {DATES.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  selectedDate === i && styles.dateCardActive,
                  !d.available && styles.dateCardDisabled,
                ]}
                onPress={() => d.available && setSelectedDate(i)}
                activeOpacity={0.7}
                disabled={!d.available}>
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate === i && styles.dateDayActive,
                    !d.available && styles.dateTextDisabled,
                  ]}>
                  {d.day}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    selectedDate === i && styles.dateNumActive,
                    !d.available && styles.dateTextDisabled,
                  ]}>
                  {d.date.split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    selectedDate === i && styles.dateMonthActive,
                    !d.available && styles.dateTextDisabled,
                  ]}>
                  {d.date.split(' ')[1]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.slotChip,
                  selectedSlot === slot.time && styles.slotChipActive,
                  !slot.available && styles.slotChipDisabled,
                ]}
                onPress={() => slot.available && setSelectedSlot(slot.time)}
                activeOpacity={0.7}
                disabled={!slot.available}>
                <Text
                  style={[
                    styles.slotText,
                    selectedSlot === slot.time && styles.slotTextActive,
                    !slot.available && styles.slotTextDisabled,
                  ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight
                size={wp(14)}
                color={colors.secPrimary}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          {REVIEWS.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{review.name}</Text>
                <View style={styles.reviewRating}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={wp(10)}
                      color={colors.golden}
                      fill={colors.golden}
                      strokeWidth={1}
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[styles.bottomBar, {paddingBottom: insets.bottom + hp(10)}]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomPrice}>
            Rs.{astrologer.pricePerMin}/min
          </Text>
          <Text style={styles.bottomMode}>
            {selectedMode === 'call'
              ? 'Audio Call'
              : selectedMode === 'video'
              ? 'Video Call'
              : 'Chat'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bottomBtn,
            (!selectedSlot) && styles.bottomBtnDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleBookNow}
          disabled={!selectedSlot}>
          <Text style={styles.bottomBtnText}>
            {selectedSlot ? 'Book Now' : 'Select a Time Slot'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(AstrologerDetail);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: hp(14),
  },
  profileCard: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: wp(2),
    right: wp(2),
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    marginLeft: wp(14),
    flex: 1,
  },
  profileName: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.text,
  },
  profileSpec: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    gap: wp(4),
  },
  statusDot: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
  },
  statusText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: hp(16),
    paddingTop: hp(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: hp(3),
  },
  statValue: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  section: {
    marginTop: hp(18),
    paddingHorizontal: wp(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(10),
  },
  aboutText: {
    fontSize: fp(13),
    color: colors.textSecondary,
    lineHeight: fp(20),
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(8),
  },
  langText: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: wp(10),
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(14),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: hp(4),
  },
  modeOptionActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  modeOptionText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.text,
  },
  modeOptionTextActive: {
    color: colors.white,
  },
  modePrice: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  modePriceActive: {
    color: colors.white + 'CC',
  },
  dateRow: {
    gap: wp(8),
  },
  dateCard: {
    width: wp(60),
    alignItems: 'center',
    paddingVertical: hp(10),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateCardActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  dateCardDisabled: {
    opacity: 0.4,
  },
  dateDay: {
    fontSize: fp(10),
    color: colors.textMuted,
    fontWeight: '500',
  },
  dateDayActive: {
    color: colors.white + 'CC',
  },
  dateNum: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginTop: hp(2),
  },
  dateNumActive: {
    color: colors.white,
  },
  dateMonth: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  dateMonthActive: {
    color: colors.white + 'CC',
  },
  dateTextDisabled: {
    color: colors.textMuted,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
  },
  slotChip: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    borderRadius: wp(10),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  slotChipActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  slotChipDisabled: {
    opacity: 0.35,
  },
  slotText: {
    fontSize: fp(12),
    fontWeight: '500',
    color: colors.text,
  },
  slotTextActive: {
    color: colors.white,
  },
  slotTextDisabled: {
    color: colors.textMuted,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  seeAllText: {
    fontSize: fp(12),
    color: colors.secPrimary,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  reviewName: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: wp(2),
  },
  reviewDate: {
    fontSize: fp(10),
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  reviewComment: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(6),
    lineHeight: fp(18),
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomLeft: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
  },
  bottomMode: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  bottomBtn: {
    backgroundColor: colors.secPrimary,
    borderRadius: wp(12),
    paddingHorizontal: wp(28),
    paddingVertical: hp(14),
  },
  bottomBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  bottomBtnText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
});
