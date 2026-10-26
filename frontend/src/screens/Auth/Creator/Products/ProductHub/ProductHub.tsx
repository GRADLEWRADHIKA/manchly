import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Menu, Bell, UserCircle } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

// ── Embedded child screens ───────────────────────────────────────────────────
import CreateCourse from '../Products/Course/CreateCourse';
import CreateSessionProduct from '../Products/CreateSessionProduct';
import CreateWebinar from '../Webinar/CreatorWebinar';

const ProductsHub = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);
  const [activeTab, setActiveTab] = useState<'Courses' | 'Webinars' | 'Sessions'>('Courses');

  return (
    <View style={styles.container}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('CreatorSetting')}
        >
          <Menu size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>Manchly</Text>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={22} color={colors.textPrimary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <UserCircle size={24} color={colors.white} />
            </View>
          )}
        </View>
      </View>

      {/* ── Segmented Tab Row ────────────────────────────────────────────── */}
      <View style={styles.tabRowContainer}>
        <View style={styles.tabRow}>
          {(['Courses', 'Webinars', 'Sessions'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabSegment,
                  isActive ? styles.tabSegmentActive : styles.tabSegmentInactive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Embedded Screen Content ──────────────────────────────────────── */}
      <View style={styles.contentArea}>
        {activeTab === 'Courses' && <CreateCourse embedded={true} />}
        {activeTab === 'Webinars' && <CreateWebinar embedded={true} />}
        {activeTab === 'Sessions' && <CreateSessionProduct embedded={true} />}
      </View>

    </View>
  );
};

export default ProductsHub;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  iconButton: {
    padding: wp(6),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(6),
    right: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.gold,
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  avatar: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Segmented Tab Control
  tabRowContainer: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 4,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabSegmentActive: {
    backgroundColor: colors.gold,
  },
  tabSegmentInactive: {
    backgroundColor: colors.surface,
    marginHorizontal: 1,
  },
  tabText: {
    fontSize: fp(13),
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Content Area
  contentArea: {
    flex: 1,
  },
});