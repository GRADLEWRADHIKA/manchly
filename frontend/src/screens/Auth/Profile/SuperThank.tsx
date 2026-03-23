import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share as RnShare,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  ArrowLeft,
  UserRound,
  Rocket,
  Share2,
  Copy,
} from 'lucide-react-native';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';

const PURPLE = '#6A1B9A';
const PURPLE_DARK = '#551480';
const CARD_BG = '#FFFFFF';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const LINK = 'rpy.club/st/sumitbharti31';

const SuperThanks = () => {
  const navigation = useNavigation();

  const onShare = useCallback(async () => {
    try {
      await RnShare.share({
        message: `Support me via Super Thanks: https://${LINK}`,
      });
    } catch (e) {
      // no-op
    }
  }, []);

  const onCopy = useCallback(() => {
    Clipboard.setString(`https://${LINK}`);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Link copied to clipboard');
    }
  }, []);

  return (
    <View style={styles.safe}>
      {/* Header */}
      <AppHeaderWithBack title="Super Thanks" />

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationCircle}>
              <Rocket size={56} color="#FFF" />
            </View>
            <View style={styles.cloudRow}>
              <View style={[styles.cloud, { width: wp(70) }]} />
              <View style={[styles.cloud, { width: wp(110) }]} />
              <View style={[styles.cloud, { width: wp(80) }]} />
            </View>
          </View>

          <View style={styles.linkPill}>
            <Text
              style={styles.linkText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {LINK}
            </Text>
          </View>

          <Text style={styles.desc} numberOfLines={3}>
            Receive monetary gifts from fans by sharing super thanks links,
            thereby strengthening relationship with your fanbase.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.9}
              onPress={onShare}
            >
              <Share2 size={18} color="#FFF" />
              <Text style={styles.shareLabel}>SHARE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyIconBtn}
              onPress={onCopy}
              activeOpacity={0.8}
            >
              <Copy size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SuperThanks;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(14),
    paddingTop: hp(4),
    paddingBottom: hp(10),
    backgroundColor: PURPLE,
  },
  iconBtn: {
    width: wp(40),
    height: hp(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnRight: {
    width: wp(40),
    height: hp(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: fp(18),
    fontWeight: '700',
    textAlign: 'left',
    paddingLeft: wp(2),
  },

  body: {
    flex: 1,
    paddingHorizontal: wp(16),
    paddingTop: hp(24),
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    padding: wp(18),
    borderWidth: wp(1),
    borderColor: BORDER,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  illustrationWrap: {
    alignItems: 'center',
    marginTop: hp(6),
    marginBottom: hp(18),
  },
  illustrationCircle: {
    width: wp(160),
    height: wp(160),
    borderRadius: wp(160),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  cloudRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(10),
  },
  cloud: {
    height: hp(18),
    borderRadius: wp(999),
    backgroundColor: '#EDE9FE',
  },

  linkPill: {
    alignSelf: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: wp(999),
    backgroundColor: '#F3F4F6',
    borderWidth: wp(1),
    borderColor: '#E5E7EB',
    marginBottom: hp(12),
    minWidth: wp(240),
  },
  linkText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },

  desc: {
    color: MUTED,
    textAlign: 'left',
    lineHeight: fp(20),
  },

  actionsRow: {
    marginTop: hp(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  shareBtn: {
    flex: 1,
    height: hp(48),
    borderRadius: wp(12),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(10),
  },
  shareLabel: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  copyIconBtn: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(12),
    borderWidth: wp(1),
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
});
