import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Lock,
  Megaphone,
  Users2,
  Video,
  GraduationCap,
  Gift,
  Send,
  MessageSquare,
  UserCircle,
  Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

type Tile = {
  id: string;
  title: string;
  Icon: React.ComponentType<any>;
  bg: string;
  onPress?: () => void;
};

const CreateProducts = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const numColumns = 3;
  const gap = 14;
  const horizontalPad = 16;
  const tileSize = useMemo(() => {
    const totalGaps = gap * (numColumns - 1);
    const totalPad = horizontalPad * 2;
    return Math.floor((width - totalGaps - totalPad) / numColumns);
  }, []);

  const tiles: Tile[] = [
    { id: 'locked', title: 'Locked\nMessages', Icon: Lock, bg: '#F26522' },
    {
      id: 'channel',
      title: 'Channel\non Manchly',
      Icon: Megaphone,
      bg: '#2E91F6',
    },
    { id: 'group', title: 'Group\non Manchly', Icon: Users2, bg: '#7F49D6' },

    {
      id: 'webinar',
      title: 'Webinar &\nWorkshops',
      Icon: Video,
      bg: '#B03060',
    },
    { id: 'courses', title: 'Courses', Icon: GraduationCap, bg: '#2FBF71' },
    {
      id: 'freeLeads',
      title: 'Free Lead\nGeneration',
      Icon: Gift,
      bg: '#FF7A00',
    },

    {
      id: 'tgPaidChannel',
      title: 'Telegram\nPaid Channel',
      Icon: Send,
      bg: '#294A93',
    },
    {
      id: 'tgPaidGroup',
      title: 'Telegram\nPaid Group',
      Icon: Send,
      bg: '#3B1F8C',
    },
    {
      id: 'oneToOne',
      title: 'One-to-One\nInteraction',
      Icon: MessageSquare,
      bg: '#C2185B',
    },
  ];

  const renderItem = ({ item }: { item: Tile }) => (
    <Pressable
      onPress={item.onPress || (() => {})}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
      style={[
        styles.tile,
        { width: tileSize, height: tileSize, backgroundColor: item.bg },
      ]}
    >
      <item.Icon size={wp(34)} color={colors.white} />
      <Text style={styles.tileText}>{item.title}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.headerSub}>Products</Text>
              <Text style={styles.headerTitle}>Create</Text>
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

      <ScrollView contentContainerStyle={{ paddingBottom: hp(24) }}>
        {/* Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {}}
          style={styles.banner}
        >
          <Text style={styles.bannerText}>
            To launch a product, click here to complete your KYC by adding your
            PAN. ✅📝
          </Text>
        </TouchableOpacity>

        {/* Grid */}
        <View style={styles.gridWrap}>
          <FlatList
            data={tiles}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            numColumns={numColumns}
            scrollEnabled={false}
            columnWrapperStyle={{ gap }}
            ItemSeparatorComponent={() => <View style={{ height: gap }} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerWrapper: {
    backgroundColor: '#111111',
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
  headerSub: {
    fontSize: fp(12),
    color: '#999999',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
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
  banner: {
    backgroundColor: '#6A1B9A', // purple strip like the screenshot
    marginHorizontal: wp(16),
    marginTop: hp(12),
    borderRadius: wp(12),
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: fp(14.5),
    lineHeight: fp(20),
    fontWeight: '600',
  },
  gridWrap: {
    marginTop: hp(14),
    paddingHorizontal: wp(16),
  },
  tile: {
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(12),
    // soft shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tileText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: hp(10),
    fontSize: fp(12.5),
    lineHeight: fp(16),
  },
});
