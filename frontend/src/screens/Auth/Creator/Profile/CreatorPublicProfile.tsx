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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  User2,
  ShieldCheck,
  ShieldX,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { InstagramIcon, LinkedinIcon, YoutubeIcon, FacebookIcon } from '../../../../components/SocialIcons';
import CreatorCenter from '../CreatorCenter/CreatorCenter';
const CreatorPublicProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const creator = route.params?.creator;

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
      Toast.show({ type: 'error', text1: 'Could not open link', position: 'top' });
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
                    style={styles.socialBtn}
                    onPress={() => openLink(creator.facebook_link)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.socialIconWrap, { backgroundColor: '#1877F220' }]}>
                      <FacebookIcon size={wp(20)} color="#1877F2" />
                    </View>
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
  avatarContainer: {
    marginBottom: hp(16),
  },
  imageWrapper: {
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
    width: wp(110),
    height: wp(110),
    borderRadius: wp(55),
  },
  profileName: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(12),
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