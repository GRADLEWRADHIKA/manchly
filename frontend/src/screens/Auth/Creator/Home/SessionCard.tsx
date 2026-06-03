import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, Clock, DollarSign, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const SessionCard = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { stats: sessionStats, expertProfile } = useSelector(
    (state: any) => state.sessionReducer,
  );

  return (
    <View style={styles.sectionPadding}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (!user?.kyc_verified) {
            navigation.navigate('KYCVerificationScreen');
          } else if (expertProfile) {
            navigation.navigate('CreatorBottomTab', {
              screen: 'ProductsScreen',
              params: { initialTab: 'Sessions' },
            });
          } else {
            navigation.navigate('ExpertRegistration');
          }
        }}
      >
        <LinearGradient
          colors={['#1A1A2E', '#1C1C38', '#241845']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sessionCard}
        >
          <View style={styles.sessionTopRow}>
            <View style={styles.sessionIconCircle}>
              <Phone size={wp(20)} color={colors.white} />
            </View>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>
                {sessionStats?.total_sessions ?? 0} Sessions
              </Text>
            </View>
          </View>

          <Text style={styles.sessionTitle}>1:1 Sessions</Text>
          <Text style={styles.sessionSubtitle}>
            Monetize your expertise with paid video calls
          </Text>

          <View style={styles.sessionChipsRow}>
            <View style={styles.sessionChip}>
              <Clock size={wp(12)} color={colors.white} />
              <Text style={styles.sessionChipText}>Flexible timing</Text>
            </View>
            <View style={styles.sessionChip}>
              <DollarSign size={wp(12)} color={colors.white} />
              <Text style={styles.sessionChipText}>Set your price</Text>
            </View>
          </View>

          <View style={styles.sessionBottomRow}>
            <Text style={styles.sessionCtaText}>
              {expertProfile ? 'View Sessions' : 'Get Started'}
            </Text>
            <View style={styles.sessionArrowCircle}>
              <ChevronRight size={wp(16)} color="#0A2342" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default memo(SessionCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  sessionCard: {
    borderRadius: wp(18),
    padding: wp(18),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  sessionIconCircle: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(91,181,245,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91,181,245,0.25)',
  },
  sessionBadge: {
    backgroundColor: 'rgba(91,181,245,0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },
  sessionBadgeText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.white,
  },
  sessionTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(4),
  },
  sessionSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
    marginBottom: hp(14),
  },
  sessionChipsRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginBottom: hp(16),
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: 'rgba(91,181,245,0.1)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: 'rgba(91,181,245,0.15)',
  },
  sessionChipText: {
    fontSize: fp(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  sessionBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCtaText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  sessionArrowCircle: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
