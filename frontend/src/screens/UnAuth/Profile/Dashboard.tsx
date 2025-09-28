import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import colors from '../../../theme/colors';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { Hammer, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const Dashboard = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Dashboard" />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Hammer size={20} color={colors.white} />
          <Text style={styles.badgeText}>In Progress</Text>
        </View>

        <View style={styles.card}>
          <Hammer size={42} color={colors.primary} />
          <Text style={styles.title}>Dashboard is Coming Soon</Text>
          <Text style={styles.subtitle}>
            We are working hard to bring you a powerful dashboard experience.
            Stay tuned!
          </Text>

          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>Building widgets & charts</Text>
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
          You can add a placeholder chart preview here to tease the feature.
        </Text>
      </View>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  card: {
    flex: 0,
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary ?? '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.textSecondary ?? '#475569',
  },
  progressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary ?? '#475569',
  },
  meta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary ?? '#64748B',
  },
  ghostButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
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
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
