import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

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
    lastMessage: 'Awesome, let\u2019s do it.',
    time: 'Yesterday',
  },
];

const UserChat = () => {
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
          <MessageCircle size={wp(20)} color="#fff" />
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
      <AppHeader title="Chats" />

      <Text style={{ marginTop: hp(200), textAlign: 'center' }}>
        This feature is currently under development.
      </Text>

      {/* <FlatList
        data={chatUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      /> */}
    </View>
  );
};

export default UserChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingVertical: hp(8),
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  avatar: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(24),
    marginRight: wp(12),
  },
  avatarPlaceholder: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(24),
    marginRight: wp(12),
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
    marginBottom: hp(4),
  },
  name: {
    fontSize: fp(16),
    fontWeight: '600',
    flexShrink: 1,
    color: '#111',
  },
  time: {
    fontSize: fp(12),
    color: '#888',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: fp(14),
    color: '#666',
    flexShrink: 1,
    flex: 1,
    marginRight: wp(8),
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: wp(10),
    minWidth: wp(20),
    height: hp(20),
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: fp(12),
    fontWeight: 'bold',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAEAEA',
    marginLeft: wp(76), // indent so it doesn't cross avatar
  },
});
