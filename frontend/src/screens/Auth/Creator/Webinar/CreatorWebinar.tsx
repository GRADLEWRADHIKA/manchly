import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from '../Products/Webinar/WebinarCard';
import { Plus, Search, Presentation, UserCircle, Bell } from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import CustomTextInput from '../../../../components/CustomInput';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreatorWebinar = () => {
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
        <Presentation size={wp(48)} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Webinars Yet</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={wp(20)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={wp(18)} color={colors.textSecondary} />
        <CustomTextInput
          inputContainerStyle={styles.searchInput}
          inputStyle={{ fontSize: fp(14), color: colors.black }}
          placeholderTextColor={colors.borderColor}
          placeholder="Search webinars..."
          onChange={setSearchQuery as any}
          value={searchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.surface,
  },
  headerWrapper: {
    backgroundColor: '#111111',
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
    borderColor: '#2c2c2e',
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2c2c2e',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: '#999999',
    fontWeight: '500',
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginVertical: hp(12),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    backgroundColor: colors.white,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.lightGrey,
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
    color: colors.text,
    marginBottom: hp(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(24),
  },
  emptyCreateBtn: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderRadius: wp(50),
  },
});
