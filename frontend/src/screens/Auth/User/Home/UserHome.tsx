import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, Play, ChevronRight } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import SessionCard from '../../Creator/Home/SessionCard';

// ── Mock data ────────────────────────────────────────────────────────────────
const FEATURED = {
  title: 'Mastering Advanced Guitar Techniques',
  subtitle: "Pick up where you left off on Module 4: Sentiment Analysis in High-Frequency Markets.",
  image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
};

const RECOMMENDED = [
  { id: '1', title: '3D Illustration Masters', category: 'PREMIUM', level: '5+ Hours', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
  { id: '2', title: 'Creative Direction', category: 'FREE', level: '3+ Hours', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200' },
];

const LATEST_COURSES = [
  { id: '1', title: 'Advanced Systems Architecture', category: 'PREMIUM', level: 'Advanced', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200' },
  { id: '2', title: 'Creative Leadership', category: 'FREE', level: 'Beginner', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200' },
];

const LATEST_WEBINARS = [
  { id: '1', title: 'The Future of AI in Design', host: 'Hosted by Ryan Williams', isLive: true, image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=200' },
  { id: '2', title: 'Market Dynamics 2025', host: 'Hosted by Sara Ahmed', isLive: false, image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200' },
];

const UPCOMING_SESSIONS = [
  {
    id: '1',
    title: 'Macro Trends 2025: A Global Outlook',
    date: 'OCT 28',
    day: 'WED',
    host: 'Joi Hartley',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '2',
    title: 'Crypto Market Workshop',
    date: 'OCT 27',
    day: 'TUE',
    host: 'Alex Morgan',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
];

const UserHome = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'there';

  return (
    <View style={styles.container}>

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarLeft}>
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.brandTitle}>Manchly</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('UserNotification')}
        >
          <Bell size={22} color={colors.cText} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Featured Banner ──────────────────────────────────────── */}
        <View style={styles.featuredCard}>
          <Image source={{ uri: FEATURED.image }} style={styles.featuredImage} />
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>CONTINUE LEARNING</Text>
            </View>
            <Text style={styles.featuredTitle}>{FEATURED.title}</Text>
            <Text style={styles.featuredSubtitle} numberOfLines={2}>
              {FEATURED.subtitle}
            </Text>
            <TouchableOpacity style={styles.resumeBtn} activeOpacity={0.8}>
              <Play size={12} color={colors.white} fill={colors.white} style={{ marginRight: 4 }} />
              <Text style={styles.resumeBtnText}>Resume Class</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recommended For You ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All ›</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>Advance courses based on your recent progress.</Text>

        <FlatList
          data={RECOMMENDED}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.courseCard} activeOpacity={0.8}>
              <Image source={{ uri: item.image }} style={styles.courseCardImage} />
              <View style={styles.courseCardBadgeRow}>
                <View style={[
                  styles.courseCardBadge,
                  { backgroundColor: item.category === 'PREMIUM' ? colors.cCardLight : 'rgba(34,197,94,0.12)' },
                ]}>
                  <Text style={[
                    styles.courseCardBadgeText,
                    { color: item.category === 'PREMIUM' ? colors.cTextSecondary : '#22C55E' },
                  ]}>
                    {item.category}
                  </Text>
                </View>
                <Text style={styles.courseCardLevel}>{item.level}</Text>
              </View>
              <Text style={styles.courseCardTitle} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── Latest Courses ───────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Courses</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All ›</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>Freshly added content for your curiosity.</Text>

        <FlatList
          data={LATEST_COURSES}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.courseCard} activeOpacity={0.8}>
              <Image source={{ uri: item.image }} style={styles.courseCardImage} />
              <View style={styles.courseCardBadgeRow}>
                <View style={[
                  styles.courseCardBadge,
                  { backgroundColor: item.category === 'PREMIUM' ? colors.cCardLight : 'rgba(34,197,94,0.12)' },
                ]}>
                  <Text style={[
                    styles.courseCardBadgeText,
                    { color: item.category === 'PREMIUM' ? colors.cTextSecondary : '#22C55E' },
                  ]}>
                    {item.category}
                  </Text>
                </View>
                <Text style={styles.courseCardLevel}>{item.level}</Text>
              </View>
              <Text style={styles.courseCardTitle} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── Latest Webinars ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Webinars</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All ›</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>Join live discussions with industry experts.</Text>

        <FlatList
          data={LATEST_WEBINARS}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.webinarCard} activeOpacity={0.8}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: item.image }} style={styles.webinarImage} />
                {item.isLive && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.webinarTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.webinarHost}>{item.host}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── Upcoming Sessions ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All ›</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={UPCOMING_SESSIONS}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ExpertList')}
            >
              <View style={styles.sessionHeaderRow}>
                <View style={styles.sessionDateBox}>
                  <Text style={styles.sessionDay}>{item.day}</Text>
                  <Text style={styles.sessionDate}>{item.date.split(' ')[1]}</Text>
                </View>
                <View style={styles.liveSessionBadge}>
                  <Text style={styles.liveSessionBadgeText}>LIVE WEBINAR</Text>
                </View>
              </View>
              
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.sessionHostRow}>
                  <Image source={{ uri: item.avatar }} style={styles.sessionHostAvatar} />
                  <Text style={styles.sessionHostName}>{item.host}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

      </ScrollView>
    </View>
  );
};

