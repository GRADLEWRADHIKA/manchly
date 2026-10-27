import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import {useSharedValue} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  User2,
  ChevronRight,
  LogOut,
  Headset,
  WalletMinimal,
  Landmark,
  Clock,
  CheckCircle2,
  Info,
  PieChart,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import {
  getWallet,
  getBankAccount,
  requestWithdrawal,
  getEarningsBreakdown,
} from '../../../../store/SettlementSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { version as appVersion } from '../../../../../package.json';

const SUPPORT_PHONE = '6363790659';

// Figma gold palette (same as Dashboard)
const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const GOLD_CHIP_BG = 'rgba(214,156,63,0.10)';
const GOLD_CHIP_BORDER = 'rgba(214,156,63,0.30)';
// Card system from Figma: #1C1B1B @70%, 1px #FFFFFF @5%, shadow 0/4 blur 24 @20%
const CARD_BG = 'rgba(28,27,27,0.70)';
const CARD_BORDER = 'rgba(255,255,255,0.05)';
const ROW_CHIP_BG = 'rgba(214,156,63,0.20)';
const LOGOUT_SALMON = '#F2A29B';
const READY_GREEN = '#22C55E';
const NOT_READY_AMBER = '#F59E0B';

// Fallback used only until the backend ships these two fields on settlements/wallet.
// Once your controller returns real `minimum_withdrawal_limit` / `ready_to_withdraw`,
// these fallbacks are simply ignored (?? only applies when the field is missing).
const FALLBACK_MIN_WITHDRAWAL = 200;

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
  iconColor = GOLD_CREAM,
  iconBg = ROW_CHIP_BG,
  iconBorder = 'transparent',
  label,
  labelColor = colors.white,
  subtitle,
  onPress,
  isLast = false,
  dimmed = false,
}: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.row,
      !isLast && styles.rowBorder,
      pressed && styles.rowPressed,
      dimmed && styles.rowDimmed,
    ]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <View style={styles.rowLeft}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: iconBg, borderColor: iconBorder },
        ]}
      >
        <Icon size={wp(18)} color={iconColor} strokeWidth={1.8} />
      </View>
      <View>
        <Text style={[styles.rowText, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtext}>{subtitle}</Text>}
      </View>
    </View>
    <ChevronRight size={wp(18)} color="rgba(255,255,255,0.35)" />
  </Pressable>
);

// Sub-action button used inside the "Payments & Payouts" grouped card
const SubActionButton = ({ icon: Icon, label, subtitle, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.subActionBtn,
      pressed && styles.subActionBtnPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.subActionIcon}>
      <Icon size={wp(16)} color={GOLD_CREAM} strokeWidth={1.8} />
    </View>
    <Text style={styles.subActionLabel}>{label}</Text>
    {subtitle && <Text style={styles.subActionSubtitle}>{subtitle}</Text>}
  </Pressable>
);

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHissaModal, setShowHissaModal] = useState(false);
  const [hissaSale, setHissaSale] = useState(1000);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const Nav = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const { user } = useSelector((state: any) => state.userReducer);
  const { wallet, bankAccount, earningsBreakdown } = useSelector(
    (state: any) => state.settlementReducer,
  );

console.log('WALLET', JSON.stringify(wallet, null, 2));
console.log('EARNINGS', JSON.stringify(earningsBreakdown, null, 2));

