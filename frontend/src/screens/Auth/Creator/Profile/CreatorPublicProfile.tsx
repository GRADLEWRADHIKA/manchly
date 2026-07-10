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
  Star,
  Briefcase,
  Globe,
  ArrowLeft,
  MapPin,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { InstagramIcon, LinkedinIcon, YoutubeIcon, FacebookIcon } from '../../../../components/SocialIcons';
import CreatorCenter from '../CreatorCenter/CreatorCenter';
const CreatorPublicProfile = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const creator = route.params?.creator;
  const { user } = useSelector((state: any) => state.userReducer);
  const [sessionProducts, setSessionProducts] = React.useState<any[]>([]);
  const [expert, setExpert] = React.useState<any>(null);

  React.useEffect(() => {
    const creatorId = creator?.id || creator?._id;
    if (creatorId && isFocused) {
      dispatch(getCreatorSessionProducts(creatorId))
        .unwrap()
        .then((res: any) => {
          setSessionProducts(res?.data?.products || []);
          setExpert(res?.data?.expert || null);
        });
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

  const socialLinks = [
    creator?.instagram_link && {
      key: 'instagram',
      url: creator.instagram_link,
      icon: InstagramIcon,
      color: '#E1306C',
      label: 'Instagram',
    },
    creator?.linkedin_link && {
      key: 'linkedin',
      url: creator.linkedin_link,
      icon: LinkedinIcon,
      color: '#0077B5',
      label: 'LinkedIn',
    },
    creator?.youtube_link && {
      key: 'youtube',
      url: creator.youtube_link,
      icon: YoutubeIcon,
      color: '#FF0000',
      label: 'YouTube',
    },
    creator?.facebook_link && {
      key: 'facebook',
      url: creator.facebook_link,
      icon: FacebookIcon,
      color: '#1877F2',
      label: 'Facebook',
    },
  ].filter(Boolean) as any[];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#3B0D0D', '#692626', '#8B3A3A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + hp(10) }]}
        >
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + hp(10) }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft
              size={wp(22)}
              color={colors.white}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Avatar */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              {creator?.profile_image ? (
                <Image source={{ uri: creator.profile_image }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={['#8B3A3A', '#692626']}
                  style={styles.avatarFallback}
                >
                  <User2 size={wp(40)} color={colors.white} />
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Name & Profession */}
          <Text style={styles.profileName}>{displayName}</Text>
          {expert?.profession && (
            <View style={styles.professionRow}>
              <Briefcase size={wp(13)} color={'rgba(255,255,255,0.6)'} />
              <Text style={styles.professionText}>{expert.profession}</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {expert?.rating > 0 && (
              <View style={styles.statItem}>
                <Star size={wp(14)} color={'#FBBF24'} fill={'#FBBF24'} />
                <Text style={styles.statValue}>{expert.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            )}
            {expert?.experience > 0 && (
              <View style={styles.statItem}>
                <Briefcase size={wp(14)} color={'#F97316'} />
                <Text style={styles.statValue}>{expert.experience}+</Text>
                <Text style={styles.statLabel}>Years</Text>
              </View>
            )}
            {expert?.total_sessions > 0 && (
              <View style={styles.statItem}>
                <Video size={wp(14)} color={'#34D399'} />
                <Text style={styles.statValue}>{expert.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            )}
            {expert?.languages?.length > 0 && (
              <View style={styles.statItem}>
                <Globe size={wp(14)} color={'#FB923C'} />
                <Text style={styles.statValue}>{expert.languages.length}</Text>
                <Text style={styles.statLabel}>Languages</Text>
              </View>
            )}
          </View>

          {/* KYC Badge */}
          <View
            style={[
              styles.kycBadge,
              creator?.kyc_verified ? styles.kycVerified : styles.kycNotVerified,
            ]}
          >
            {creator?.kyc_verified ? (
              <ShieldCheck size={wp(12)} color={colors.golden} />
            ) : (
              <ShieldX size={wp(12)} color="rgba(255,255,255,0.4)" />
            )}
            <Text
              style={[
                styles.kycText,
                { color: creator?.kyc_verified ? colors.golden : 'rgba(255,255,255,0.4)' },
              ]}
            >
              {creator?.kyc_verified ? 'KYC Verified' : 'KYC Not Verified'}
            </Text>
          </View>
        </LinearGradient>

          {/* Social Links */}
          {hasSocialLinks && (
            <>
              <View style={styles.divider} />
              <View style={styles.socialGrid}>
                {creator?.instagram_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.instagram_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#E1306C20' }]}>
                      <InstagramIcon size={wp(20)} color="#E1306C" />
                    </View>
                  </TouchableOpacity>
                ) : null}
                {creator?.linkedin_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.linkedin_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#0077B520' }]}>
                      <LinkedinIcon size={wp(20)} color="#0077B5" />
                    </View>
                  </TouchableOpacity>
                ) : null}
                {creator?.youtube_link ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.youtube_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#FF000020' }]}>
                      <YoutubeIcon size={wp(20)} color="#FF0000" />
                    </View>
                  </TouchableOpacity>
                ) : null}
                {creator?.facebook_link ? (
                  <TouchableOpacity
                    key={s.key}
                    style={styles.socialBtn}
                    onPress={() => openLink(s.url)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#1877F220' }]}>
                      <FacebookIcon size={wp(20)} color="#1877F2" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default CreatorPublicProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },
  profileCard: {
    backgroundColor: '#14141F',
    marginHorizontal: wp(16),
    marginTop: hp(20),
    borderRadius: wp(20),
    paddingVertical: hp(30),
    paddingHorizontal: wp(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Avatar
  avatarOuter: {
    padding: wp(4),
    borderRadius: wp(62),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: hp(14),
  },
  avatarInner: {
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,182,6,0.4)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileName: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(12),
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(18),
  },
  professionText: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: wp(14),
    paddingVertical: hp(12),
    paddingHorizontal: wp(8),
    gap: wp(4),
    marginBottom: hp(14),
    alignSelf: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(3),
  },
  statValue: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },

  // KYC
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
  },
  kycVerified: {
    backgroundColor: 'rgba(255,182,6,0.08)',
    borderColor: 'rgba(255,182,6,0.35)',
  },
  kycNotVerified: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  kycText: {
    fontSize: fp(11),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: hp(20),
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(14),
  },
  socialBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
