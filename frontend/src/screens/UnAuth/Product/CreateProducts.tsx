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
} from 'react-native';
import colors from '../../../theme/colors';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import {
  Lock,
  Megaphone,
  Users2,
  Video,
  GraduationCap,
  Gift,
  Send,
  MessageSquare,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Tile = {
  id: string;
  title: string;
  Icon: React.ComponentType<any>;
  bg: string;
  onPress?: () => void;
};

const CreateProducts = () => {
  // 3 columns with consistent spacing
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
    { id: 'channel', title: 'Channel\non Manchly', Icon: Megaphone, bg: '#2E91F6' },
    { id: 'group', title: 'Group\non Manchly', Icon: Users2, bg: '#7F49D6' },

    { id: 'webinar', title: 'Webinar &\nWorkshops', Icon: Video, bg: '#B03060' },
    { id: 'courses', title: 'Courses', Icon: GraduationCap, bg: '#2FBF71' },
    { id: 'freeLeads', title: 'Free Lead\nGeneration', Icon: Gift, bg: '#FF7A00' },

    { id: 'tgPaidChannel', title: 'Telegram\nPaid Channel', Icon: Send, bg: '#294A93' },
    { id: 'tgPaidGroup', title: 'Telegram\nPaid Group', Icon: Send, bg: '#3B1F8C' },
    { id: 'oneToOne', title: 'One-to-One\nInteraction', Icon: MessageSquare, bg: '#C2185B' },
  ];

  const renderItem = ({ item }: { item: Tile }) => (
    <Pressable
      onPress={item.onPress || (() => {})}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
      style={[styles.tile, { width: tileSize, height: tileSize, backgroundColor: item.bg }]}
    >
      <item.Icon size={34} color="#fff" />
      <Text style={styles.tileText}>{item.title}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Create" />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {}}
          style={styles.banner}
        >
          <Text style={styles.bannerText}>
            To launch a product, click here to complete your KYC by adding your PAN. ✅📝
          </Text>
        </TouchableOpacity>

        {/* Grid */}
        <View style={styles.gridWrap}>
          <FlatList
            data={tiles}
            keyExtractor={(i) => i.id}
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
  banner: {
    backgroundColor: '#6A1B9A', // purple strip like the screenshot
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '600',
  },
  gridWrap: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  tile: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tileText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 16,
  },
});
