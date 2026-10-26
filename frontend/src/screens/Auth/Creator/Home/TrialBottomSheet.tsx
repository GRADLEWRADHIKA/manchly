import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Star,
  Package,
  Video,
  Users,
  CheckCircle2,
  Phone,
  Gem,
  ChevronDown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFDropCheckoutPayment,
  CFThemeBuilder,
} from 'cashfree-pg-api-contract';
import { instance } from '../../../../utils/AxiosInstance';
import { wp, hp, fp } from '../../../../utils/responsive';

const SOCIAL_PROOF = [
  { name: 'Siddhant', city: 'Nagpur' },
  { name: 'Priya', city: 'Mumbai' },
  { name: 'Rohit', city: 'Delhi' },
  { name: 'Sneha', city: 'Bangalore' },
  { name: 'Aman', city: 'Jaipur' },
  { name: 'Kavita', city: 'Pune' },
  { name: 'Arjun', city: 'Chennai' },
];

const FEATURES = [
  { icon: Package, text: 'Create & Sell\nCourses' },
  { icon: Video, text: 'Host Live\nWebinars' },
  { icon: Users, text: 'Manage Users\n& Payments' },
];

const STEPS_TEMPLATE = [
  {
    icon: CheckCircle2,
    iconColor: '#F0C040',
    filled: true,
    title: '{days}-Day Premium Access for \u20B9{trialPrice}',
    subtitle: 'Full access to all premium features.',
  },
  {
    icon: Phone,
    iconColor: '#F0C040',
    filled: false,
    title: 'We Remind You',
    subtitle: "We'll let you know before your trial ends.",
  },
  {
    icon: Gem,
    iconColor: '#F0C040',
    filled: false,
    title: 'Continue as Premium',
    subtitle: 'Just \u20B9{monthlyPrice}/month after trial.\nCancel anytime.',
  },
];

interface TrialBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onTrialActivated: () => void;
  trialDays?: number;
  trialPrice?: number;
  monthlyPrice?: number;
}

