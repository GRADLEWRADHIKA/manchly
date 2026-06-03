import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
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
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.initialTab || 'Courses');

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

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
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
    backgroundColor: colors.cBg,
  },
  headerWrapper: {
    backgroundColor: colors.cBg,
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
    borderColor: colors.cBorder,
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cBorder,
  },
  headerSub: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.cText,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    marginBottom: hp(12),
    backgroundColor: colors.cCard,
    borderRadius: wp(12),
    padding: wp(3),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(9),
    borderRadius: wp(10),
  },
  tabActive: {
    backgroundColor: colors.cAccent,
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.cTextMuted,
  },
  tabTextActive: {
    color: colors.cText,
  },
  content: {
    flex: 1,
  },
});
