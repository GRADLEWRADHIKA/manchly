import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';

/**
 * Post-purchase thank-you screen (Feature #5).
 * Params: { productType: 'course'|'webinar', title, whatsappUrl?, message?, contentRoute? }
 */
const PurchaseThankYou: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    productType = 'course',
    title,
    whatsappUrl,
    message,
    contentRoute,
  } = route.params || {};

  const openCommunity = async () => {
    if (!whatsappUrl) return;
    try {
      const ok = await Linking.canOpenURL(whatsappUrl);
      if (ok) {
        await Linking.openURL(whatsappUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: "Couldn't open the link",
          position: 'top',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: "Couldn't open the link",
        position: 'top',
      });
    }
  };

  const goToContent = () => {
    navigation.reset({
      index: 0,
      routes: [
        contentRoute
          ? { name: 'UserBottomTab', params: { screen: contentRoute } }
          : { name: 'UserBottomTab' },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={wp(56)} color={colors.success} strokeWidth={1.6} />
        </View>

        <Text style={styles.title}>Thank you for your purchase!</Text>
        <Text style={styles.subtitle}>
          You now have access to{' '}
          <Text style={styles.subtitleStrong}>{title || 'your purchase'}</Text>.
        </Text>

        {!!message && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {!!whatsappUrl && (
          <View style={styles.communityCard}>
            <Text style={styles.communityLabel}>Join the community</Text>
            <Text style={styles.communitySub}>
              Connect with the {productType === 'webinar' ? 'host' : 'creator'} and
              other members.
            </Text>
            <TouchableOpacity
              style={styles.communityBtn}
              onPress={openCommunity}
              activeOpacity={0.85}>
              <MessageCircle size={wp(18)} color={colors.white} />
              <Text style={styles.communityBtnText}>Join on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.contentBtn}
        onPress={goToContent}
        activeOpacity={0.85}>
        <Text style={styles.contentBtnText}>Go to my content</Text>
        <ArrowRight size={wp(18)} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

export default PurchaseThankYou;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.uBg,
    padding: wp(24),
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(24),
  },
  title: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fp(14),
    color: colors.uSubHeading,
    textAlign: 'center',
    marginTop: hp(10),
    lineHeight: fp(20),
    paddingHorizontal: wp(8),
  },
  subtitleStrong: {
    color: colors.white,
    fontWeight: '700',
  },
  messageCard: {
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    padding: wp(16),
    marginTop: hp(22),
    width: '100%',
  },
  messageText: {
    fontSize: fp(13),
    color: colors.white,
    lineHeight: fp(19),
    textAlign: 'center',
  },
  communityCard: {
    backgroundColor: colors.uCard,
    borderRadius: wp(16),
    padding: wp(18),
    marginTop: hp(22),
    width: '100%',
    alignItems: 'center',
  },
  communityLabel: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  communitySub: {
    fontSize: fp(12),
    color: colors.uSubHeading,
    textAlign: 'center',
    marginTop: hp(4),
    marginBottom: hp(14),
  },
  communityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: '#25D366',
    borderRadius: wp(12),
    paddingVertical: hp(13),
    paddingHorizontal: wp(24),
    width: '100%',
  },
  communityBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  contentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: colors.secPrimary,
    borderRadius: wp(14),
    paddingVertical: hp(16),
  },
  contentBtnText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
});
