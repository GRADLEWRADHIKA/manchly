import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import {
  User2,
  ShieldCheck,
  ShieldX,
  Video,
  Clock,
  IndianRupee,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { InstagramIcon, LinkedinIcon, YoutubeIcon, FacebookIcon } from '../../../../components/SocialIcons';
import { createSession, getCreatorSessionProducts, bookSession } from '../../../../store/SessionSlice';

const CreatorPublicProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const creator = route.params?.creator;
  const { user } = useSelector((state: any) => state.userReducer);
  const [sessionProducts, setSessionProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const creatorId = creator?.id || creator?._id;
    if (creatorId && isFocused) {
      dispatch(getCreatorSessionProducts(creatorId))
        .unwrap()
        .then((res: any) => setSessionProducts(res?.data?.products || []));
    }
  }, [isFocused, creator]);

  const displayName = creator?.name
    ? creator.name.charAt(0).toUpperCase() + creator.name.slice(1)
    : 'Creator';

  const openLink = async (url: string) => {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    let appUrl: string | null = null;

    if (/instagram\.com/i.test(finalUrl)) {
      const username = finalUrl.match(/instagram\.com\/([^/?]+)/)?.[1];
      if (username) appUrl = `instagram://user?username=${username}`;
    } else if (/linkedin\.com/i.test(finalUrl)) {
      appUrl = `linkedin://in/${finalUrl.split('/in/')[1] || ''}`;
    } else if (/youtube\.com|youtu\.be/i.test(finalUrl)) {
      const channelMatch = finalUrl.match(/youtube\.com\/(channel|c|@)\/?([\w-]+)/);
      if (channelMatch) appUrl = `youtube://${channelMatch[0].replace('youtube.com/', '')}`;
    } else if (/facebook\.com/i.test(finalUrl)) {
      appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(finalUrl)}`;
    }

    if (appUrl) {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        Linking.openURL(appUrl);
        return;
      }
    }

    Linking.openURL(finalUrl).catch(() => {
      Toast.show({ type: 'error', text1: 'Could not open link', position: 'bottom' });
    });
  };

  const hasSocialLinks =
    creator?.instagram_link || creator?.linkedin_link || creator?.youtube_link || creator?.facebook_link;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Creator Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.imageWrapper}>
              {creator?.profile_image ? (
                <Image source={{ uri: creator.profile_image }} style={styles.profileImage} />
              ) : (
                <User2 size={wp(44)} color={colors.white} />
              )}
            </View>
          </View>

          {/* Name */}
          <Text style={styles.profileName}>{displayName}</Text>

          {/* Book Session Products (user can only book, expert calls) */}

          {/* Bookable Session Products */}
          {sessionProducts.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.connectTitle}>Book a Session</Text>
              <View style={{alignSelf: 'stretch', gap: hp(8)}}>
                {sessionProducts.map((product: any) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        dispatch(bookSession({product_id: product.id}))
                          .unwrap()
                          .then((res: any) => {
                            const session = res?.data;
                            navigation.navigate('CallScreen', {
                              callID: session.call_id,
                              userID: user?.id,
                              userName: user?.name || 'User',
                              mode: 'video',
                              sessionId: session.id,
                            });
                          });
                      }}>
                      <View style={[styles.productIcon, {backgroundColor: colors.success + '15'}]}>
                        <Video size={wp(20)} color={colors.success} strokeWidth={1.8} />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.productName}>{product.title}</Text>
                        <Text style={styles.productMeta}>
                          {product.duration} min · Video
                        </Text>
                      </View>
                      <Text style={styles.productPrice}>₹{product.price}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* KYC Badge */}
          <View
            style={[
              styles.kycBadge,
              creator?.kyc_verified ? styles.kycVerified : styles.kycNotVerified,
            ]}
          >
            {creator?.kyc_verified ? (
              <ShieldCheck size={wp(14)} color={colors.success} />
            ) : (
              <ShieldX size={wp(14)} color={colors.error} />
            )}
            <Text
              style={[
                styles.kycText,
                { color: creator?.kyc_verified ? colors.success : colors.error },
              ]}
            >
              {creator?.kyc_verified ? 'KYC Verified' : 'KYC Not Verified'}
            </Text>
          </View>

          {/* Social Links */}
          {hasSocialLinks && (
            <>
              <View style={styles.divider} />
              <Text style={styles.connectTitle}>Connect</Text>
              <View style={styles.socialGrid}>
                {creator?.instagram_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.instagram_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#E1306C15' }]}>
                      <InstagramIcon size={wp(22)} color="#E1306C" />
                    </View>
                    <Text style={styles.socialLabel}>Instagram</Text>
                  </TouchableOpacity>
                ) : null}
                {creator?.linkedin_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.linkedin_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#0077B515' }]}>
                      <LinkedinIcon size={wp(22)} color="#0077B5" />
                    </View>
                    <Text style={styles.socialLabel}>LinkedIn</Text>
                  </TouchableOpacity>
                ) : null}
                {creator?.youtube_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.youtube_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#FF000015' }]}>
                      <YoutubeIcon size={wp(22)} color="#FF0000" />
                    </View>
                    <Text style={styles.socialLabel}>YouTube</Text>
                  </TouchableOpacity>
                ) : null}
                {creator?.facebook_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.facebook_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#1877F215' }]}>
                      <FacebookIcon size={wp(22)} color="#1877F2" />
                    </View>
                    <Text style={styles.socialLabel}>Facebook</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorPublicProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },
  profileCard: {
    backgroundColor: colors.cCard,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(30),
    paddingHorizontal: wp(20),
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  avatarContainer: {
    marginBottom: hp(16),
  },
  imageWrapper: {
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
    backgroundColor: colors.cAccent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.cAccentLight + '40',
  },
  profileImage: {
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
  },
  profileName: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.cText,
    marginBottom: hp(12),
  },
  sessionBtns: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(16),
  },
  sessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
    borderRadius: wp(12),
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  sessionBtnText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cCardLight,
    borderRadius: wp(12),
    padding: wp(12),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  productIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  productName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.cText,
  },
  productMeta: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    marginTop: hp(2),
  },
  productPrice: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.cAccentLight,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(14),
    paddingVertical: hp(7),
    borderRadius: wp(20),
    borderWidth: 1,
  },
  kycVerified: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  kycNotVerified: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  kycText: {
    fontSize: fp(12),
    fontWeight: '700',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.cBorder,
    marginVertical: hp(20),
  },
  connectTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.cTextSecondary,
    marginBottom: hp(14),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: wp(12),
  },
  socialBtn: {
    alignItems: 'center',
    gap: hp(8),
    width: wp(80),
  },
  socialIconWrap: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialLabel: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    fontWeight: '600',
  },
});