export default UserHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollContent: {
    paddingBottom: hp(30),
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.cBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.cBorder,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  avatar: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
  },
  avatarFallback: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.cCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.cText,
    fontSize: fp(14),
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.cText,
    letterSpacing: -0.5,
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
    backgroundColor: colors.cAccentLight,
  },

  // Featured Card
  featuredCard: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    marginBottom: hp(20),
    borderRadius: 16,
    overflow: 'hidden',
    height: hp(180),
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 40, 0.65)',
    padding: wp(16),
    justifyContent: 'flex-end',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cAccentLight,
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    marginBottom: hp(8),
  },
  featuredBadgeText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  featuredSubtitle: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.75)',
    lineHeight: fp(16),
    marginBottom: hp(10),
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cAccentLight,
    paddingHorizontal: wp(14),
    paddingVertical: hp(7),
    borderRadius: 99,
  },
  resumeBtnText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '700',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.cText,
  },
  seeAllText: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    paddingHorizontal: wp(16),
    marginBottom: hp(12),
  },

  // Horizontal Lists
  horizontalList: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(20),
    gap: wp(12),
  },

  // Course Cards
  courseCard: {
    width: wp(160),
    backgroundColor: colors.cSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cBorderLight,
    overflow: 'hidden',
  },
  courseCardImage: {
    width: '100%',
    height: hp(100),
  },
  courseCardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(10),
    paddingTop: hp(8),
  },
  courseCardBadge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: 99,
  },
  courseCardBadgeText: {
    fontSize: fp(9),
    fontWeight: '700',
  },
  courseCardLevel: {
    fontSize: fp(10),
    color: colors.cTextMuted,
  },
  courseCardTitle: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.cText,
    paddingHorizontal: wp(10),
    paddingVertical: hp(8),
    lineHeight: fp(17),
  },

  // Webinar Cards
  webinarCard: {
    width: wp(160),
    backgroundColor: colors.cSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cBorderLight,
    overflow: 'hidden',
  },
  webinarImage: {
    width: '100%',
    height: hp(100),
  },
  webinarTitle: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.cText,
    padding: wp(10),
    lineHeight: fp(17),
  },

  // Session Cards
  sessionCard: {
    width: wp(220), 
    flexDirection: 'column',
    backgroundColor: colors.cSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cBorderLight,
    padding: wp(14),
    gap: wp(12),
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sessionDateBox: {
    width: wp(48),
    height: wp(48),
    borderRadius: 10,
    backgroundColor: colors.cCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDay: {
    fontSize: fp(9),
    fontWeight: '700',
    color: colors.cTextMuted,
    letterSpacing: 0.5,
  },
  sessionDate: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(22),
  },
  liveSessionBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 6,
  },
  liveSessionBadgeText: {
    fontSize: fp(9),
    color: colors.cTextSecondary,
    fontWeight: '600',
  },
  sessionInfo: {
    width: '100%',
  },
  sessionTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.cText,
    marginBottom: hp(8),
    lineHeight: fp(18),
  },
  sessionHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  sessionHostAvatar: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
  },
  sessionHostName: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
  },
  liveBadge : {
    position: 'absolute',
    top: hp(8),
    left: wp(8),
    backgroundColor: '#EF4444',
    paddingHorizontal: hp(6),
    paddingVertical: hp(3),
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  webinarHost: {
    fontSize: fp(10),
    color: colors.cTextMuted,
    paddingHorizontal: wp(10),
    paddingBottom: hp(8),
  },
});