const TrialBottomSheet: React.FC<TrialBottomSheetProps> = ({
  visible,
  onClose,
  onTrialActivated,
  trialDays = 3,
  trialPrice = 199,
  monthlyPrice = 199,
}) => {
  const insets = useSafeAreaInsets();
  const [proofIndex, setProofIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(false);
  const pendingSubIdRef = useRef<string | null>(null);

  // Register Cashfree callbacks
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: async () => {
        const subId = pendingSubIdRef.current;
        if (!subId) return;
        pendingSubIdRef.current = null;

        try {
          const res = await instance.post('creator-trial/verify', {
            subscription_id: subId,
          });
          const data = res?.data?.data;

          if (data?.status === 'ACTIVE') {
            Alert.alert(
              'Trial Activated!',
              `Your ${trialDays}-day trial has started. \u20B9${monthlyPrice}/month begins after trial.`,
            );
            onTrialActivated();
          } else if (data?.status === 'BANK_APPROVAL_PENDING') {
            Alert.alert(
              'Approval Pending',
              'Your authorization is pending bank approval. Trial will activate once approved.',
            );
            onClose();
          }
        } catch (err: any) {
          Alert.alert('Verification Failed', err?.response?.data?.error?.message || 'Something went wrong');
        } finally {
          setLoading(false);
        }
      },
      onError: (error: any) => {
        pendingSubIdRef.current = null;
        setLoading(false);
        Alert.alert('Payment Failed', error?.message || 'Authorization was not completed');
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  // Rotate social proof
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setProofIndex(prev => (prev + 1) % SOCIAL_PROOF.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const res = await instance.post('creator-trial/subscribe');
      const data = res?.data?.data;

      if (!data?.subscription_session_id || !data?.subscription_id) {
        throw new Error('Invalid subscription response');
      }

      pendingSubIdRef.current = data.subscription_id;

      const env =
        data.cashfree_env === 'PRODUCTION'
          ? CFEnvironment.PRODUCTION
          : CFEnvironment.SANDBOX;

      const session = new CFSession(
        data.subscription_session_id,
        data.subscription_id,
        env,
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#0D0D14')
        .setNavigationBarTextColor('#FFFFFF')
        .setPrimaryTextColor('#FFFFFF')
        .setSecondaryTextColor('#AAAAAA')
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.error?.message || err?.message || 'Something went wrong';
      Alert.alert('Error', msg);
    }
  };

  if (!visible) return null;

  const proof = SOCIAL_PROOF[proofIndex];

  const STEPS = STEPS_TEMPLATE.map(step => ({
    ...step,
    title: step.title
      .replace('{days}', String(trialDays))
      .replace('{trialPrice}', String(trialPrice)),
    subtitle: step.subtitle.replace('{monthlyPrice}', String(monthlyPrice)),
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D14" />
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Social proof banner */}
          <Animated.View style={[s.proofBanner, { opacity: fadeAnim }]}>
            <Text style={s.proofText}>
              {'\uD83C\uDF89 '}
              <Text style={s.proofName}>{proof.name}</Text>
              {' from '}
              <Text style={s.proofCity}>{proof.city}</Text>
              {' started FREE trial'}
            </Text>
          </Animated.View>

          {/* Close + Header */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <ChevronDown size={wp(22)} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>
                {trialDays} Day{' '}
                <Text style={s.trialBadgeInline}>TRIAL</Text>
                {' for \u20B9' + trialPrice}
              </Text>
            </View>
            <View style={{ width: wp(32) }} />
          </View>

          {/* Rating */}
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={wp(16)}
                color="#F0C040"
                fill={i <= 4 ? '#F0C040' : 'transparent'}
              />
            ))}
            <Text style={s.ratingText}> 4.6 (10 lakhs reviews)</Text>
          </View>

          {/* Hero card */}
          <LinearGradient
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            style={s.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={s.brandRow}>
              <View style={s.brandIcon}>
                <Text style={s.brandIconText}>M</Text>
              </View>
              <View>
                <Text style={s.brandName}>manchly</Text>
                <Text style={s.brandTagline}>Create. Teach. Earn.</Text>
              </View>
            </View>

            <Text style={s.heroTitle}>
              {trialDays}-Day{'\n'}
              <Text style={s.heroTitleGold}>Trial</Text>
              {'\n'}for{' '}
              <Text style={s.heroTitleGold}>{'\u20B9' + trialPrice}</Text>
            </Text>

            <Text style={s.heroSubtitle}>
              Create Courses.{'\n'}Host Webinars.{'\n'}Grow Your Brand.{'\n'}
              All on <Text style={s.heroSubHighlight}>Manchly.</Text>
            </Text>

            <View style={s.featureRow}>
              {FEATURES.map((f, i) => (
                <View key={i} style={s.featureItem}>
                  <View style={s.featureIconWrap}>
                    <f.icon size={wp(18)} color="#F0C040" />
                  </View>
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Steps timeline */}
          <View style={s.stepsContainer}>
            {STEPS.map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={s.stepIconCol}>
                  <View style={s.stepIconCircle}>
                    <step.icon
                      size={wp(20)}
                      color={step.iconColor}
                      fill={step.filled ? step.iconColor : 'transparent'}
                    />
                  </View>
                  {i < STEPS.length - 1 && <View style={s.stepLine} />}
                </View>
                <View style={s.stepTextCol}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: hp(100) }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[s.ctaContainer, { paddingBottom: insets.bottom + hp(12) }]}>
          <View style={s.ctaRow}>
            <View style={s.payVia}>
              <View style={s.upiIcon}>
                <Text style={s.upiText}>UPI</Text>
              </View>
              <View>
                <Text style={s.payViaLabel}>Pay via</Text>
                <Text style={s.payViaText}>UPI / Cards</Text>
              </View>
              <ChevronDown size={wp(14)} color="#aaa" />
            </View>
            <TouchableOpacity
              onPress={handleStartTrial}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#8B7A3A', '#7A6A2A'] : ['#F0C040', '#D4A017']}
                style={s.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={s.ctaText}>
                    Start Trial for {'\u20B9'}
                    {trialPrice}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={s.ctaDisclaimer}>
            Secure payments. Cancel anytime.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default TrialBottomSheet;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D14',
  },
  scrollContent: {
    paddingHorizontal: wp(20),
  },

  proofBanner: {
    alignSelf: 'center',
    backgroundColor: '#1E1E2E',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    marginTop: hp(8),
    marginBottom: hp(14),
  },
  proofText: { color: '#ccc', fontSize: fp(12) },
  proofName: { color: '#4ADE80', fontWeight: '700' },
  proofCity: { color: '#4ADE80' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  closeBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: '#fff',
    fontSize: fp(18),
    fontWeight: '700',
  },
  trialBadgeInline: {
    color: '#000',
    backgroundColor: '#F0C040',
    fontSize: fp(12),
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: wp(6),
    borderRadius: wp(4),
    overflow: 'hidden',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  ratingText: { color: '#aaa', fontSize: fp(12), marginLeft: wp(4) },

  heroCard: {
    borderRadius: wp(16),
    padding: wp(20),
    borderWidth: 1,
    borderColor: '#F0C04030',
    marginBottom: hp(20),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(12) },
  brandIcon: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(8),
    backgroundColor: '#F0C040',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(8),
  },
  brandIconText: { color: '#000', fontWeight: '900', fontSize: fp(18) },
  brandName: { color: '#fff', fontSize: fp(16), fontWeight: '700' },
  brandTagline: { color: '#F0C040', fontSize: fp(10), fontWeight: '500' },

  heroTitle: {
    color: '#fff',
    fontSize: fp(34),
    fontWeight: '900',
    lineHeight: fp(40),
    marginBottom: hp(8),
  },
  heroTitleGold: { color: '#F0C040' },
  heroSubtitle: {
    color: '#ccc',
    fontSize: fp(14),
    lineHeight: fp(20),
    marginBottom: hp(16),
  },
  heroSubHighlight: { color: '#F0C040', fontWeight: '700' },

  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(4),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIconWrap: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(8),
    backgroundColor: '#F0C04015',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(6),
  },
  featureText: {
    color: '#fff',
    fontSize: fp(11),
    fontWeight: '600',
    lineHeight: fp(14),
    flexShrink: 1,
  },

  stepsContainer: {
    backgroundColor: '#141420',
    borderRadius: wp(16),
    padding: wp(20),
    marginBottom: hp(8),
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: hp(60),
  },
  stepIconCol: {
    alignItems: 'center',
    width: wp(40),
    marginRight: wp(12),
  },
  stepIconCircle: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#F0C04015',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F0C04030',
    marginVertical: hp(4),
  },
  stepTextCol: {
    flex: 1,
    paddingBottom: hp(16),
  },
  stepTitle: {
    color: '#fff',
    fontSize: fp(15),
    fontWeight: '700',
    marginBottom: hp(2),
  },
  stepSubtitle: {
    color: '#888',
    fontSize: fp(13),
    lineHeight: fp(18),
  },

  ctaContainer: {
    backgroundColor: '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    paddingHorizontal: wp(20),
    paddingTop: hp(12),
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payVia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  upiIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: '#5F259F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiText: {
    color: '#fff',
    fontSize: fp(10),
    fontWeight: '800',
  },
  payViaLabel: {
    color: '#777',
    fontSize: fp(10),
  },
  payViaText: {
    color: '#ccc',
    fontSize: fp(13),
    fontWeight: '600',
  },
  ctaButton: {
    paddingHorizontal: wp(24),
    paddingVertical: hp(14),
    borderRadius: wp(12),
    minWidth: wp(160),
    alignItems: 'center',
  },
  ctaText: {
    color: '#000',
    fontSize: fp(15),
    fontWeight: '800',
  },
  ctaDisclaimer: {
    color: '#666',
    fontSize: fp(11),
    textAlign: 'center',
    marginTop: hp(8),
  },
});
