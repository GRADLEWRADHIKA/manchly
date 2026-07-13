import React, {useState, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Bell, Instagram, UserCircle} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import CreatorView from './Course/CreatorView';
import CreatorWebinar from '../Webinar/CreatorWebinar';
import CreatorSessions from './CreatorSessions';

const TABS = ['Courses', 'Webinars', 'Sessions'] as const;
type TabType = (typeof TABS)[number];

const CreatorProducts: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user} = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const initialTab = route.params?.initialTab || 'Courses';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const slideAnim = useRef(new Animated.Value(TABS.indexOf(initialTab as TabType))).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const padding = wp(3);
  const tabCount = TABS.length;
  const sliderWidth = tabBarWidth > 0 ? (tabBarWidth - padding * 2) / tabCount : 0;

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    Animated.spring(slideAnim, {
      toValue: TABS.indexOf(tab),
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerWrapper, {paddingTop: insets.top}]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image source={{uri: user.profile_image}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.headerSub}>My Products</Text>
              <Text style={styles.headerTitle}>Products</Text>
            </View>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: wp(4)}}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/manchly_app')
              }>
              <Instagram size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('CreatorNotification')}>
              <Bell size={wp(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar with sliding indicator */}
        <View
          style={styles.tabBar}
          onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        >
          {sliderWidth > 0 && (
            <Animated.View
              style={[
                styles.tabSlider,
                {
                  width: sliderWidth,
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, sliderWidth, sliderWidth * 2],
                    }),
                  }],
                },
              ]}
            />
          )}
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'Courses' && <CreatorView embedded />}
        {activeTab === 'Webinars' && <CreatorWebinar embedded />}
        {activeTab === 'Sessions' && <CreatorSessions />}
      </View>
    </View>
  );
};

export default memo(CreatorProducts);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerWrapper: {
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  headerSub: {
    fontSize: fp(12),
    color: '#8A8A8A',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    marginBottom: hp(12),
    backgroundColor: '#1E1E1E',
    borderRadius: wp(14),
    padding: wp(3),
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabSlider: {
    position: 'absolute',
    top: wp(3),
    left: wp(3),
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: wp(12),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(9),
    borderRadius: wp(12),
    zIndex: 1,
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#8A8A8A',
  },
  tabTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
});