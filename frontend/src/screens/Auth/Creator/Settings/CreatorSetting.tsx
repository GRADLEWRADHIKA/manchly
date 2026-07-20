import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Linking,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  User2,
  ChevronRight,
  LogOut,
  Headset,
  Megaphone,
  WalletMinimal,
  Bell,
  Settings,
  UserCircle,
  Landmark,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
  Shield,
  ReceiptText,
  MessageCircle,
  PiggyBank,
  Instagram,
  BadgeIndianRupee,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { instance } from '../../../../utils/AxiosInstance';
import LinearGradient from 'react-native-linear-gradient';
import TermsModal from '../../../../components/TermsModal';
import PrivacyModal from '../../../../components/PrivacyModal';
import RefundPolicyModal from '../../../../components/RefundPolicyModal';
import ContactUsModal from '../../../../components/ContactUsModal';
import { version as appVersion } from '../../../../../package.json';

const SUPPORT_PHONE = '6363790659';

const openWhatsApp = (message: string) => {
  const url = `whatsapp://send?phone=91${SUPPORT_PHONE}&text=${encodeURIComponent(
    message,
  )}`;
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        Toast.show({
          type: 'error',
          text1: 'WhatsApp not installed',
          text2: 'Please install WhatsApp to contact support',
          position: 'top',
        });
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: err?.message || 'Unable to open WhatsApp',
        position: 'top',
      });
    });
};

const MenuRow = ({
  icon: Icon,
  iconColor = colors.text,
  iconBg = '#f4f4f5',
  label,
  labelColor = colors.text,
  subtitle,
  onPress,
  isLast = false,
}: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.row,
      !isLast && styles.rowBorder,
      pressed && styles.rowPressed,
    ]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <View style={styles.rowLeft}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon size={wp(18)} color={iconColor} strokeWidth={1.8} />
      </View>
      <View>
        <Text style={[styles.rowText, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtext}>{subtitle}</Text>}
      </View>
    </View>
    <ChevronRight size={wp(18)} color="#c8ccd0" />
  </Pressable>
);

