import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  Menu,
  Bell,
  Check,
  User,
  Wallet,
  Landmark,
  LogOut,
  ChevronRight,
  Youtube,
  Linkedin,
  Instagram,
  Star,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { logout } from '../../../../store/UserSlice';
import { formatINR } from '../../../../components/FormField';

const { width } = Dimensions.get('window');

interface SocialItem {
  platform: string;
  icon: React.ComponentType<any>;
  url: string;
}

interface AccountRowItem {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  meta?: string;
  route?: string;
  action?: () => void;
  isLogout?: boolean;
}

const CreatorSetting: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const { user } = useSelector((state: any) => state.userReducer);

  // States
  const [showDropdown, setShowDropdown] = useState(false);

  // Social icons list mapped array
  const socials: SocialItem[] = [
    { platform: 'YouTube', icon: Youtube, url: user?.youtube_link || 'https://youtube.com' },
    { platform: 'LinkedIn', icon: Linkedin, url: user?.linkedin_link || 'https://linkedin.com' },
    { platform: 'Instagram', icon: Instagram, url: user?.instagram_link || 'https://instagram.com' },
  ];

  const handleLogout = () => {
    setShowDropdown(false);
    dispatch(logout());
    Toast.show({
      type: 'success',
      text1: 'Logged Out',
      text2: 'You have been successfully logged out.',
      position: 'bottom',
    });
  };

  // Account section list rows mapping
  const accountRows: AccountRowItem[] = [
    {
      id: 'profile',
      icon: User,
      title: 'My Profile',
      meta: 'Manage profile, edit…',
      route: 'CreatorProfile',
    },
    {
      id: 'wallet',
      icon: Wallet,
      title: 'Wallet',
      meta: 'Account and transactions',
      route: 'WalletCreator',
    },
    {
      id: 'bank',
      icon: Landmark,
      title: 'Bank Details',
      meta: 'Manage bank information',
      route: 'BankDetails',
    },
    {
      id: 'logout',
      icon: LogOut,
      title: 'Logout',
      isLogout: true,
      action: () => setShowDropdown(true),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg || '#0F0F0F'} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Toast.show({ type: 'info', text1: 'Settings Menu' })}
            activeOpacity={0.75}
          >
            <Menu size={22} color={colors.white || '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>Manchly</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('CreatorNotification')}
            activeOpacity={0.75}
          >
            <Bell size={22} color={colors.white || '#FFFFFF'} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'CR'}
                  </Text>
                </View>
              )}
              {/* Overlapping Gold Verification Badge */}
              <View style={styles.verifyBadge}>
                <Check size={8} color="#000000" strokeWidth={4} />
              </View>
            </View>

            <Text style={styles.profileName}>
              {user?.name ? user.name.toUpperCase() : 'CREATOR'}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>PRESENTER</Text>
            </View>

            <Text style={styles.bioText} numberOfLines={3}>
              {user?.bio || 'Empowering creators worldwide. Hosting live workshops, custom webinars, and 1:1 business consultation sessions.'}
            </Text>

            {/* Pill Buttons Row */}
            <View style={styles.pillButtonsRow}>
              <TouchableOpacity
                style={styles.outlinedPill}
                onPress={() => navigation.navigate('CreatorProfile')}
                activeOpacity={0.8}
              >
                <Text style={styles.outlinedPillText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlinedPill}
                onPress={() => Toast.show({ type: 'success', text1: 'Link copied to clipboard' })}
                activeOpacity={0.8}
              >
                <Text style={styles.outlinedPillText}>Share Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Social Icons Row */}
            <View style={styles.socialRow}>
              {socials.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.socialCircle}
                    onPress={() => Toast.show({ type: 'info', text1: `Opening ${item.platform}` })}
                    activeOpacity={0.8}
                  >
                    <IconComponent size={16} color={colors.white || '#FFFFFF'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bestselling Product Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>BESTSELLING PRODUCT</Text>
            <View style={styles.bestsellerRow}>
              <View style={styles.productThumbnailContainer}>
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.productThumbnail} />
                ) : (
                  <View style={[styles.productThumbnail, styles.productThumbnailFallback]} />
                )}
              </View>

              <View style={styles.productInfo}>
                <View style={styles.mostLovedBadge}>
                  <Text style={styles.mostLovedText}>MOST LOVED</Text>
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>
                  Mastering UI Design: Layout & Components
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatINR(199.0)}</Text>
                  <TouchableOpacity
                    style={styles.followButton}
                    onPress={() => Toast.show({ type: 'success', text1: 'Following course updates' })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.followButtonText}>FOLLOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Metric Chips Row */}
            <View style={styles.metricChipsRow}>
              <View style={styles.metricChip}>
                <Text style={styles.chipValue}>12.8k</Text>
                <Text style={styles.chipLabel}>Students</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.chipValue}>24</Text>
                <Text style={styles.chipLabel}>Courses</Text>
              </View>
            </View>

            {/* Instructor Rating */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Instructor Rating</Text>
              <View style={styles.ratingValueContainer}>
                <Star size={12} color={colors.gold || '#F0C040'} fill={colors.gold || '#F0C040'} style={styles.starIcon} />
                <Text style={styles.ratingValueText}>4.92 ★</Text>
              </View>
            </View>
          </View>

          {/* Published Courses Section */}
          <View style={styles.card}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>Published Courses</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProductsScreen', { initialTab: 'Courses' })}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {/* Single horizontal Course card */}
            <View style={styles.courseCard}>
              <View style={styles.courseThumbnailContainer}>
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.courseImage} />
                ) : (
                  <View style={[styles.courseImage, { backgroundColor: colors.border || '#2A2A2C' }]} />
                )}
              </View>
              <View style={styles.courseDetails}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  Advanced Culinary Arts: French Techniques
                </Text>
                <Text style={styles.courseDesc} numberOfLines={2}>
                  Learn classical culinary technique and kitchen organization methods.
                </Text>

                <View style={styles.coursePriceRow}>
                  <Text style={styles.coursePrice}>{formatINR(199.0)}</Text>
                  <TouchableOpacity
                    style={styles.courseFollowButton}
                    onPress={() => Toast.show({ type: 'success', text1: 'Following course' })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.courseFollowText}>FOLLOW</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={styles.completionsContainer}>
                  <View style={styles.completionsHeader}>
                    <Text style={styles.completionsLabel}>All Learners</Text>
                    <Text style={styles.completionsValue}>84%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: '84%' }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.accountSection}>
            <Text style={styles.accountSectionLabel}>ACCOUNT</Text>
            {accountRows.map(row => (
              <TouchableOpacity
                key={row.id}
                style={styles.accountRow}
                onPress={() => {
                  if (row.route) {
                    navigation.navigate(row.route);
                  } else if (row.action) {
                    row.action();
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.accountRowLeft}>
                  <View style={[styles.accountIconContainer, row.isLogout && styles.logoutIconBg]}>
                    <row.icon size={18} color={row.isLogout ? '#EF4444' : colors.white || '#FFFFFF'} />
                  </View>
                  <View style={styles.accountTextContainer}>
                    <Text style={[styles.accountRowTitle, row.isLogout && styles.logoutTitleText]}>
                      {row.title}
                    </Text>
                    {row.meta && <Text style={styles.accountRowMeta}>{row.meta}</Text>}
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textSecondary || '#888888'} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Screen 10 Dropdown Logout Overlay */}
      {showDropdown && (
        <View style={styles.overlayContainer}>
          {/* Scrim cover */}
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.scrim} />
          </TouchableWithoutFeedback>

          {/* Floating Dropdown Card */}
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownRow}>
              <LogOut size={18} color="#EF4444" style={styles.dropdownIcon} />
              <View style={styles.dropdownTextCol}>
                <Text style={styles.dropdownTitle}>Log Out</Text>
                <Text style={styles.dropdownMeta}>
                  Are you sure you want to log out of the app?
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmPill}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmPillText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.cancelRow}
              onPress={() => setShowDropdown(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* Quick Links */}
            <TouchableOpacity
              style={styles.quickLinkRow}
              onPress={() => {
                setShowDropdown(false);
                navigation.navigate('BankDetails');
              }}
              activeOpacity={0.8}
            >
              <Landmark size={14} color={colors.textSecondary || '#888888'} style={styles.quickLinkIcon} />
              <Text style={styles.quickLinkLabel}>Bank Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkRow}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={14} color={colors.textSecondary || '#888888'} style={styles.quickLinkIcon} />
              <Text style={styles.quickLinkLabel}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default CreatorSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#0F0F0F',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#2A2A2C',
  },
  iconButton: {
    padding: wp(6),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(6),
    right: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.gold || '#F0C040',
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.gold || '#F0C040',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  // Profile Header Card
  profileCard: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(20),
    marginHorizontal: wp(16),
    marginTop: hp(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
    marginBottom: hp(12),
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.goldDim || 'rgba(240, 192, 64, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  avatarInitials: {
    fontSize: fp(24),
    fontWeight: '700',
    color: colors.gold || '#F0C040',
  },
  verifyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold || '#F0C040',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface || '#1C1C1E',
  },
  profileName: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(4),
  },
  roleBadge: {
    backgroundColor: colors.goldDim || 'rgba(240, 192, 64, 0.1)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: 6,
    marginBottom: hp(12),
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold || '#F0C040',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: fp(12),
    color: colors.textSecondary || '#888888',
    textAlign: 'center',
    lineHeight: fp(18),
    paddingHorizontal: wp(10),
    marginBottom: hp(12),
  },
  pillButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: wp(10),
    marginBottom: hp(16),
  },
  outlinedPill: {
    flex: 1,
    height: hp(36),
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedPillText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(16),
  },
  socialCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBg || '#242426',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border || '#2A2A2C',
  },

  // Card general
  card: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: wp(14),
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold || '#F0C040',
    letterSpacing: 0.8,
    marginBottom: hp(8),
  },

  // Bestselling row
  bestsellerRow: {
    flexDirection: 'row',
  },
  productThumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: wp(12),
  },
  productThumbnail: {
    width: 60,
    height: 60,
  },
  productThumbnailFallback: {
    backgroundColor: colors.border || '#2A2A2C',
  },
  productInfo: {
    flex: 1,
  },
  mostLovedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240, 192, 64, 0.12)',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderRadius: 4,
    marginBottom: hp(3),
  },
  mostLovedText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.gold || '#F0C040',
  },
  productTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.gold || '#F0C040',
  },
  followButton: {
    backgroundColor: colors.gold || '#F0C040',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 12,
  },
  followButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  metricChipsRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginTop: hp(12),
    marginBottom: hp(10),
  },
  metricChip: {
    flex: 1,
    backgroundColor: colors.inputBg || '#242426',
    borderRadius: 10,
    padding: wp(8),
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border || '#2A2A2C',
  },
  chipValue: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },
  chipLabel: {
    fontSize: fp(10),
    color: colors.textSecondary || '#888888',
    marginTop: hp(2),
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(8),
    borderTopWidth: 0.5,
    borderTopColor: colors.border || '#2A2A2C',
  },
  ratingLabel: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: wp(3),
  },
  ratingValueText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold || '#F0C040',
  },

  // Published Courses Section
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  listHeaderTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  viewAllText: {
    fontSize: fp(12),
    color: colors.gold || '#F0C040',
  },
  courseCard: {
    backgroundColor: colors.inputBg || '#242426',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.border || '#2A2A2C',
  },
  courseThumbnailContainer: {
    width: '100%',
    height: hp(100),
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseDetails: {
    padding: wp(12),
  },
  courseTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(4),
  },
  courseDesc: {
    fontSize: fp(10),
    color: colors.textMuted || '#555558',
    marginBottom: hp(10),
    lineHeight: fp(14),
  },
  coursePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  coursePrice: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.gold || '#F0C040',
  },
  courseFollowButton: {
    backgroundColor: colors.gold || '#F0C040',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: 12,
  },
  courseFollowText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  completionsContainer: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border || '#2A2A2C',
    paddingTop: hp(8),
  },
  completionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  completionsLabel: {
    fontSize: 9,
    color: colors.textSecondary || '#888888',
  },
  completionsValue: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border || '#2A2A2C',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold || '#F0C040',
    borderRadius: 99,
  },

  // Account section
  accountSection: {
    paddingHorizontal: wp(16),
    marginTop: hp(16),
  },
  accountSectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    letterSpacing: 0.8,
    marginBottom: hp(8),
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 12,
    padding: wp(14),
    marginBottom: hp(6),
    borderWidth: 0.5,
    borderColor: colors.border || '#2A2A2C',
  },
  accountRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.inputBg || '#242426',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  logoutIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  accountTextContainer: {
    justifyContent: 'center',
  },
  accountRowTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(2),
  },
  logoutTitleText: {
    color: '#EF4444',
  },
  accountRowMeta: {
    fontSize: fp(10),
    color: colors.textSecondary || '#888888',
  },

  // Scrim Overlay
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dropdownCard: {
    position: 'absolute',
    top: hp(54),
    right: wp(16),
    width: 240,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#303030',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
  },
  dropdownIcon: {
    marginRight: wp(8),
    marginTop: hp(2),
  },
  dropdownTextCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: wp(6),
  },
  dropdownTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(2),
  },
  dropdownMeta: {
    fontSize: fp(9),
    color: colors.textMuted || '#555558',
    lineHeight: fp(12),
  },
  confirmPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 10,
    alignSelf: 'center',
  },
  confirmPillText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '700',
  },
  dropdownDivider: {
    height: 0.5,
    backgroundColor: '#303030',
    marginHorizontal: 4,
  },
  cancelRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: fp(13),
    fontWeight: '500',
    color: colors.white || '#FFFFFF',
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
  },
  quickLinkIcon: {
    marginRight: wp(10),
  },
  quickLinkLabel: {
    fontSize: fp(12),
    color: colors.white || '#FFFFFF',
    fontWeight: '500',
  },
});