console.log('WALLET', JSON.stringify(wallet, null, 2));
console.log('EARNINGS', JSON.stringify(earningsBreakdown, null, 2));

  useFocusEffect(
    useCallback(() => {
      dispatch(getWallet());
      dispatch(getBankAccount());
      dispatch(getEarningsBreakdown());
    }, [dispatch]),
  );

  const walletLoading = wallet === null;
  const withdrawableBalance = wallet?.wallet?.available_balance || 0;

  // See FALLBACK_MIN_WITHDRAWAL note above — swap this to the real field once shipped.
  const minWithdrawalLimit =
    wallet?.minimum_withdrawal_limit ?? FALLBACK_MIN_WITHDRAWAL;
  const isReadyToWithdraw =
    wallet?.ready_to_withdraw ?? withdrawableBalance >= minWithdrawalLimit;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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
    if (!isReadyToWithdraw) {
      Toast.show({
        type: 'info',
        text1: 'Below Minimum Limit',
        text2: `You need at least ₹${minWithdrawalLimit} to withdraw`,
        position: 'top',
      });
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async () => {
    setWithdrawSubmitting(true);
    try {
      await dispatch(requestWithdrawal(withdrawableBalance)).unwrap();
      setShowWithdrawModal(false);
      dispatch(getWallet());
      // requestWithdrawal thunk already shows a success toast
    } catch (e) {
      // requestWithdrawal thunk already shows an error toast
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleSettingsPress = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'App preferences will be available soon',
      position: 'top',
    });
  };

  return (
    <View style={styles.container}>
      {/* ──────── Header ──────── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account and preferences
            </Text>
          </View>
          <View style={styles.headerAvatarWrap}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.headerAvatarImg}
              />
            ) : (
              <User2 size={wp(20)} color={GOLD_CREAM} />
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────── Wallet Card ──────── */}
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawTopRow}>
            <View style={styles.withdrawLeft}>
              <View style={styles.walletIconWrap}>
                <WalletMinimal
                  size={wp(18)}
                  color={GOLD_CREAM}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.withdrawInfo}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: wp(4),
                  }}
                >
                  <Text style={styles.withdrawLabel}>WITHDRAWABLE BALANCE</Text>
                  <Info size={wp(12)} color="rgba(255,255,255,0.4)" />
                </View>
                <Text style={styles.withdrawAmount}>
                  {walletLoading
                    ? '₹ ...'
                    : `₹ ${formatAmount(withdrawableBalance)}`}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                pressed && styles.withdrawBtnPressed,
              ]}
              onPress={handleWithdraw}
            >
              <LinearGradient
                colors={[GOLD_CREAM, GOLD_DEEP]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.withdrawBtn}
              >
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {!walletLoading && (
            <View style={styles.statsFooterRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>
                  ₹{formatAmount(earningsBreakdown?.net_earnings || 0)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>All Time Earnings</Text>
                <Text style={styles.statValue}>
                  ₹{formatAmount(earningsBreakdown?.total_earnings || 0)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Last Payout</Text>
                <Text style={styles.statValue}>
                  ₹{formatAmount(earningsBreakdown?.last_payout || 0)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ──────── Aapki Kamaai ka Hissa ──────── */}
        <Pressable
          style={({ pressed }) => [
            styles.hissaCard,
            pressed && styles.hissaCardPressed,
          ]}
          onPress={() => setShowHissaModal(true)}
        >
          <View style={styles.hissaIconWrap}>
            <PieChart
              size={wp(22)}
              color={colors.creatorGreen}
              strokeWidth={2}
            />
          </View>
          <View style={styles.hissaInfo}>
            <Text style={styles.hissaTitle}>Aapki Kamaai ka Hissa</Text>
            <Text style={styles.hissaSubtitle}>
              <Text style={styles.hissaCreator}>{CREATOR_PCT}% aapka</Text>
              <Text style={styles.hissaDot}> · </Text>
              <Text style={styles.hissaPlatform}>{PLATFORM_PCT}% Manchly</Text>
            </Text>
            <Text style={styles.hissaTagline}>We grow together</Text>
          </View>
          <ChevronRight size={wp(18)} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* ──────── Account Section ──────── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <MenuRow
            icon={User2}
            label="My Profile"
            subtitle="Manage your public profile"
            onPress={() => Nav.navigate('CreatorProfile')}
          />

          {/* Payments & Payouts — grouped card with Wallet / Bank Details inside */}
          <View style={styles.rowBorder}>
            <View style={styles.paymentsHeaderRow}>
              <View style={styles.rowIcon}>
                <WalletMinimal
                  size={wp(18)}
                  color={GOLD_CREAM}
                  strokeWidth={1.8}
                />
              </View>
              <View>
                <Text style={styles.rowText}>Payments & Payouts</Text>
                <Text style={styles.rowSubtext}>
                  Manage your earnings and bank details
                </Text>
              </View>
            </View>
            <View style={styles.subActionRow}>
              <SubActionButton
                icon={WalletMinimal}
                label="Wallet"
                subtitle="View earnings & transactions"
                onPress={() => Nav.navigate('WalletCreator')}
              />
              <SubActionButton
                icon={Landmark}
                label="Bank Details"
                subtitle="Manage bank information"
                onPress={() => Nav.navigate('BankDetails')}
              />
            </View>
          </View>

          <MenuRow
            icon={SettingsIcon}
            label="Settings"
            subtitle="App preferences"
            onPress={handleSettingsPress}
            dimmed
          />

          <MenuRow
            icon={LogOut}
            iconBg="rgba(239,68,68,0.14)"
            iconColor={LOGOUT_SALMON}
            label="Logout"
            labelColor={LOGOUT_SALMON}
            subtitle="Sign out from your account"
            onPress={() => setLogoutVisible(true)}
            isLast
          />
        </View>

        {/* ──────── Support Section ──────── */}
        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>
          Support
        </Text>
        <View style={styles.section}>
          <MenuRow
            icon={Headset}
            label="Help & Support"
            subtitle="Chat with us on WhatsApp"
            onPress={() => openWhatsApp('Hello, I am a Creator, I need help.')}
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
              <WalletMinimal size={wp(28)} color={GOLD_CREAM} />
            </View>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>

            {/* Amount */}
            <View style={styles.modalAmountCard}>
              <Text style={styles.modalAmountLabel}>Amount to be settled</Text>
              <Text style={styles.modalAmountValue}>
                ₹ {formatAmount(withdrawableBalance)}
              </Text>
            </View>

            {/* Instant payout info (matches backend: instant IMPS transfer) */}
            <View style={styles.modalInfoRow}>
              <Clock size={wp(16)} color={colors.faaAiBlue} />
              <Text style={styles.modalInfoText}>
                Your money will be transferred{' '}
                <Text style={{ fontWeight: '700' }}>instantly via IMPS</Text> —
                usually within ~15 minutes.
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
              <Info size={wp(14)} color={GOLD_DEEP} />
              <Text style={styles.modalNoteText}>
                Withdrawal requests are processed immediately once confirmed.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWithdrawModal(false)}
                activeOpacity={0.7}
                disabled={withdrawSubmitting}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  withdrawSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleConfirmWithdraw}
                activeOpacity={0.8}
                disabled={withdrawSubmitting}
              >
                <CheckCircle2 size={wp(16)} color={colors.black} />
                <Text style={styles.modalConfirmText}>
                  {withdrawSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
                </Text>
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
                <View style={[styles.splitCreator, { flex: CREATOR_PCT }]} />
                <View style={[styles.splitPlatform, { flex: PLATFORM_PCT }]} />
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
                    style={[
                      styles.splitLegendValue,
                      { color: colors.creatorGreen },
                    ]}
                  >
                    {CREATOR_PCT}%
                  </Text>
                </View>
                <View
                  style={[styles.splitLegendItem, { alignItems: 'flex-end' }]}
                >
                  <View style={styles.splitLegendRowTop}>
                    <Text style={styles.splitLegendLabel}>Manchly</Text>
                    <View
                      style={[styles.splitDot, { backgroundColor: GOLD_DEEP }]}
                    />
                  </View>
                  <Text
                    style={[styles.splitLegendValue, { color: GOLD_CREAM }]}
                  >
                    {PLATFORM_PCT}%
                  </Text>
                </View>
              </View>

              <View style={styles.sheetDivider} />

              <Text style={styles.calcLabel}>
                🧮 Apna amount daalo, result dekho
              </Text>

              <View style={styles.sliderWrapper}>
                <Slider
                  progress={progress}
                  minimumValue={minSale}
                  maximumValue={maxSale}
                  onValueChange={v => runOnJS(syncFromSlider)(v)}
                  onSlidingComplete={syncFromSlider}
                  bubble={v => `₹${Math.round(v).toLocaleString('en-IN')}`}
                  theme={{
                    minimumTrackTintColor: GOLD_DEEP,
                    maximumTrackTintColor: 'rgba(255,255,255,0.12)',
                    bubbleBackgroundColor: GOLD_DEEP,
                    bubbleTextColor: '#3A2C12',
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
                  <Text
                    style={[styles.resultValue, { color: colors.creatorGreen }]}
                  >
                    ₹{hissaCreatorAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.resultBox, styles.resultPlatform]}>
                  <Text style={styles.resultLabel}>🏢 Manchly ka</Text>
                  <Text style={[styles.resultValue, { color: GOLD_CREAM }]}>
                    ₹{hissaPlatformAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </GestureHandlerRootView>
      </Modal>

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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  headerWrapper: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    paddingVertical: hp(12),
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(2),
  },
  headerAvatarWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: GOLD_CHIP_BG,
    borderWidth: 1,
    borderColor: GOLD_CHIP_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },

  /* ──── Body ──── */
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  /* ──── Wallet Card ──── */
  withdrawCard: {
    marginHorizontal: wp(16),
    marginTop: hp(10),
    borderRadius: wp(18),
    overflow: 'hidden',
    padding: wp(16),
    marginBottom: hp(14),
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  withdrawTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconWrap: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    backgroundColor: GOLD_CHIP_BG,
    borderWidth: 1,
    borderColor: GOLD_CHIP_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawInfo: {
    marginLeft: wp(12),
    flex: 1,
  },
  withdrawLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    fontSize: fp(8),
    letterSpacing: 1,
    lineHeight: fp(14),
  },
  withdrawAmount: {
    color: colors.white,
    marginTop: hp(4),
    fontSize: fp(20),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  withdrawBtn: {
    paddingVertical: hp(11),
    paddingHorizontal: wp(22),
    borderRadius: wp(12),
  },
  withdrawBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  withdrawBtnDisabledWrap: {
    opacity: 0.5,
  },
  withdrawBtnText: {
    fontWeight: '700',
    color: '#3A2C12',
    fontSize: fp(14),
  },
  withdrawFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(12),
    flexWrap: 'wrap',
    gap: hp(6),
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
  },
  readyDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
  },
  readyBadgeText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
  minLimitText: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },

  /* ──── Sections ──── */
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginHorizontal: wp(20),
    marginBottom: hp(10),
  },
  section: {
    backgroundColor: CARD_BG,
    marginHorizontal: wp(16),
    borderRadius: wp(18),
    borderWidth: 1,
    borderColor: CARD_BORDER,
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowDimmed: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(11),
    borderWidth: 1,
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
    color: 'rgba(255,255,255,0.55)',
    marginTop: hp(1),
  },

  /* ──── Payments & Payouts group ──── */
  paymentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(10),
  },
  subActionRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(16),
    paddingBottom: hp(14),
    gap: wp(10),
  },
  subActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: wp(12),
    padding: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subActionBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subActionIcon: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(9),
    backgroundColor: ROW_CHIP_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(8),
  },
  subActionLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
  },
  subActionSubtitle: {
    fontSize: fp(10.5),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(2),
  },

  versionText: {
    textAlign: 'center',
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.3)',
    marginTop: hp(24),
    fontWeight: '500',
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
    backgroundColor: '#1C1B1B',
    borderRadius: wp(20),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  modalIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(214,156,63,0.12)',
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
    backgroundColor: GOLD_DEEP,
    gap: wp(6),
  },
  modalConfirmText: {
    color: '#3A2C12',
    fontWeight: '700',
    fontSize: fp(14),
  },

  /* ──── Hissa Card ──── */
  hissaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    marginHorizontal: wp(16),
    marginBottom: hp(20),
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
    borderRadius: wp(18),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  hissaCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  hissaIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
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
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  hissaTagline: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.4)',
    marginTop: hp(3),
    fontStyle: 'italic',
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
    backgroundColor: '#1C1B1B',
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingHorizontal: wp(20),
    paddingTop: hp(10),
    paddingBottom: hp(28),
    borderWidth: 1,
    borderColor: CARD_BORDER,
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
    backgroundColor: GOLD_DEEP,
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
    backgroundColor: 'rgba(214,156,63,0.12)',
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
  statsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(14),
    paddingTop: hp(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: hp(26),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: wp(10),
  },
  statLabel: {
    fontSize: fp(10.5),
    color: 'rgba(255,255,255,0.5)',
    marginBottom: hp(4),
  },
  statValue: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
});
