import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// TypeScript Interfaces
interface MetricItem {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  amount: string;
  type: 'course' | 'session' | 'webinar';
  time: string;
}

interface ChartBar {
  label: string;
  value: number; // 0 to 100 representing height percentage
  amount: string;
}

const CreatorDashboardOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Courses' | 'Webinars' | 'Sessions'>('Courses');

  // Hardcoded mock data based on active tab/context
  const metricsData: Record<'Courses' | 'Webinars' | 'Sessions', MetricItem[]> = {
    Courses: [
      { label: 'LIFETIME REVENUE', value: '₹2,84,950.00', change: '+15.7%', isPositive: true },
      { label: 'ACTIVE STUDENTS', value: '1,120', change: '+8.2%', isPositive: true },
      { label: 'COURSES PUBLISHED', value: '12', change: '0%', isPositive: true },
    ],
    Webinars: [
      { label: 'WEBINAR REVENUE', value: '₹1,42,850.00', change: '+12.4%', isPositive: true },
      { label: 'TOTAL ATTENDEES', value: '4,250', change: '+18.1%', isPositive: true },
      { label: 'STREAMED MINUTES', value: '18,450', change: '+9.5%', isPositive: true },
    ],
    Sessions: [
      { label: 'COACHING REVENUE', value: '₹12,840.00', change: '+8.4%', isPositive: true },
      { label: 'LIVE ENGAGEMENT', value: '2,450 min', change: '+12.4%', isPositive: true },
      { label: 'SUCCESS RATE', value: '96%', change: 'Stable', isPositive: true },
    ],
  };

  const activityData: Record<'Courses' | 'Webinars' | 'Sessions', ActivityItem[]> = {
    Courses: [
      { id: '1', title: 'Advanced Culinary Arts', meta: 'Enrollment by Sarah C.', amount: '₹2,499', type: 'course', time: '2 hrs ago' },
      { id: '2', title: 'Digital Product Design', meta: 'Enrollment by John D.', amount: '₹3,999', type: 'course', time: '5 hrs ago' },
      { id: '3', title: 'Cinematic Photography', meta: 'Enrollment by Alice M.', amount: '₹1,899', type: 'course', time: '1 day ago' },
    ],
    Webinars: [
      { id: '1', title: 'AI Content Strategy', meta: 'Ticket purchased by Bob S.', amount: '₹499', type: 'webinar', time: '1 hr ago' },
      { id: '2', title: 'Scaling Infrastructure', meta: 'Ticket purchased by Mike R.', amount: '₹799', type: 'webinar', time: '3 hrs ago' },
      { id: '3', title: 'Digital Finance Future', meta: 'Ticket purchased by Clara T.', amount: '₹599', type: 'webinar', time: '12 hrs ago' },
    ],
    Sessions: [
      { id: '1', title: '1:1 Business Strategy', meta: 'Booked by Dev Patel', amount: '₹1,500', type: 'session', time: 'Just now' },
      { id: '2', title: 'Career Guidance Mentorship', meta: 'Booked by Rohit K.', amount: '₹1,200', type: 'session', time: '30 mins ago' },
      { id: '3', title: 'Technical Architecture Review', meta: 'Booked by Priya S.', amount: '₹2,500', type: 'session', time: '2 hrs ago' },
    ],
  };

  const chartData: Record<'Courses' | 'Webinars' | 'Sessions', ChartBar[]> = {
    Courses: [
      { label: 'Jan', value: 30, amount: '₹32k' },
      { label: 'Mar', value: 50, amount: '₹54k' },
      { label: 'May', value: 45, amount: '₹48k' },
      { label: 'Jul', value: 75, amount: '₹82k' },
      { label: 'Sep', value: 60, amount: '₹68k' },
      { label: 'Nov', value: 90, amount: '₹96k' },
    ],
    Webinars: [
      { label: 'Wk 1', value: 40, amount: '₹15k' },
      { label: 'Wk 2', value: 65, amount: '₹28k' },
      { label: 'Wk 3', value: 50, amount: '₹22k' },
      { label: 'Wk 4', value: 85, amount: '₹42k' },
    ],
    Sessions: [
      { label: 'Mon', value: 20, amount: '₹1.5k' },
      { label: 'Tue', value: 45, amount: '₹3.2k' },
      { label: 'Wed', value: 35, amount: '₹2.4k' },
      { label: 'Thu', value: 75, amount: '₹5.8k' },
      { label: 'Fri', value: 60, amount: '₹4.2k' },
      { label: 'Sat', value: 95, amount: '₹8.4k' },
      { label: 'Sun', value: 100, amount: '₹12k' },
    ],
  };

  const currentMetrics = metricsData[activeTab];
  const currentActivity = activityData[activeTab];
  const currentChart = chartData[activeTab];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Block */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PERFORMANCE ENGINE</Text>
            <Text style={styles.brandTitle}>Manchly Studio</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
            <Text style={styles.avatarPlaceholder}>M</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Row */}
        <View style={styles.tabContainer}>
          {(['Courses', 'Webinars', 'Sessions'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabSegment, isActive && styles.tabSegmentActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Metrics Row */}
        <View style={styles.metricsContainer}>
          {currentMetrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                {metric.change !== '0%' && (
                  <View style={styles.changeBadge}>
                    <Text style={styles.changeBadgeText}>{metric.change}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>

        {/* Custom Data Visualization Bar Graph Section */}
        <View style={styles.visualizationCard}>
          <Text style={styles.sectionHeading}>Revenue Trend ({activeTab})</Text>
          <View style={styles.chartWrapper}>
            {currentChart.map((bar, index) => (
              <View key={index} style={styles.chartBarColumn}>
                <Text style={styles.chartAmountText}>{bar.amount}</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { height: `${bar.value}%` }]} />
                </View>
                <Text style={styles.chartLabelText}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionHeading}>Recent Transactions</Text>
          <View style={styles.activityList}>
            {currentActivity.map((activity, index) => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityLeft}>
                  <View style={styles.typeIndicator}>
                    <Text style={styles.typeIndicatorText}>
                      {activity.type === 'course' ? '📚' : activity.type === 'webinar' ? '🎥' : '🤝'}
                    </Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityMeta}>{activity.meta}</Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>{activity.amount}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatorDashboardOverview;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Header Block
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F0C040',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C2333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  avatarPlaceholder: {
    color: '#4F8EF7',
    fontWeight: '700',
    fontSize: 14,
  },

  // Tabs control
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabSegmentActive: {
    backgroundColor: '#1C2333',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },
  tabTextActive: {
    color: '#E6EDF3',
  },

  // Metrics Grid
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  changeBadge: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3FB950',
  },

  // Visualization Card
  visualizationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingBottom: 5,
  },
  chartBarColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartAmountText: {
    fontSize: 9,
    color: '#8B949E',
    marginBottom: 4,
  },
  chartBarTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#1C2333',
    borderRadius: 99,
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#7C5CFC', // purple accent chart bars
    borderRadius: 99,
    position: 'absolute',
    bottom: 0,
  },
  chartLabelText: {
    fontSize: 10,
    color: '#8B949E',
    marginTop: 6,
  },

  // Activity Container
  activityContainer: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  activityList: {
    marginTop: 4,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1C2333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIndicatorText: {
    fontSize: 14,
  },
  activityDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 11,
    color: '#8B949E',
  },
  activityRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3FB950',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#8B949E',
  },
});
