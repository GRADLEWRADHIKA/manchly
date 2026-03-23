import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from '../Products/Webinar/WebinarCard';
import { Plus, Search, Presentation } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
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

  useEffect(() => {
    fetchWebinars();
  }, [focus, refreshWebinar]);

  const fetchWebinars = () => {
    setLoading(true);
    const payload = { page: 1, limit: 50, upcoming: true, title: '' };
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
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Webinars</Text>
          <Text style={styles.headerSubtitle}>
            {webinarData.length} webinar{webinarData.length !== 1 ? 's' : ''}
          </Text>
        </LinearGradient>
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
          horizontal
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WebinarCard data={item} setRefreshWebinar={setRefreshWebinar} />
          )}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
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
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: wp(20),
    paddingVertical: hp(14),
  },
  headerTitle: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(2),
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
    paddingHorizontal: wp(4),
    paddingVertical: hp(8),
    paddingRight: wp(40),
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
