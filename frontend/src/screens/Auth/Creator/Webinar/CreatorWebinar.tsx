import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from '../Products/Webinar/WebinarCard';
import { Plus, Search, Presentation, UserCircle, Bell, Instagram } from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import CustomTextInput from '../../../../components/CustomInput';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreatorWebinar = ({embedded = false}: {embedded?: boolean}) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const focus = useIsFocused();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const [webinarData, setWebinarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshWebinar, setRefreshWebinar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  useEffect(() => {
    fetchWebinars();
  }, [focus, refreshWebinar]);

  const fetchWebinars = () => {
    setLoading(true);
    const payload = { page: 1, limit: 50, upcoming: true, title: '', my_webinars: true };
    dispatch(getAllWebinar(payload))
      .unwrap()
      .then(response => {
        setWebinarData(response?.data?.data?.webinars || []);
      })
      .finally(() => setLoading(false));
  };

  const filteredWebinars = useMemo(() => {
    if (!searchQuery.trim()) return webinarData;
    return webinarData.filter(item =>
      item?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, webinarData]);

  const handleCreateWebinar = () => {
    if (user?.kyc_verified) {
      navigation.navigate('CreateWebinar');
    } else {
      Toast.show({
        type: 'error',
        text1: 'KYC Required',
        text2: 'Please complete your KYC first',
        position: 'top',
      });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Presentation size={wp(48)} color={'#60A5FA'} />
      </View>
      <Text style={styles.emptyTitle}>No Webinars Yet</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {!embedded && (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profile_image ? (
                <Image
                  source={{ uri: user.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCircle size={wp(28)} color={colors.white} />
                </View>
              )}
              <View>
                <Text style={styles.headerSubtitle}>My Webinars</Text>
                <Text style={styles.headerTitle}>
                  {webinarData.length} webinar{webinarData.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
            >
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() =>
                  Linking.openURL('https://www.instagram.com/manchly_app')
                }
              >
                <Instagram size={wp(20)} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('CreatorNotification')}
              >
                <Bell size={wp(20)} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search size={wp(18)} color={'#64748B'} />
        <CustomTextInput
          inputContainerStyle={styles.searchInput}
          inputStyle={{ fontSize: fp(14), color: '#1A1A2E' }}
          placeholderTextColor={'#94A3B8'}
          placeholder="Search webinars..."
          onChange={setSearchQuery as any}
          value={searchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.cBg} />
          <Text style={styles.loadingText}>Loading webinars...</Text>
        </View>
      ) : filteredWebinars.length > 0 ? (
        <FlatList
          data={filteredWebinars}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WebinarCard data={item} setRefreshWebinar={setRefreshWebinar} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      <View style={styles.fabContainer}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={handleCreateWebinar}
          color={colors.white}
        />
      </View>
    </View>
  );
};

export default CreatorWebinar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerWrapper: {
    backgroundColor: colors.cBg,
     borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
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
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.cCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginVertical: hp(12),
    borderWidth: wp(1),
    borderColor: '#E2E8F0',
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    backgroundColor: '#F8FAFC',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchInput: {
    height: hp(42),
    width: '92%',
    borderRadius: wp(12),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(12),
  },
  loadingText: {
    color: '#64748B',
    fontSize: fp(14),
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    paddingBottom: hp(80),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    backgroundColor: '#E2E8F0',
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  emptyTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: hp(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(24),
  },
  emptyCreateBtn: {
    backgroundColor: '#0F3460',
    paddingHorizontal: wp(24),
    paddingVertical: hp(12),
    borderRadius: wp(12),
  },
  emptyCreateBtnText: {
    color: colors.white,
    fontSize: fp(15),
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    right: wp(16),
    bottom: hp(16),
  },
  fab: {
    backgroundColor: '#0F3460',
    borderRadius: wp(50),
  },
});
