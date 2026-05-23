import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const GoLiveCard = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  return (
    <View style={styles.sectionPadding}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (user?.kyc_verified) {
            navigation.navigate('CreateWebinar');
          } else {
            navigation.navigate('KYCVerificationScreen');
          }
        }}
      >
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveCard}
        >
          <View style={styles.liveLeft}>
            <View style={styles.liveIconWrap}>
              <Text style={styles.liveEmoji}>📡</Text>
            </View>
            <View style={styles.liveInfo}>
              <View style={styles.liveBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.liveBadgeText}>GO LIVE</Text>
              </View>
              <Text style={styles.liveTitle}>Start a Live Session</Text>
              <Text style={styles.liveSubtitle}>
                Connect with your audience in real time
              </Text>
            </View>
          </View>
          <ChevronRight size={wp(20)} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default memo(GoLiveCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  liveCard: {
    borderRadius: wp(18),
    padding: wp(18),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  liveLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  liveIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveEmoji: {
    fontSize: fp(24),
  },
  liveInfo: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    marginBottom: hp(4),
  },
  greenDot: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
    backgroundColor: colors.accent,
  },
  liveBadgeText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  liveTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(2),
  },
  liveSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
  },
});
