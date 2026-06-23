import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShieldOff } from 'lucide-react-native';
import colors from '../utils/colors';
import { fp, hp, wp } from '../utils/responsive';

type NotAuthorizedProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const NotAuthorized: React.FC<NotAuthorizedProps> = ({
  title = '403 Not Authorized',
  description = 'You do not have permission to access the Creator Marketplace. This area is reserved for Brand and Agency accounts.',
  actionLabel = 'Go to Dashboard',
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <ShieldOff size={wp(34)} color="#F87171" />
        </View>

        <Text style={styles.code}>403</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {onAction ? (
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={onAction}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default NotAuthorized;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(24),
  },
  card: {
    width: '100%',
    borderRadius: wp(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: wp(22),
    paddingVertical: hp(28),
    alignItems: 'center',
  },
  iconWrap: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  code: {
    color: '#DC2626',
    fontSize: fp(12),
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: hp(6),
  },
  title: {
    color: '#0F172A',
    fontSize: fp(22),
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: '#64748B',
    fontSize: fp(13),
    lineHeight: fp(20),
    textAlign: 'center',
    marginTop: hp(10),
  },
  actionButton: {
    marginTop: hp(22),
    backgroundColor: colors.secPrimary,
    borderRadius: wp(12),
    paddingHorizontal: wp(22),
    paddingVertical: hp(12),
  },
  actionText: {
    color: colors.white,
    fontSize: fp(14),
    fontWeight: '800',
  },
});
