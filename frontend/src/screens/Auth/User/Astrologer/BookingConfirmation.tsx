import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Phone,
  Video,
  MessageCircle,
  Calendar,
  Clock,
  IndianRupee,
  Shield,
  Check,
  CreditCard,
  Wallet,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const BookingConfirmation: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const {astrologer, date, time, mode} = route.params || {
    astrologer: {name: 'Pandit Rajesh Sharma', pricePerMin: 15},
    date: {day: 'Today', date: '7 May'},
    time: '9:00 AM',
    mode: 'call',
  };

  const [duration, setDuration] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  const pricePerMin =
    mode === 'video'
      ? astrologer.pricePerMin + 5
      : mode === 'chat'
      ? astrologer.pricePerMin - 5
      : astrologer.pricePerMin;

  const totalAmount = pricePerMin * duration;

  const getModeIcon = () => {
    switch (mode) {
      case 'video':
        return <Video size={wp(18)} color={colors.success} strokeWidth={1.8} />;
      case 'chat':
        return (
          <MessageCircle
            size={wp(18)}
            color={colors.secondary}
            strokeWidth={1.8}
          />
        );
      default:
        return <Phone size={wp(18)} color={colors.info} strokeWidth={1.8} />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'video':
        return 'Video Call';
      case 'chat':
        return 'Chat';
      default:
        return 'Audio Call';
    }
  };

  const handleConfirm = () => {
    // Generate a unique callID for this session
    const callID = `astro_${astrologer.id}_${Date.now()}`;
    // TODO: Replace with actual logged-in user data from Redux store
    const userID = `user_${Date.now()}`;
    const userName = 'User';

    navigation.navigate('CallScreen', {
      callID,
      userID,
      userName,
      mode,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Confirm Booking" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + hp(100)},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {astrologer.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName}>{astrologer.name}</Text>
              <Text style={styles.summarySpec}>
                {astrologer.specialization?.join(' | ') || 'Astrologer'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              {getModeIcon()}
              <Text style={styles.detailLabel}>Mode</Text>
              <Text style={styles.detailValue}>{getModeLabel()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar
                size={wp(18)}
                color={colors.secPrimary}
                strokeWidth={1.8}
              />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {date?.day}, {date?.date}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Clock
                size={wp(18)}
                color={colors.secPrimary}
                strokeWidth={1.8}
              />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Duration</Text>
          <View style={styles.durationRow}>
            {[10, 15, 20, 30, 45, 60].map(d => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationChip,
                  duration === d && styles.durationChipActive,
                ]}
                onPress={() => setDuration(d)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.durationText,
                    duration === d && styles.durationTextActive,
                  ]}>
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Rate</Text>
              <Text style={styles.priceValue}>Rs.{pricePerMin}/min</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Duration</Text>
              <Text style={styles.priceValue}>{duration} minutes</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total Amount</Text>
              <Text style={styles.priceTotalValue}>Rs.{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'wallet' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.7}>
            <Wallet
              size={wp(20)}
              color={
                paymentMethod === 'wallet' ? colors.secPrimary : colors.textMuted
              }
              strokeWidth={1.8}
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Wallet</Text>
              <Text style={styles.paymentSub}>Balance: Rs.500</Text>
            </View>
            {paymentMethod === 'wallet' && (
              <View style={styles.checkCircle}>
                <Check size={wp(12)} color={colors.white} strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'online' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('online')}
            activeOpacity={0.7}>
            <CreditCard
              size={wp(20)}
              color={
                paymentMethod === 'online'
                  ? colors.secPrimary
                  : colors.textMuted
              }
              strokeWidth={1.8}
            />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Online Payment</Text>
              <Text style={styles.paymentSub}>UPI, Cards, Net Banking</Text>
            </View>
            {paymentMethod === 'online' && (
              <View style={styles.checkCircle}>
                <Check size={wp(12)} color={colors.white} strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityRow}>
          <Shield size={wp(16)} color={colors.success} strokeWidth={1.8} />
          <Text style={styles.securityText}>
            100% secure payment. Money-back guarantee if astrologer doesn't
            join.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[styles.bottomBar, {paddingBottom: insets.bottom + hp(10)}]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>Rs.{totalAmount}</Text>
          <Text style={styles.bottomDuration}>{duration} min session</Text>
        </View>
        <TouchableOpacity
          style={styles.bottomBtn}
          activeOpacity={0.8}
          onPress={handleConfirm}>
          <Text style={styles.bottomBtnText}>Pay & Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(BookingConfirmation);

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
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  summaryInfo: {
    marginLeft: wp(12),
    flex: 1,
  },
  summaryName: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
  },
  summarySpec: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginVertical: hp(14),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    gap: hp(4),
  },
  detailLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginTop: hp(20),
    paddingHorizontal: wp(16),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(10),
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(8),
  },
  durationChip: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: wp(10),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  durationChipActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  durationText: {
    fontSize: fp(13),
    fontWeight: '500',
    color: colors.text,
  },
  durationTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(6),
  },
  priceLabel: {
    fontSize: fp(13),
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fp(13),
    fontWeight: '500',
    color: colors.text,
  },
  priceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginVertical: hp(6),
  },
  priceTotalLabel: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.text,
  },
  priceTotalValue: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  paymentOptionActive: {
    borderColor: colors.secPrimary,
    backgroundColor: colors.secPrimary + '08',
  },
  paymentInfo: {
    marginLeft: wp(12),
    flex: 1,
  },
  paymentTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  paymentSub: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(2),
  },
  checkCircle: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: colors.secPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(16),
    marginHorizontal: wp(16),
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    backgroundColor: colors.success + '10',
    borderRadius: wp(10),
  },
  securityText: {
    fontSize: fp(11),
    color: colors.success,
    flex: 1,
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
  bottomTotal: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
  },
  bottomDuration: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  bottomBtn: {
    backgroundColor: colors.secPrimary,
    borderRadius: wp(12),
    paddingHorizontal: wp(28),
    paddingVertical: hp(14),
    shadowColor: colors.secPrimary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
});
