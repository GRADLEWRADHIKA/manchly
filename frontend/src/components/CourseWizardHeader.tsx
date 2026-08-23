import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ArrowLeft, FileText, Video, Eye} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../utils/colors';
import {wp, hp, fp} from '../utils/responsive';

export type CourseWizardStep = 0 | 1 | 2;

const STEPS: {label: string; Icon: any}[] = [
  {label: 'COURSE', Icon: FileText},
  {label: 'VIDEO', Icon: Video},
  {label: 'PREVIEW', Icon: Eye},
];

const GOLD = '#F0C040';

const CourseWizardHeader = ({
  activeStep,
  title = 'Create Course',
  onBack,
}: {
  activeStep: CourseWizardStep;
  title?: string;
  onBack?: () => void;
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{paddingTop: insets.top + hp(6)}}>
      {/* Top bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack || (() => navigation.goBack())}
          hitSlop={12}
          activeOpacity={0.7}>
          <ArrowLeft color="#FFFFFF" size={wp(24)} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{width: wp(24)}} />
      </View>

      {/* Stepper */}
      <View style={styles.stepperRow}>
        {STEPS.map((s, i) => {
          const isActive = i === activeStep;
          const isCompleted = i < activeStep;
          const Icon = s.Icon;
          return (
            <React.Fragment key={s.label}>
              <View style={styles.stepperItem}>
                {isActive ? (
                  <LinearGradient
                    colors={['#F8DEAE', '#D69C3F']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.stepIconRing}>
                    <View style={styles.stepIconInner}>
                      <Icon size={wp(16)} color={GOLD} />
                    </View>
                  </LinearGradient>
                ) : isCompleted ? (
                  <View style={styles.stepIconCompleted}>
                    <Icon size={wp(16)} color={GOLD} />
                  </View>
                ) : (
                  <View style={styles.stepIconWrap}>
                    <Icon size={wp(16)} color="rgba(240,192,64,0.5)" />
                  </View>
                )}
                <Text
                  style={
                    isActive
                      ? styles.stepLabelActive
                      : isCompleted
                      ? styles.stepLabelCompleted
                      : styles.stepLabelInactive
                  }>
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export default CourseWizardHeader;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(10),
  },
  title: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
    paddingBottom: hp(14),
  },
  stepperItem: {
    alignItems: 'center',
    width: wp(64),
  },
  stepIconWrap: {
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
  stepIconCompleted: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#141414',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
  },
  stepIconRing: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
    shadowColor: '#FFDCA1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: wp(10),
    elevation: 10,
  },
  stepIconInner: {
    width: wp(35),
    height: wp(35),
    borderRadius: wp(17.5),
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: wp(19),
  },
  stepLineCompleted: {
    backgroundColor: GOLD,
  },
  stepLabelInactive: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    fontSize: fp(9),
    color: GOLD,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stepLabelCompleted: {
    fontSize: fp(9),
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
