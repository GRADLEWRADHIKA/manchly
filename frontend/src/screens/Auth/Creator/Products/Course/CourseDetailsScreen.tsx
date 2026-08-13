import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  Users,
  Play,
  CheckCircle,
  BookOpen,
  Video,
  Award,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit3,
  Share2,
  Trash2,
  Clock,
  Calendar,
  UserPlus,
} from 'lucide-react-native';
import {Menu} from 'react-native-paper';
import colors from '../../../../../utils/colors';
import AiButton from '../../../../../components/AiButton';
import LandingCopyModal from '../../../../../components/ai/LandingCopyModal';
import {wp, hp, fp} from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import {getCourseById, grantCourseAccess} from '../../../../../store/CourseSlice';
import AddUserModal from '../../../../../components/AddUserModal';
import {createPaymentOrder, verifyPayment} from '../../../../../store/PaymentSlice';
import {getEnrolledCourses} from '../../../../../store/EnrollmentSlice';

// ─── Stepper steps ────────────────────────────────────────────────────────────
const STEPS = [
  {Icon: BookOpen, label: 'Course'},
  {Icon: Video,    label: 'Lessons'},
  {Icon: Award,    label: 'Publish'},
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatToday = () => {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString('en-IN', {month: 'short'})} ${d.getFullYear()}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const [showLandingCopy, setShowLandingCopy] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);

  // fromCreate flag + fallback data passed from CreateCourse
  const fromCreate: boolean = route.params?.fromCreate ?? false;
  const courseData: any  = route.params?.courseData  || {};
  const courseId: string = route.params?.courseId || route.params?.id;

  const {current: course} = useSelector((state: any) => state.coursesReducer);
  const {list: enrolledCourses} = useSelector((state: any) => state.enrollmentsReducer);
  const {loading} = useSelector((state: any) => state.paymentReducer);
  const {user} = useSelector((state: any) => state.userReducer);

  const displayCourse = course || courseData;

  const price      = Number(displayCourse?.price || 0);
  const gst        = (price * 18) / 100;
  const platformFee = (price * 2) / 100;
  const total      = price + gst + platformFee;

  useEffect(() => {
    if (courseId) {
      dispatch(getCourseById(courseId));
      dispatch(getEnrolledCourses({}));
    }
  }, [courseId]);

  const isEnrolled = enrolledCourses?.enrollments?.some(
    (e: any) => e.course_id === courseId,
  );

  const openMenu  = () => setMenuVisible(true);
  const closeMenu = () => { setMenuVisible(false); setMenuKey(k => k + 1); };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this course: ${displayCourse?.title || ''}`,
      });
    } catch {}
  };

  const videoCount = displayCourse?.videos?.length || 0;
  const setupProgress = 25;

  // ── Loading ──
  if (!displayCourse?.title) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Course Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </View>
    );
  }

  // ── Success layout (after creation) ──
  if (fromCreate) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Course Details" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* Stepper */}
          <View style={styles.stepperRow}>
            {STEPS.map(({Icon, label}, index) => {
              const isActive = index === 0;
              return (
                <React.Fragment key={label}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                      <Icon
                        size={wp(16)}
                        color={isActive ? colors.bg : colors.textMuted}
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                      {label}
                    </Text>
                  </View>
                  {index < STEPS.length - 1 && <View style={styles.stepLine} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Success banner */}
          <View style={styles.successBanner}>
            <View style={styles.successIconWrap}>
              <CheckCircle size={wp(40)} color={colors.gold} strokeWidth={1.5} />
            </View>
            <Text style={styles.successTitle}>Course Created{'\n'}Successfully!</Text>
            <Text style={styles.successSub}>
              Your course has been created as a draft.{'\n'}
              Complete the following steps to publish it.
            </Text>
          </View>

          {/* Course Overview */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Course Overview</Text>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => navigation.navigate('CourseVideoList', {item: displayCourse})}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <ChevronRight size={wp(14)} color={colors.gold} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Compact course card */}
          <View style={styles.courseCard}>
            {/* Thumbnail */}
            <View style={styles.thumbWrap}>
              {displayCourse?.thumbnail || displayCourse?.thumbnail_url ? (
                <Image
                  source={{uri: displayCourse.thumbnail || displayCourse.thumbnail_url}}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbFallback}>
                  <BookOpen size={wp(22)} color={colors.gold} strokeWidth={1.5} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {displayCourse?.title}
              </Text>
              <View style={styles.badgeRow}>
                {displayCourse?.price ? (
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>₹{displayCourse.price}</Text>
                  </View>
                ) : null}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {(displayCourse?.status || 'DRAFT').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Clock size={wp(11)} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.metaText}>{videoCount} Lessons • 0 hrs</Text>
                <View style={styles.metaDot} />
                <Calendar size={wp(11)} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.metaText}>Created on {formatToday()}</Text>
              </View>
            </View>

            {/* 3-dot menu */}
            <View style={styles.menuWrap}>
              <Menu
                key={menuKey}
                visible={menuVisible}
                onDismiss={closeMenu}
                contentStyle={styles.menuContent}
                anchor={
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={openMenu}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <MoreVertical size={wp(18)} color={colors.textSecondary} />
                  </TouchableOpacity>
                }>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(
                      () => navigation.navigate('CourseVideoList', {item: displayCourse}),
                      350,
                    );
                  }}>
                  <Eye size={wp(16)} color={colors.gold} />
                  <Text style={[styles.menuItemText, {color: colors.gold}]}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(
                      () => navigation.navigate('CreateCourse', {data: displayCourse, isUpdated: true}),
                      350,
                    );
                  }}>
                  <Edit3 size={wp(16)} color={colors.gold} />
                  <Text style={[styles.menuItemText, {color: colors.gold}]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(handleShare, 350);
                  }}>
                  <Share2 size={wp(16)} color={colors.cSuccess} />
                  <Text style={[styles.menuItemText, {color: colors.cSuccess}]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => setShowAddUser(true), 350);
                  }}>
                  <UserPlus size={wp(16)} color={colors.gold} />
                  <Text style={[styles.menuItemText, {color: colors.gold}]}>Add user</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => navigation.goBack(), 350);
                  }}>
                  <Trash2 size={wp(16)} color={colors.cError} />
                  <Text style={[styles.menuItemText, {color: colors.cError}]}>Delete</Text>
                </TouchableOpacity>
              </Menu>
            </View>
          </View>

          {/* Setup Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Course Setup Progress</Text>
              <Text style={styles.progressPct}>{setupProgress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${setupProgress}%`}]} />
            </View>
            <Text style={styles.progressMotivation}>Keep going! You're doing great 🚀</Text>
          </View>
        </ScrollView>

        <AddUserModal
          visible={showAddUser}
          onClose={() => setShowAddUser(false)}
          productTitle={displayCourse?.title || 'this course'}
          productType="course"
          onGrant={identifier =>
            dispatch(
              grantCourseAccess({courseId: displayCourse?.id || courseId, ...identifier}),
            ).unwrap()
          }
        />

        <LandingCopyModal
          visible={showLandingCopy}
          onClose={() => setShowLandingCopy(false)}
          title={displayCourse?.title || ''}
          description={displayCourse?.description || ''}
          price={price}
        />
      </View>
    );
  }

  // ── Normal course detail layout (existing functionality) ──
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Details" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {displayCourse.thumbnail && (
          <Image source={{uri: displayCourse.thumbnail}} style={styles.thumbnail} />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{displayCourse.title}</Text>

          {displayCourse.creator?.name && (
            <Text style={styles.instructor}>by {displayCourse.creator.name}</Text>
          )}

          {displayCourse.description && (
            <View style={styles.section}>
              <Text style={styles.detailSectionTitle}>About this course</Text>
              <Text style={styles.description}>{displayCourse.description}</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={wp(18)} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {displayCourse.enrollments?.length || 0} students
              </Text>
            </View>
            <View style={styles.statItem}>
              <Play size={wp(18)} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {displayCourse.videos?.length || 0} videos
              </Text>
            </View>
          </View>

          <AiButton
            label="Suggest Landing Copy"
            onPress={() => setShowLandingCopy(true)}
            style={{alignSelf: 'flex-start', marginTop: hp(8)}}
          />

          {/* Payment Details */}
          <View style={styles.priceBox}>
            <Text style={styles.detailSectionTitle}>Payment Details</Text>
            <PriceRow label="Course Fee"      value={`₹${price}`} />
            <PriceRow label="GST (18%)"       value={`₹${gst.toFixed(2)}`} />
            <PriceRow label="Platform Fee (2%)" value={`₹${platformFee.toFixed(2)}`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LandingCopyModal
        visible={showLandingCopy}
        onClose={() => setShowLandingCopy(false)}
        title={displayCourse?.title || ''}
        description={displayCourse?.description || ''}
        price={price}
      />
    </View>
  );
};

export default CourseDetailsScreen;

// ─── Price row helper ─────────────────────────────────────────────────────────
const PriceRow = ({label, value}: any) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>{label}</Text>
    <Text style={styles.priceValue}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        {flex: 1, backgroundColor: colors.bg},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scrollContent:    {paddingHorizontal: wp(16), paddingTop: hp(20), paddingBottom: hp(40)},

  // ── Stepper ──
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(28),
    paddingHorizontal: wp(8),
  },
  stepItem:   {alignItems: 'center', gap: hp(6)},
  stepCircle: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(21),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  stepLabel:       {fontSize: fp(10), color: colors.textMuted, fontWeight: '500'},
  stepLabelActive: {color: colors.gold, fontWeight: '700'},
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.border,
    marginBottom: hp(20),
    marginHorizontal: wp(6),
  },

  // ── Success banner ──
  successBanner: {alignItems: 'center', marginBottom: hp(32), paddingHorizontal: wp(16)},
  successIconWrap: {
    width: wp(76),
    height: wp(76),
    borderRadius: wp(38),
    backgroundColor: colors.goldDim,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(10),
    lineHeight: fp(32),
    letterSpacing: 0.3,
  },
  successSub: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
  },

  // ── Section header ──
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  sectionTitle:   {fontSize: fp(14), fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2},
  viewDetailsBtn: {flexDirection: 'row', alignItems: 'center', gap: wp(3)},
  viewDetailsText:{fontSize: fp(12), color: colors.gold, fontWeight: '600'},

  // ── Compact course card ──
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(12),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.border,
    gap: wp(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  thumbWrap: {width: wp(66), height: wp(66), borderRadius: wp(10), overflow: 'hidden', flexShrink: 0},
  thumb:     {width: '100%', height: '100%'},
  thumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo:  {flex: 1, gap: hp(5)},
  cardTitle: {fontSize: fp(13), fontWeight: '700', color: colors.textPrimary, lineHeight: fp(19)},
  badgeRow:  {flexDirection: 'row', alignItems: 'center', gap: wp(6)},
  priceBadge: {
    backgroundColor: colors.goldDim,
    borderRadius: wp(6),
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderWidth: 1,
    borderColor: colors.gold,
  },
  priceBadgeText: {fontSize: fp(11), fontWeight: '800', color: colors.gold},
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(6),
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadgeText: {fontSize: fp(10), fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.6},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: wp(4), flexWrap: 'wrap'},
  metaText: {fontSize: fp(10), color: colors.textMuted},
  metaDot:  {width: wp(3), height: wp(3), borderRadius: wp(2), backgroundColor: colors.textMuted},

  // ── 3-dot menu ──
  menuWrap: {alignSelf: 'flex-start'},
  moreBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuContent: {
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: hp(4),
    minWidth: wp(150),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
  },
  menuItemText: {fontSize: fp(13), fontWeight: '600'},
  menuDivider:  {height: 1, marginHorizontal: wp(12), backgroundColor: colors.border},

  // ── Progress card ──
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(10)},
  progressTitle:      {fontSize: fp(13), fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2},
  progressPct:        {fontSize: fp(15), fontWeight: '800', color: colors.gold},
  progressTrack: {
    height: hp(7),
    backgroundColor: colors.inputBg,
    borderRadius: wp(4),
    overflow: 'hidden',
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: wp(4),
    elevation: 2,
    shadowColor: colors.gold,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressMotivation: {fontSize: fp(12), color: colors.textSecondary, fontStyle: 'italic'},

  // ── Normal detail view (existing functionality) ──
  thumbnail:  {width: '100%', height: hp(220)},
  content:    {padding: wp(16)},
  title:      {fontSize: fp(24), fontWeight: '700', color: colors.textPrimary},
  instructor: {color: colors.textSecondary, marginBottom: hp(16)},
  section:    {marginVertical: hp(16)},
  detailSectionTitle: {
    fontSize: fp(18),
    fontWeight: '600',
    marginBottom: hp(10),
    color: colors.textPrimary,
  },
  description:    {fontSize: fp(15), lineHeight: fp(22), color: colors.textSecondary},
  statsContainer: {flexDirection: 'row', gap: wp(16), marginVertical: hp(12)},
  statItem:       {flexDirection: 'row', gap: wp(6), alignItems: 'center'},
  statText:       {color: colors.textSecondary},
  priceBox: {
    backgroundColor: colors.surface,
    padding: wp(16),
    borderRadius: wp(12),
    marginTop: hp(20),
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow:   {flexDirection: 'row', justifyContent: 'space-between', marginVertical: hp(6)},
  priceLabel: {color: colors.textSecondary},
  priceValue: {fontWeight: '600', color: colors.textPrimary},
  totalRow: {
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: hp(10),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {fontSize: fp(16), fontWeight: '700', color: colors.textPrimary},
  totalValue: {fontSize: fp(18), fontWeight: '800', color: colors.gold},
});
