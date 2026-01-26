import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar as RNStatusBar,
  ImageBackground,
} from 'react-native';
import { MessageCircle, UserIcon } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';

type ChatUser = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread?: number;
};

const chatUsers: ChatUser[] = [
  {
    id: 'u1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Hey! How are you?',
    time: '2:18 PM',
    unread: 2,
  },
  {
    id: 'u2',
    name: 'Sarah Smith',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Meeting confirmed for 5 PM.',
    time: '1:10 PM',
  },
  {
    id: 'u3',
    name: 'Michael Lee',
    lastMessage: 'Awesome, let’s do it.',
    time: 'Yesterday',
  },
];

const CreatorChat = () => {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);


  const renderItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => console.log('Open chat', item.name)}
    >
      {/* Avatar */}
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MessageCircle size={20} color="#fff" />
        </View>
      )}

      {/* User Info */}
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />
      <AppHeader title="Chats" />

      <Text style={{ marginTop: 200, textAlign: 'center' }}>This feature is currently under development.</Text>

      {/* <FlatList
        data={chatUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      /> */}
    </View>
  );
};

export default CreatorChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingVertical: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    color: '#111',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flexShrink: 1,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAEAEA',
    marginLeft: 76, // indent so it doesn't cross avatar
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 16,
    // paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  headerBg: {
    width: '100%',
    // paddingTop: 10,
    // paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 17,
  },
  mainHead: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  firstPara: { color: colors.primary, fontSize: 14, fontWeight: '400' },
  secPara: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  greetingText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
});
