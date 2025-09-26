import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CreditCard as Edit3, Share, Users, BookOpen, Award, TrendingUp } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import colors from '../../theme/colors';
import { useAppDispatch } from '../../store/hooks';
import { clearStoredOtp } from '../../store/authSlice';

const ProfileScreen: React.FC = () => {
   const dispatch = useAppDispatch();
  const userStats = [
    { label: 'Courses', count: '12', icon: <BookOpen size={20} color={colors.primary} /> },
    { label: 'Students', count: '5.2K', icon: <Users size={20} color={colors.secondary} /> },
    { label: 'Revenue', count: '$12.5K', icon: <TrendingUp size={20} color={colors.accent} /> },
    { label: 'Rating', count: '4.9', icon: <Award size={20} color={colors.warning} /> },
  ];

  const achievements = [
    { title: 'Top Creator', description: '100+ courses created', icon: '🏆' },
    { title: 'Community Favorite', description: '10K+ students taught', icon: '💝' },
    { title: 'Expert Instructor', description: '4.9+ average rating', icon: '🌟' },
  ];

  const renderStat = (stat: any, index: number) => (
    <View key={index} style={[styles.statCard, index % 2 === 0 ? styles.statCardRight : null]}>
      <View style={styles.statIcon}>{stat.icon}</View>
      <Text style={styles.statCount}>{stat.count}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const renderAchievement = (achievement: any, index: number) => (
    <View key={index} style={[styles.achievementCard, index !== 0 ? styles.achievementCardSpacing : null]}>
      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
      </View>
    </View>
  );

  const onClearPress = async () => {
      const action = await dispatch(clearStoredOtp());
      if (clearStoredOtp.rejected.match(action)) {
        Alert.alert('Error', (action.payload as string) || 'Could not clear the saved code.');
      } else {
        Alert.alert('Cleared', 'Logout successful.');
      }
    };

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="dark-content" />
      <AppHeader title="Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>Sarah Johnson</Text>
              <Text style={styles.username}>@sarah_creates</Text>
              <Text style={styles.bio}>
                Digital Marketing Expert & Content Creator{'\n'}
                Helping entrepreneurs grow their business online
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconButton, styles.iconButtonSpacing]}>
              <Share size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Settings size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {userStats.map(renderStat)}
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map(renderAchievement)}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Privacy & Security</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={onClearPress}>
              <Text style={[styles.settingText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: colors.primary
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Action buttons */
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSpacing: {
    marginLeft: 12,
    marginRight: 12,
  },

  /* Stats */
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
  statCardRight: {
    // noop, kept for future tweaks
  },
  statIcon: {
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  /* Achievements */
  achievementsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  achievementsList: {
    // vertical spacing handled per item
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  achievementCardSpacing: {
    marginTop: 12,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  /* Settings */
  settingsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  settingsList: {
    // vertical spacing handled via items
  },
  settingItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
});

export default ProfileScreen;
