import React, {useState, useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Star,
  Phone,
  Video,
  Clock,
  IndianRupee,
  Globe,
  Shield,
  Wallet,
  User2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {getExpertDetail, bookSession} from '../../../../store/SessionSlice';

const ExpertDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();
  const {user} = useSelector((state: any) => state.userReducer);

  const expertParam = route.params?.expert;
  const [expert, setExpert] = useState<any>(expertParam);
  const [products, setProducts] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'call' | 'video'>('call');

  useEffect(() => {
    if (expertParam?.id) {
      dispatch(getExpertDetail(expertParam.id))
        .unwrap()
        .then((res: any) => {
          const data = res?.data;
          if (data) {
            setExpert(data);
            setProducts(data.products || []);
          }
        });
    }
  }, []);

  const eu = expert?.user || expertParam?.user;

  const handleBookProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedMode(product.mode === 'VIDEO' ? 'video' : 'call');
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);

    if (selectedProduct) {
      dispatch(bookSession({product_id: selectedProduct.id}))
        .unwrap()
        .then(() => {
          Toast.show({
            type: 'success',
            text1: 'Session Booked!',
            text2: 'The expert will call you shortly.',
            position: 'bottom',
          });
          navigation.navigate('UserBottomTab', { screen: 'UserSessions' });
        });
    }
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Expert Profile" />

      <ScrollView
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + hp(100)}]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              {eu?.profile_image ? (
                <Image source={{uri: eu.profile_image}} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User2 size={wp(28)} color={colors.secPrimary} />
                </View>
              )}
              <View style={[styles.onlineDot, {backgroundColor: expert?.is_available ? colors.success : colors.textMuted}]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{eu?.name || 'Expert'}</Text>
              <Text style={styles.profileProf}>{expert?.profession}</Text>
              <View style={styles.onlineRow}>
                <View style={[styles.statusDot, {backgroundColor: expert?.is_available ? colors.success : colors.textMuted}]} />
                <Text style={[styles.statusText, {color: expert?.is_available ? colors.success : colors.textMuted}]}>
                  {expert?.is_available ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Star size={wp(16)} color={colors.golden} fill={colors.golden} strokeWidth={1} />
              <Text style={styles.statVal}>{(expert?.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Clock size={wp(16)} color={colors.info} strokeWidth={1.8} />
              <Text style={styles.statVal}>{expert?.experience || 0} yrs</Text>
              <Text style={styles.statLbl}>Exp</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Phone size={wp(16)} color={colors.secPrimary} strokeWidth={1.8} />
              <Text style={styles.statVal}>{expert?.total_sessions || 0}</Text>
              <Text style={styles.statLbl}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* About */}
        {expert?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{expert.bio}</Text>
          </View>
        )}

        {/* Languages */}
        {expert?.languages?.length > 0 && (
          <View style={styles.langRow}>
            <Globe size={wp(14)} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={styles.langText}>{expert.languages.join(', ')}</Text>
          </View>
        )}

        {/* Session Products (Bookable) */}
        {products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Book a Session</Text>
            {products.map((p: any) => {
              const isVideo = p.mode === 'VIDEO';
              return (
                <TouchableOpacity key={p.id} style={styles.productCard} activeOpacity={0.8} onPress={() => handleBookProduct(p)}>
                  <View style={[styles.productIcon, {backgroundColor: isVideo ? colors.success + '15' : colors.info + '15'}]}>
                    {isVideo ? <Video size={wp(20)} color={colors.success} strokeWidth={1.8} /> : <Phone size={wp(20)} color={colors.info} strokeWidth={1.8} />}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.productName}>{p.title}</Text>
                    <Text style={styles.productMeta}>{p.duration} min · {isVideo ? 'Video' : 'Audio'}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{p.price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA — Book */}
      {products.length > 0 && (
        <View style={[styles.bottomBar, {paddingBottom: insets.bottom + hp(10)}]}>
          <View>
            <Text style={styles.bottomPrice}>From ₹{Math.min(...products.map((p: any) => p.price))}</Text>
            <Text style={styles.bottomOnlineText}>
              {products.length} session{products.length > 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bottomBtn}
            activeOpacity={0.8}
            onPress={() => handleBookProduct(products[0])}>
            <Text style={styles.bottomBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConfirm(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>{selectedProduct ? 'Confirm Booking' : 'Start Session'}</Text>
            <View style={styles.modalInfoRow}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {(eu?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.modalName}>{eu?.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedProduct ? selectedProduct.title : (selectedMode === 'video' ? 'Video Call' : 'Audio Call')}
                </Text>
              </View>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalRow}>
              <IndianRupee size={wp(16)} color={colors.info} strokeWidth={1.8} />
              <Text style={styles.modalLabel}>{selectedProduct ? 'Price' : 'Rate'}</Text>
              <Text style={styles.modalValue}>
                {selectedProduct ? `₹${selectedProduct.price}` : `₹${selectedMode === 'video' ? expert?.video_rate : expert?.audio_rate}/min`}
              </Text>
            </View>
            {selectedProduct && (
              <View style={styles.modalRow}>
                <Clock size={wp(16)} color={colors.info} strokeWidth={1.8} />
                <Text style={styles.modalLabel}>Duration</Text>
                <Text style={styles.modalValue}>{selectedProduct.duration} min</Text>
              </View>
            )}
            <View style={styles.modalNote}>
              <Shield size={wp(14)} color={colors.success} strokeWidth={1.8} />
              <Text style={styles.modalNoteText}>Secure call. Session ends when either party disconnects.</Text>
            </View>
            <TouchableOpacity
              style={[styles.modalBtn, {backgroundColor: selectedMode === 'video' ? colors.success : colors.info}]}
              activeOpacity={0.8}
              onPress={handleConfirm}>
              {selectedMode === 'video' ? <Video size={wp(18)} color={colors.white} strokeWidth={2} /> : <Phone size={wp(18)} color={colors.white} strokeWidth={2} />}
              <Text style={styles.modalBtnText}>Book & Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirm(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default memo(ExpertDetail);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface},
  scroll: {paddingTop: hp(14)},
  profileCard: {backgroundColor: colors.white, marginHorizontal: wp(16), borderRadius: wp(16), padding: wp(16), borderWidth: 1, borderColor: colors.borderLight},
  profileTop: {flexDirection: 'row', alignItems: 'center'},
  avatarWrap: {position: 'relative'},
  avatarImg: {width: wp(64), height: wp(64), borderRadius: wp(32)},
  avatarPlaceholder: {width: wp(64), height: wp(64), borderRadius: wp(32), backgroundColor: colors.secPrimary + '18', alignItems: 'center', justifyContent: 'center'},
  onlineDot: {position: 'absolute', bottom: wp(2), right: wp(2), width: wp(14), height: wp(14), borderRadius: wp(7), borderWidth: 2, borderColor: colors.white},
  profileInfo: {marginLeft: wp(14), flex: 1},
  profileName: {fontSize: fp(17), fontWeight: '700', color: colors.text},
  profileProf: {fontSize: fp(12), color: colors.textSecondary, marginTop: hp(2)},
  onlineRow: {flexDirection: 'row', alignItems: 'center', marginTop: hp(4), gap: wp(4)},
  statusDot: {width: wp(7), height: wp(7), borderRadius: wp(4)},
  statusText: {fontSize: fp(11), fontWeight: '600'},
  statsGrid: {flexDirection: 'row', marginTop: hp(16), paddingTop: hp(14), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight, justifyContent: 'space-around'},
  statBox: {alignItems: 'center', gap: hp(3)},
  statVal: {fontSize: fp(14), fontWeight: '700', color: colors.text},
  statLbl: {fontSize: fp(10), color: colors.textMuted},
  statDiv: {width: 1, backgroundColor: colors.borderLight},
  section: {marginTop: hp(18), paddingHorizontal: wp(16)},
  sectionTitle: {fontSize: fp(15), fontWeight: '700', color: colors.text, marginBottom: hp(10)},
  aboutText: {fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20)},
  langRow: {flexDirection: 'row', alignItems: 'center', gap: wp(6), marginTop: hp(10), paddingHorizontal: wp(16)},
  langText: {fontSize: fp(12), color: colors.textSecondary},
  callRow: {flexDirection: 'row', gap: wp(12)},
  callBtn: {flex: 1, alignItems: 'center', paddingVertical: hp(18), borderRadius: wp(14), backgroundColor: colors.white, borderWidth: 1.5, gap: hp(6)},
  callBtnTitle: {fontSize: fp(14), fontWeight: '700', color: colors.text},
  callBtnPrice: {fontSize: fp(12), color: colors.textSecondary},
  productCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: wp(12), padding: wp(12), marginBottom: hp(8), borderWidth: 1, borderColor: colors.borderLight},
  productIcon: {width: wp(42), height: wp(42), borderRadius: wp(12), alignItems: 'center', justifyContent: 'center', marginRight: wp(12)},
  productName: {fontSize: fp(14), fontWeight: '600', color: colors.text},
  productMeta: {fontSize: fp(11), color: colors.textSecondary, marginTop: hp(2)},
  productPrice: {fontSize: fp(16), fontWeight: '800', color: colors.info},
  bottomBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, paddingHorizontal: wp(16), paddingTop: hp(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight},
  bottomPrice: {fontSize: fp(16), fontWeight: '700', color: colors.text},
  bottomOnline: {flexDirection: 'row', alignItems: 'center', gap: wp(4), marginTop: hp(2)},
  bottomDot: {width: wp(6), height: wp(6), borderRadius: wp(3), backgroundColor: colors.success},
  bottomOnlineText: {fontSize: fp(11), color: colors.success, fontWeight: '500'},
  bottomBtn: {backgroundColor: colors.secPrimary, borderRadius: wp(12), paddingHorizontal: wp(22), paddingVertical: hp(14), flexDirection: 'row', alignItems: 'center', gap: wp(8)},
  bottomBtnText: {fontSize: fp(14), fontWeight: '700', color: colors.white},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: colors.white, borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20), padding: wp(20), paddingBottom: hp(30)},
  modalTitle: {fontSize: fp(18), fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: hp(16)},
  modalInfoRow: {flexDirection: 'row', alignItems: 'center', gap: wp(12)},
  modalAvatar: {width: wp(44), height: wp(44), borderRadius: wp(22), backgroundColor: colors.secPrimary + '18', alignItems: 'center', justifyContent: 'center'},
  modalAvatarText: {fontSize: fp(14), fontWeight: '700', color: colors.secPrimary},
  modalName: {fontSize: fp(15), fontWeight: '600', color: colors.text},
  modalSub: {fontSize: fp(12), color: colors.textSecondary, marginTop: hp(2)},
  modalDivider: {height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginVertical: hp(16)},
  modalRow: {flexDirection: 'row', alignItems: 'center', gap: wp(10), marginBottom: hp(12)},
  modalLabel: {fontSize: fp(13), color: colors.textSecondary, flex: 1},
  modalValue: {fontSize: fp(14), fontWeight: '600', color: colors.text},
  modalNote: {flexDirection: 'row', alignItems: 'center', gap: wp(8), backgroundColor: colors.success + '10', borderRadius: wp(10), padding: wp(12), marginTop: hp(4), marginBottom: hp(20)},
  modalNoteText: {fontSize: fp(11), color: colors.success, flex: 1},
  modalBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(8), borderRadius: wp(14), paddingVertical: hp(16)},
  modalBtnText: {fontSize: fp(16), fontWeight: '700', color: colors.white},
  modalCancel: {alignItems: 'center', paddingVertical: hp(12), marginTop: hp(4)},
  modalCancelText: {fontSize: fp(14), fontWeight: '500', color: colors.textMuted},
});
