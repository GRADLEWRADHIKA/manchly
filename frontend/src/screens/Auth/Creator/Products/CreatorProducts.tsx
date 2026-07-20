import React, {useState, memo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {BookOpen, Users, Video} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import CreatorView from './Course/CreatorView';
import CreatorWebinar from '../Webinar/CreatorWebinar';
import CreatorSessions from './CreatorSessions';

// Figma gold palette (same as Dashboard)
const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const GOLD_GLOW = '#FFDCA1';

const TABS = ['Courses', 'Webinars', 'Sessions'] as const;
type TabType = (typeof TABS)[number];

const STEP_META: Record<TabType, {label: string; Icon: any}> = {
  Courses: {label: 'COURSES', Icon: BookOpen},
  Webinars: {label: 'WEBINARS', Icon: Video},
  Sessions: {label: 'SESSIONS', Icon: Users},
};

const CreatorProducts: React.FC = () => {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const initialTab = route.params?.initialTab || 'Courses';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return (
    <View style={styles.container}>
      {/* Centered Header */}
      <View style={[styles.headerArea, {paddingTop: insets.top + hp(14)}]}>
        <Text style={styles.title}>Products</Text>
      </View>

      {/* Stepper Selector */}
      <View style={styles.stepperRow}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab;
          const {label, Icon} = STEP_META[tab];
          return (
            <React.Fragment key={tab}>
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}>
                {isActive ? (
                  <LinearGradient
                    colors={[GOLD_CREAM, GOLD_DEEP]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.stepRingActive}>
                    <View style={styles.stepCircleActive}>
                      <Icon size={wp(16)} color={'#F0C040'} strokeWidth={2} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.stepCircle}>
                    <Icon
                      size={wp(16)}
                      color={'rgba(240,192,64,0.5)'}
                      strokeWidth={2}
                    />
                  </View>
                )}
                <Text
                  style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
              {i < TABS.length - 1 && <View style={styles.stepLine} />}
            </React.Fragment>
          );
        })}
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: wp(18),
    paddingBottom: hp(18),
  },
  title: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Stepper (same as Stats page)
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
    paddingBottom: hp(10),
  },
  stepItem: {
    alignItems: 'center',
    width: wp(64),
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: wp(19),
  },
  stepCircle: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
  },
  stepRingActive: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
    shadowColor: GOLD_GLOW,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: wp(10),
    elevation: 10,
  },
  stepCircleActive: {
    width: wp(35),
    height: wp(35),
    borderRadius: wp(17.5),
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: '#F0C040',
    fontWeight: '700',
  },

  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
