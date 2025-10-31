import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Play, BookOpen, Users, Award, TrendingUp } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import KycCard from '../../Home/KeyCard';
import AppHeader from '../../../../components/AppHeader';
import { useSelector } from 'react-redux';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const [active, setActive] = useState(true);
  const { token } = useSelector((state: any) => state.userReducer);

  const quickStats = [
    {
      label: 'Active Courses',
      value: '12',
      icon: <BookOpen size={24} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '5.2K',
      icon: <Users size={24} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '94%',
      icon: <Award size={24} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹12.5K',
      icon: <TrendingUp size={24} color={colors.golden} />,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <RNStatusBar barStyle="light-content" />
      <AppHeader title="Manchly" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            A Manch for every Creator...
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {active ? (
              <KycCard />
            ) : (
              quickStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={styles.statIcon}>{stat.icon}</View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRight]}
              onPress={() => navigation.navigate('CreateWebinar')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Play size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Start Live</Text>
              <Text style={styles.actionSubtitle}>Go live instantly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateCourse')}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${colors.secondary}20` },
                ]}
              >
                <BookOpen size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>Create Course</Text>
              <Text style={styles.actionSubtitle}>Build new content</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: colors.white },
  welcomeSection: { padding: 16, alignItems: 'center' },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  actionsSection: { padding: 16 },
  actionsGrid: { flexDirection: 'row' },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionCardRight: { marginRight: 12 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  actionSubtitle: { fontSize: 12, color: colors.textSecondary },
});