const QuickAction = ({ icon: Icon, label, color, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.topCard, pressed && styles.topCardPressed]}
    onPress={onPress}
  >
    <View style={[styles.topCardIcon, { backgroundColor: color + '12' }]}>
      <Icon size={wp(20)} color={color} strokeWidth={1.8} />
    </View>
    <Text style={styles.topCardText}>{label}</Text>
  </Pressable>
);

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHissaModal, setShowHissaModal] = useState(false);
  const [hissaSale, setHissaSale] = useState(1000);
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const Nav = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const [walletRes, bankRes] = await Promise.all([
        instance.get('settlements/wallet').catch((e: any) => {
          console.log(
            'Wallet API error:',
            e?.response?.status,
            e?.response?.data,
          );
          return null;
        }),
        instance.get('settlements/bank-account').catch((e: any) => {
          console.log('Bank API error:', e?.response?.status);
          return null;
        }),
      ]);
      setWalletData(walletRes?.data?.data?.wallet || null);
      setBankAccount(bankRes?.data?.data?.bankAccount || null);
    } catch (error) {
      console.log('Error fetching wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, []),
  );

  const withdrawableBalance = walletData?.available_balance || 0;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getT2Date = () => {
    const eta = new Date();
    let businessDays = 0;
    while (businessDays < 2) {
      eta.setDate(eta.getDate() + 1);
      const day = eta.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }
    return eta.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const CREATOR_PCT = 90;
  const PLATFORM_PCT = 10;
  const HISSA_MIN = 1000;
  const HISSA_MAX = 100000;

  const hissaCreatorAmount = Math.round((hissaSale * CREATOR_PCT) / 100);
  const hissaPlatformAmount = Math.round((hissaSale * PLATFORM_PCT) / 100);

  const progress = useSharedValue(1000);
  const minSale = useSharedValue(HISSA_MIN);
  const maxSale = useSharedValue(HISSA_MAX);

  const syncFromSlider = useCallback((value: number) => {
    const stepped = Math.round(value / 100) * 100;
    const clamped = Math.max(HISSA_MIN, Math.min(HISSA_MAX, stepped));
    setHissaSale(clamped);
  }, []);

  const handleWithdraw = () => {
    if (!bankAccount) {
      Toast.show({
        type: 'error',
        text1: 'No Bank Account',
        text2: 'Please add and verify your bank account first',
        position: 'top',
      });
      Nav.navigate('BankDetails');
      return;
    }
    if (!bankAccount.is_verified) {
      Toast.show({
        type: 'error',
        text1: 'Bank Not Verified',
        text2: 'Please verify your bank account first',
        position: 'top',
      });
      Nav.navigate('BankDetails');
      return;
    }
    if (withdrawableBalance <= 0) {
      Toast.show({
        type: 'info',
        text1: 'No Balance',
        text2: 'You have no withdrawable balance at the moment',
        position: 'top',
      });
      return;
    }
    setShowWithdrawModal(true);
  };

 return (
    <View style={styles.container}>
      {/* ──────── Header ──────── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.headerSubtitle}>Welcome Back</Text>
              <Text style={styles.headerTitle}>{user.name}</Text>
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
          >
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/manchly_app')
              }
            >
              <Instagram size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => Nav.navigate('CreatorNotification')}
            >
              <Bell size={wp(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
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
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.withdrawBtn,
              pressed && styles.withdrawBtnPressed,
            ]}
            onPress={handleWithdraw}
          >
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </Pressable>
        </LinearGradient>

        {/* ──────── Aapki Kamaai ka Hissa ──────── */}
        <Pressable
          style={({ pressed }) => [
            styles.hissaCard,
            pressed && styles.hissaCardPressed,
          ]}
          onPress={() => setShowHissaModal(true)}
        >
          <View style={styles.hissaIconWrap}>
            <BadgeIndianRupee size={wp(22)} color={colors.white} strokeWidth={2} />
          </View>
          <View style={styles.hissaInfo}>
            <Text style={styles.hissaTitle}>Aapki Kamaai ka Hissa</Text>
            <Text style={styles.hissaSubtitle}>
              <Text style={styles.hissaCreator}>
                {CREATOR_PCT}% aapka
              </Text>
              <Text style={styles.hissaDot}> · </Text>
              <Text style={styles.hissaPlatform}>
                {PLATFORM_PCT}% Manchly
              </Text>
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

        <Text style={styles.versionText}>Version {appVersion}</Text>
      </ScrollView>

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
            <Text style={styles.modalTitle}>Withdraw Funds</Text>

            {/* Amount */}
            <View style={styles.modalAmountCard}>
              <Text style={styles.modalAmountLabel}>Amount to be settled</Text>
              <Text style={styles.modalAmountValue}>
                ₹ {formatAmount(withdrawableBalance)}
              </Text>
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
              </View>
            )}

            {/* Note */}
            <View style={styles.modalNoteRow}>
              <Info size={wp(14)} color={colors.golden} />
              <Text style={styles.modalNoteText}>
                Settlements are processed automatically. Your earnings will be
                transferred after the T+2 settlement period.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWithdrawModal(false)}
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
                    position: 'top',
                  });
                }}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={wp(16)} color={colors.black} />
                <Text style={styles.modalConfirmText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ──────── Hissa Bottom Sheet ──────── */}
      <Modal
        visible={showHissaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHissaModal(false)}
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
          <Pressable
            style={styles.sheetOverlay}
            onPress={() => setShowHissaModal(false)}
          >
            <Pressable style={styles.sheetContainer} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>💰 Aapki Kamaai ka Hissa</Text>
            <Text style={styles.sheetSubtitle}>
              Har sale pe paisa aisa baanta hai
            </Text>

            {/* Split bar */}
            <View style={styles.splitBar}>
              <View
                style={[
                  styles.splitCreator,
                  { flex: CREATOR_PCT },
                ]}
              />
              <View
                style={[
                  styles.splitPlatform,
                  { flex: PLATFORM_PCT },
                ]}
              />
            </View>

            <View style={styles.splitLegendRow}>
              <View style={styles.splitLegendItem}>
                <View style={styles.splitLegendRowTop}>
                  <View
                    style={[
                      styles.splitDot,
                      { backgroundColor: colors.creatorGreen },
                    ]}
                  />
                  <Text style={styles.splitLegendLabel}>Aapka (Creator)</Text>
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
                sliderHeight={hp(10)}
                thumbWidth={wp(26)}
                bubbleTranslateY={-hp(10)}
                panHitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
                containerStyle={styles.sliderInner}
              />
            </View>

            <Text style={styles.saleAmountText}>
              ₹{hissaSale.toLocaleString('en-IN')} ki sale
            </Text>

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
            </View>
            </Pressable>
          </Pressable>
        </GestureHandlerRootView>
      </Modal>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
      <RefundPolicyModal
        visible={showRefund}
        onClose={() => setShowRefund(false)}
      />
      <ContactUsModal
        visible={showContact}
        onClose={() => setShowContact(false)}
      />

      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          dispatch(logout());
        }}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerCurve: {
    backgroundColor: colors.primary,
    height: hp(6),
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    flex: 1,
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
  avatarInitials: {
    color: colors.white,
    fontSize: fp(17),
    fontWeight: '700',
  },
  greetingWrap: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  greetingText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginTop: 0,
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

  /* ──── Body ──── */
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  /* ──── Quick Actions ──── */
  topCardWrapper: {
    flexDirection: 'row',
    paddingHorizontal: wp(16),
    marginTop: hp(18),
    marginBottom: hp(14),
    gap: wp(12),
  },
  topCard: {
    flex: 1,
    paddingVertical: hp(16),
    paddingHorizontal: wp(14),
    borderRadius: wp(14),
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
  },
  topCardText: {
    color: colors.white,
    fontSize: fp(13),
    fontWeight: '600',
  },

  /* ──── Wallet Card ──── */
  withdrawCard: {
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    overflow: 'hidden',
    padding: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(22),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,182,6,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawInfo: {
    marginLeft: wp(12),
    flex: 1,
  },
  withdrawLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    fontSize: fp(12),
  },
  withdrawAmount: {
    color: colors.white,
    marginTop: hp(2),
    fontSize: fp(20),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  withdrawBtn: {
    backgroundColor: colors.golden,
    paddingVertical: hp(9),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
  },
  withdrawBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  withdrawBtnText: {
    fontWeight: '700',
    color: colors.black,
    fontSize: fp(13),
  },

  /* ──── Sections ──── */
  sectionTitle: {
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

  /* ──── Rows ──── */
  row: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
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
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
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
  modalNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(8),
    padding: wp(12),
    width: '100%',
    marginBottom: hp(16),
  },
  modalNoteText: {
    flex: 1,
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: fp(16),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: wp(10),
    width: '100%',
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
    fontSize: fp(14),
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

  /* ──── Hissa Card ──── */
  hissaCard: {
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
  hissaInfo: {
    flex: 1,
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

  /* ──── Hissa Bottom Sheet ──── */
  gestureRoot: {
    flex: 1,
  },
  sheetOverlay: {
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
  splitBar: {
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
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(12),
  },
  splitLegendItem: {
    flex: 1,
  },
  splitLegendRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  splitDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  splitLegendLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  splitLegendValue: {
    fontSize: fp(22),
    fontWeight: '900',
    marginTop: hp(4),
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: hp(18),
  },
  calcLabel: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: hp(14),
  },
  sliderWrapper: {
    marginTop: hp(24),
    marginBottom: hp(8),
    paddingHorizontal: wp(4),
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
    gap: wp(12),
    marginTop: hp(8),
  },
  resultBox: {
    flex: 1,
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
    borderRadius: wp(14),
    alignItems: 'center',
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
    marginBottom: hp(4),
  },
  resultValue: {
    fontSize: fp(22),
    fontWeight: '900',
  },
});