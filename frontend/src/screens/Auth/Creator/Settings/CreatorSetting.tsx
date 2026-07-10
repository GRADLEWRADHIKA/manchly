import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
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
  Settings,
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
  const insets = useSafeAreaInsets();

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

      <View style={styles.safeArea}>
        {/* Top Bar — same as Home */}
        <View style={[styles.topBar, { paddingTop: insets.top + hp(8) }]}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('CreatorProfile')}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarText}>
                    {(user?.name || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.greetingSmall}>Settings</Text>
              <Text style={styles.greetingName}>
                {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'Creator'}
              </Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('CreatorSettingsDetails')}
            >
              <Settings size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('CreatorNotification')}
            >
              <Bell size={22} color={colors.textPrimary} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────── Quick Actions ──────── */}
        <View style={styles.topCardWrapper}>
          <QuickAction
            icon={Headset}
            label="Help & Support"
            color="#60A5FA"
            onPress={() => openWhatsApp('Hello, I am a Creator, I need help.')}
          />
          <QuickAction
            icon={Megaphone}
            label="Marketing"
            color="#A78BFA"
            onPress={() =>
              openWhatsApp('Hello, I am a Creator, I need help for marketing.')
            }
          />
        </View>

        {/* ──────── Wallet Card ──────── */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.withdrawCard}
        >
          <View style={styles.withdrawLeft}>
            <View style={styles.walletIconWrap}>
              <WalletMinimal
                size={wp(20)}
                color={colors.golden}
                strokeWidth={2}
              />
            </View>
            <View style={styles.withdrawInfo}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>
                {walletLoading
                  ? '₹ ...'
                  : `₹ ${formatAmount(withdrawableBalance)}`}
              </Text>
            </View>

            <Text style={styles.profileName}>
              {user?.name ? user.name.toUpperCase() : 'CREATOR'}
            </Text>
          </View>
          <ChevronRight size={wp(18)} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* ──────── Account Section ──────── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <MenuRow
            icon={User2}
            iconBg="rgba(59,130,246,0.15)"
            iconColor="#b4d0f4"
            label="My Profile"
            subtitle="Manage your public profile"
            onPress={() => Nav.navigate('CreatorProfile')}
          />
          <MenuRow
            icon={WalletMinimal}
            iconBg="rgba(16,185,129,0.15)"
            iconColor={colors.success}
            label="Wallet"
            subtitle="Earnings & transactions"
            onPress={() => Nav.navigate('WalletCreator')}
          />
          <MenuRow
            icon={Landmark}
            iconBg="rgba(255,255,255,0.08)"
            iconColor="rgba(255,255,255,0.7)"
            label="Bank Details"
            subtitle="Manage your bank information"
            onPress={() => Nav.navigate('BankDetails')}
            isLast
          />
        </View>

        {/* ──────── Legal Section ──────── */}
        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>Legal</Text>
        <View style={styles.section}>
          <MenuRow
            icon={FileText}
            iconBg="rgba(59,130,246,0.15)"
            iconColor="#60A5FA"
            label="Terms of Service"
            onPress={() => setShowTerms(true)}
          />
          <MenuRow
            icon={Shield}
            iconBg="rgba(16,185,129,0.15)"
            iconColor="#10B981"
            label="Privacy Policy"
            onPress={() => setShowPrivacy(true)}
          />
          <MenuRow
            icon={ReceiptText}
            iconBg="rgba(255,182,6,0.15)"
            iconColor={colors.golden}
            label="Refund Policy"
            onPress={() => setShowRefund(true)}
          />
          <MenuRow
            icon={MessageCircle}
            iconBg="rgba(236,72,153,0.15)"
            iconColor="#EC4899"
            label="Contact Us"
            subtitle="Email & phone support"
            onPress={() => setShowContact(true)}
            isLast
          />
        </View>

        {/* ──────── Logout Section ──────── */}
        <View style={styles.logoutSection}>
          <MenuRow
            icon={LogOut}
            iconBg="rgba(239,68,68,0.15)"
            iconColor={colors.error}
            label="Logout"
            labelColor={colors.error}
            onPress={() => setLogoutVisible(true)}
            isLast
          />
        </View>

            {/* Pill Buttons Row */}
            <View style={styles.pillButtonsRow}>
              <TouchableOpacity
                style={styles.outlinedPill}
                onPress={() => navigation.navigate('CreatorProfile')}
                activeOpacity={0.8}
              >
                <Text style={styles.outlinedPillText}>Edit Profile</Text>
              </TouchableOpacity>

      {/* ──────── Withdraw Modal ──────── */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconWrap}>
              <WalletMinimal size={wp(28)} color={colors.golden} />
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

            {/* T+2 Info */}
            <View style={styles.modalInfoRow}>
              <Clock size={wp(16)} color={colors.faaAiBlue} />
              <Text style={styles.modalInfoText}>
                Your money will be credited to your bank account by{' '}
                <Text style={{ fontWeight: '700' }}>{getT2Date()}</Text> (T+2
                settlement period).
              </Text>
            </View>

            {/* Bank Info */}
            {bankAccount && (
              <View style={styles.modalBankRow}>
                <Landmark size={wp(16)} color="rgba(255,255,255,0.6)" />
                <Text style={styles.modalBankText}>
                  Crediting to: {bankAccount.account_number} (
                  {bankAccount.ifsc_code})
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

            {/* Note */}
            <View style={styles.modalNoteRow}>
              <Info size={wp(14)} color={colors.golden} />
              <Text style={styles.modalNoteText}>
                Settlements are processed automatically. Your earnings will be
                transferred after the T+2 settlement period.
              </Text>
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
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setShowWithdrawModal(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Settlement Scheduled',
                    text2: `₹${formatAmount(
                      withdrawableBalance,
                    )} will be credited by ${getT2Date()}`,
                    position: 'bottom',
                  });
                }}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={wp(16)} color={colors.black} />
                <Text style={styles.modalConfirmText}>Got It</Text>
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
                <Text
                  style={[styles.splitLegendValue, { color: colors.creatorGreen }]}
                >
                  {CREATOR_PCT}%
                </Text>
              </View>
              <View style={[styles.splitLegendItem, { alignItems: 'flex-end' }]}>
                <View style={styles.splitLegendRowTop}>
                  <Text style={styles.splitLegendLabel}>Manchly</Text>
                  <View
                    style={[
                      styles.splitDot,
                      { backgroundColor: colors.golden },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.splitLegendValue, { color: colors.golden }]}
                >
                  {PLATFORM_PCT}%
                </Text>
              </View>
            </View>
          </View>

            <View style={styles.sheetDivider} />

            <Text style={styles.calcLabel}>
              🧮 Apna amount daalo, result dekho
            </Text>

            {/* Slidable price indicator — drag the thumb/bubble to change price */}
            <View style={styles.sliderWrapper}>
              <Slider
                progress={progress}
                minimumValue={minSale}
                maximumValue={maxSale}
                onValueChange={(v) => runOnJS(syncFromSlider)(v)}
                onSlidingComplete={syncFromSlider}
                bubble={(v) => `₹${Math.round(v).toLocaleString('en-IN')}`}
                theme={{
                  minimumTrackTintColor: colors.golden,
                  maximumTrackTintColor: colors.trackDark,
                  bubbleBackgroundColor: colors.golden,
                  bubbleTextColor: colors.black,
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
      </View>

            <View style={styles.resultRow}>
              <View style={[styles.resultBox, styles.resultCreator]}>
                <Text style={styles.resultLabel}>😋 Aapko milega</Text>
                <Text style={[styles.resultValue, { color: colors.creatorGreen }]}>
                  ₹{hissaCreatorAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.resultBox, styles.resultPlatform]}>
                <Text style={styles.resultLabel}>🏢 Manchly ka</Text>
                <Text style={[styles.resultValue, { color: colors.golden }]}>
                  ₹{hissaPlatformAmount.toLocaleString('en-IN')}
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
    backgroundColor: colors.primary,
  },

  headerWrapper: {
    backgroundColor: colors.primary,
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#2A2A2C',
  },
  headerCurve: {
    backgroundColor: colors.primary,
    height: hp(6),
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  avatar: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    borderWidth: 2,
    borderColor: 'rgba(255,182,6,0.4)',
  },
  avatarFallback: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: '#14141F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerAvatarText: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.gold || '#F0C040',
  },
  greetingSmall: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary || '#FFFFFF',
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bellBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ scale: 0.93 }],
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
    gap: hp(8),
    backgroundColor: '#14141F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  topCardIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface || '#1C1C1E',
  },
  topCardText: {
    color: colors.white,
    fontSize: fp(13),
    fontWeight: '600',
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
    justifyContent: 'space-between',
    marginBottom: hp(22),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(16),
  },
  walletIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,182,6,0.12)',
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
  withdrawLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    fontSize: fp(12),
  },

  // Bestselling row
  bestsellerRow: {
    flexDirection: 'row',
  },
  withdrawBtn: {
    backgroundColor: colors.golden,
    paddingVertical: hp(9),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
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
    color: colors.black,
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
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: wp(20),
    marginBottom: hp(8),
  },
  section: {
    backgroundColor: '#14141F',
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  logoutSection: {
    backgroundColor: '#14141F',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
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
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  rowText: {
    fontSize: fp(15),
    color: colors.white,
    fontWeight: '500',
  },
  rowSubtext: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(1),
  },

  versionText: {
    textAlign: 'center',
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.3)',
    marginTop: hp(24),
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: fp(12),
    color: colors.gold || '#F0C040',
  },

  /* ──── Withdraw Modal ──── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(20),
  },
  modalContainer: {
    backgroundColor: '#14141F',
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(255,182,6,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(16),
  },
  modalAmountCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalAmountLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: hp(4),
  },
  modalAmountValue: {
    fontSize: fp(28),
    fontWeight: '900',
    color: colors.white,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(10),
    backgroundColor: 'rgba(96,165,250,0.1)',
    padding: wp(12),
    borderRadius: wp(12),
    width: '100%',
    marginBottom: hp(10),
    lineHeight: fp(14),
  },
  modalInfoText: {
    flex: 1,
    fontSize: fp(12),
    color: colors.faaAiBlue,
    lineHeight: fp(17),
    fontWeight: '500',
  },
  modalBankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: colors.primary,
    padding: wp(12),
    borderRadius: wp(10),
    width: '100%',
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalBankText: {
    flex: 1,
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  courseFollowButton: {
    backgroundColor: colors.gold || '#F0C040',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: 12,
  },
  modalNoteText: {
    flex: 1,
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: fp(16),
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
  modalCancelBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalCancelText: {
    color: colors.white,
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
  },
  modalConfirmBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.golden,
    gap: wp(6),
  },
  modalConfirmText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: fp(14),
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
    backgroundColor: '#14141F',
    marginHorizontal: wp(16),
    marginBottom: hp(20),
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hissaCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  hissaIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: colors.creatorGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  logoutIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  hissaTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  hissaSubtitle: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  hissaCreator: {
    color: colors.creatorGreen,
    fontWeight: '700',
  },
  hissaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  hissaPlatform: {
    color: colors.golden,
    fontWeight: '700',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#14141F',
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingHorizontal: wp(20),
    paddingTop: hp(10),
    paddingBottom: hp(28),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: {
    width: wp(40),
    height: hp(4),
    borderRadius: wp(2),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: hp(16),
  },
  sheetTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
  },
  sheetSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(4),
    marginBottom: hp(18),
  },
  dropdownRow: {
    flexDirection: 'row',
    height: hp(14),
    borderRadius: wp(20),
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  splitCreator: {
    backgroundColor: colors.creatorGreen,
  },
  splitPlatform: {
    backgroundColor: colors.golden,
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
  splitLegendLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 0.5,
    backgroundColor: '#303030',
    marginHorizontal: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: hp(18),
  },
  cancelText: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    color: colors.white || '#FFFFFF',
  },
  sliderInner: {
    borderRadius: hp(5),
  },
  saleAmountText: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginVertical: hp(10),
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
  },
  resultCreator: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  resultPlatform: {
    backgroundColor: 'rgba(255,182,6,0.12)',
  },
  resultLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
});