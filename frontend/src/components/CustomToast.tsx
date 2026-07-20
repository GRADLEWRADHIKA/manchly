import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { CheckCircle2, XCircle, Info } from 'lucide-react-native';
import { wp, hp, fp } from '../utils/responsive';

type ToastType = 'success' | 'error' | 'info';

const TYPE_META: Record<ToastType, { Icon: any; color: string }> = {
  success: { Icon: CheckCircle2, color: '#22C55E' },
  error: { Icon: XCircle, color: '#EF4444' },
  info: { Icon: Info, color: '#3B82F6' },
};

interface AppToastProps {
  type: ToastType;
  text1?: string;
  text2?: string;
}

/**
 * Themed toast. The look adapts to the signed-in user type:
 *   • CREATOR  → dark navy card with a gold border (matches the creator UI)
 *   • USER     → light card with a warm accent (matches the user UI)
 * The left accent bar + icon are coloured by the toast type (success/error/info).
 */
const AppToast: React.FC<AppToastProps> = ({ type, text1, text2 }) => {
  const { user } = useSelector((state: any) => state.userReducer);
  const isCreator = user?.user_type !== 'USER';

  const { Icon, color } = TYPE_META[type] ?? TYPE_META.info;

  return (
    <View style={[styles.base, isCreator ? styles.creatorCard : styles.userCard]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Icon size={wp(20)} color={color} />
      </View>
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text
            style={isCreator ? styles.creatorTitle : styles.userTitle}
            numberOfLines={1}
          >
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text
            style={isCreator ? styles.creatorMsg : styles.userMsg}
            numberOfLines={3}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (p: any) => (
    <AppToast type="success" text1={p.text1} text2={p.text2} />
  ),
  error: (p: any) => <AppToast type="error" text1={p.text1} text2={p.text2} />,
  info: (p: any) => <AppToast type="info" text1={p.text1} text2={p.text2} />,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    minHeight: hp(56),
    borderRadius: wp(14),
    paddingVertical: hp(10),
    paddingRight: wp(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    width: wp(4),
    alignSelf: 'stretch',
    marginRight: wp(12),
  },
  iconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  textWrap: {
    flex: 1,
  },

  // ── Creator theme: dark neutral + gold (matches the creator cards) ──
  creatorCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(214,156,64,0.3)',
  },
  creatorTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorMsg: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(2),
    lineHeight: fp(17),
  },

  // ── User theme: light + warm ─────────────────────────────────────
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(105,38,38,0.15)',
  },
  userTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: '#3A1F1F',
  },
  userMsg: {
    fontSize: fp(12),
    color: '#6B5555',
    marginTop: hp(2),
    lineHeight: fp(17),
  },
});

export default AppToast;
