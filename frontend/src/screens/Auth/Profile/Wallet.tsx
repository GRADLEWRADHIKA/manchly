import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { Wallet as WalletIcon, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const Wallet = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Wallet" />

      <View style={styles.content}>
        <View style={styles.badge}>
          <WalletIcon size={20} color={colors.white} />
          <Text style={styles.badgeText}>In Progress</Text>
        </View>

        <View style={styles.card}>
          <WalletIcon size={42} color={colors.primary} />
          <Text style={styles.title}>Wallet Feature Coming Soon</Text>
          <Text style={styles.subtitle}>
            We’re setting up your wallet to securely manage transactions,
            balances, and payouts.
          </Text>

          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>
              Integrating payments & history
            </Text>
          </View>

          <View style={styles.meta}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>Status: Pending</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ghostButton}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Text style={styles.ghostButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>
          This section will show your balance, transactions, and withdrawal
          options once live.
        </Text>
      </View>
    </View>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: wp(20),
    gap: wp(16),
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: wp(8),
    backgroundColor: colors.primary,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(999),
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(12),
    letterSpacing: 0.3,
  },
  card: {
    flex: 0,
    alignItems: 'center',
    gap: wp(10),
    padding: wp(20),
    borderRadius: wp(16),
    backgroundColor: '#F8FAFC',
    borderWidth: wp(1),
    borderColor: '#EDF2F7',
  },
  title: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.primary ?? '#0F172A',
  },
  subtitle: {
    fontSize: fp(14),
    textAlign: 'center',
    color: colors.textSecondary ?? '#475569',
  },
  progressRow: {
    marginTop: hp(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  progressText: {
    fontSize: fp(13),
    color: colors.textSecondary ?? '#475569',
  },
  meta: {
    marginTop: hp(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  metaText: {
    fontSize: fp(12),
    color: colors.textSecondary ?? '#64748B',
  },
  ghostButton: {
    marginTop: hp(10),
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    borderRadius: wp(999),
    borderWidth: wp(1),
    borderColor: '#E2E8F0',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.primary ?? '#0F172A',
    fontWeight: '600',
  },
  footerHint: {
    marginTop: 'auto',
    fontSize: fp(12),
    color: '#94A3B8',
    textAlign: 'center',
  },
});
