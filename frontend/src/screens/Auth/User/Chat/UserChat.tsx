import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { MessageCircle, Sparkles, Construction } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const GhostChatRow = ({ delay = 0 }: { delay?: number }) => {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 900,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.ghostRow, { opacity: pulse }]}>
      <View style={styles.ghostAvatar} />
      <View style={styles.ghostContent}>
        <View style={styles.ghostName} />
        <View style={styles.ghostMessage} />
      </View>
      <View style={styles.ghostTime} />
    </Animated.View>
  );
};

const UserChat = () => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader title="Chats" />

      <View style={styles.content}>
        <View style={styles.ghostList}>
          {[0, 150, 300, 450, 600].map((delay, i) => (
            <GhostChatRow key={i} delay={delay} />
          ))}
        </View>

        <Animated.View
          style={[
            styles.comingSoonCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <MessageCircle
              size={wp(30)}
              color={colors.secPrimary}
              strokeWidth={1.8}
            />
            <View style={styles.sparkleWrap}>
              <Sparkles size={wp(14)} color="#F59E0B" strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.comingSoonTitle}>Chats Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>
            We're building a seamless messaging{'\n'}experience for you.
            Stay tuned!
          </Text>

          <View style={styles.featureList}>
            {['Direct messaging with creators', '1-on-1 Audio & Video calls', 'Real-time notifications'].map(
              (feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ),
            )}
          </View>

          <View style={styles.buildingBadge}>
            <Construction
              size={wp(14)}
              color={colors.secPrimary}
              strokeWidth={2}
            />
            <Text style={styles.buildingText}>Under Development</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default UserChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    position: 'relative',
  },

  ghostList: {
    paddingTop: hp(12),
  },
  ghostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(18),
    paddingVertical: hp(12),
  },
  ghostAvatar: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(15),
    backgroundColor: '#e8ecf0',
  },
  ghostContent: {
    flex: 1,
    marginLeft: wp(12),
    gap: hp(6),
  },
  ghostName: {
    width: '55%',
    height: hp(12),
    borderRadius: wp(6),
    backgroundColor: '#e8ecf0',
  },
  ghostMessage: {
    width: '80%',
    height: hp(10),
    borderRadius: wp(5),
    backgroundColor: '#f1f3f5',
  },
  ghostTime: {
    width: wp(36),
    height: hp(10),
    borderRadius: wp(5),
    backgroundColor: '#f1f3f5',
    marginLeft: wp(8),
  },

  comingSoonCard: {
    position: 'absolute',
    top: hp(80),
    left: wp(28),
    right: wp(28),
    backgroundColor: colors.white,
    borderRadius: wp(20),
    paddingVertical: hp(28),
    paddingHorizontal: wp(24),
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ecf0',
  },
  iconCircle: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(22),
    backgroundColor: '#1E3A5F0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: '#1E3A5F12',
  },
  sparkleWrap: {
    position: 'absolute',
    top: -hp(2),
    right: -wp(4),
  },
  comingSoonTitle: {
    fontSize: fp(19),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(19),
    marginTop: hp(6),
  },
  featureList: {
    marginTop: hp(20),
    alignSelf: 'stretch',
    gap: hp(10),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  featureDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.secPrimary,
  },
  featureText: {
    fontSize: fp(13),
    color: colors.text,
    fontWeight: '500',
  },
  buildingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(20),
    paddingHorizontal: wp(14),
    paddingVertical: hp(7),
    borderRadius: wp(20),
    backgroundColor: '#1E3A5F08',
    borderWidth: 1,
    borderColor: '#1E3A5F10',
  },
  buildingText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.secPrimary,
  },
});
