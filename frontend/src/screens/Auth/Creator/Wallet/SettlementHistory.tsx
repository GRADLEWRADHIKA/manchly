import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {getSettlementHistory, getSettlementDetail} from '../../../../store/SettlementSlice';

const statusConfig: Record<string, {color: string; icon: any; label: string}> = {
  COMPLETED: {color: '#22C55E', icon: CheckCircle2, label: 'Completed'},
  PENDING: {color: '#F59E0B', icon: Clock, label: 'Pending'},
  PROCESSING: {color: '#3B82F6', icon: Clock, label: 'Processing'},
  FAILED: {color: '#EF4444', icon: AlertCircle, label: 'Failed'},
};

const SettlementHistory: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const {settlements, loading} = useSelector((s: any) => s.settlementReducer);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getSettlementHistory({page: 1, limit: 20}));
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    dispatch(getSettlementHistory({page: nextPage, limit: 20}));
  };

  const renderItem = ({item}: {item: any}) => {
    const config = statusConfig[item.status] || statusConfig.PENDING;
    const StatusIcon = config.icon;
    const amount = Number(item.amount || item.net_amount || 0);
    const date = item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => dispatch(getSettlementDetail(item.id))}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconWrap, {backgroundColor: config.color + '15'}]}>
            <StatusIcon size={wp(18)} color={config.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Settlement #{item.id?.slice(-6)}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardAmount, {color: config.color}]}>
            {amount >= 0 ? '+' : ''}₹{Math.abs(amount).toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, {backgroundColor: config.color + '15'}]}>
            <Text style={[styles.statusText, {color: config.color}]}>{config.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const list = Array.isArray(settlements) ? settlements : settlements?.settlements || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={wp(24)} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement History</Text>
        <View style={{width: wp(34)}} />
      </View>

      {loading && list.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.centered}>
          <Banknote size={wp(48)} color={colors.gold} strokeWidth={1.2} />
          <Text style={styles.emptyTitle}>No settlements yet</Text>
          <Text style={styles.emptySub}>
            Your settlement history will appear here once payouts are processed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator style={{marginVertical: hp(16)}} color={colors.gold} /> : null}
        />
      )}
    </SafeAreaView>
  );
};

export default SettlementHistory;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'rgba(0,0,0,0.75)'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: 'transparent',
  },
  backBtn: {padding: wp(4)},
  headerTitle: {fontSize: fp(17), fontWeight: '700', color: colors.white},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(32)},
  emptyTitle: {fontSize: fp(18), fontWeight: '700', color: colors.textPrimary, marginTop: hp(16)},
  emptySub: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: hp(8),
    lineHeight: fp(20),
  },
  listContent: {padding: wp(16)},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardLeft: {flexDirection: 'row', alignItems: 'center', gap: wp(12), flex: 1},
  iconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {flex: 1},
  cardTitle: {fontSize: fp(14), fontWeight: '600', color: colors.textPrimary},
  cardDate: {fontSize: fp(11), color: 'rgba(255,255,255,0.5)', marginTop: hp(2)},
  cardRight: {alignItems: 'flex-end', gap: hp(4)},
  cardAmount: {fontSize: fp(15), fontWeight: '700'},
  statusBadge: {paddingHorizontal: wp(8), paddingVertical: hp(2), borderRadius: wp(6)},
  statusText: {fontSize: fp(10), fontWeight: '700'},
});
