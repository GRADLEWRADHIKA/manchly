import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import {MessageCircle} from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {getConversations} from '../../../../store/ChatSlice';
import SocketService from '../../../../services/SocketService';

const UserChat = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const isFocused = useIsFocused();
  const {conversations, loading} = useSelector((s: any) => s.chatReducer);
  const {user} = useSelector((s: any) => s.userReducer);

  useEffect(() => {
    if (isFocused) {
      dispatch(getConversations());
    }
  }, [isFocused]);

  const getOtherParticipant = useCallback(
    (conv: any) => {
      const participants = conv.participants || conv.conversation_participants || [];
      const other = participants.find((p: any) => {
        const uid = p.user_id || p.userId || p.user?.id;
        return uid !== user?.id;
      });
      return other?.user || other || {};
    },
    [user?.id],
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-IN', {weekday: 'short'});
    return d.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
  };

  const renderItem = ({item}: {item: any}) => {
    const other = getOtherParticipant(item);
    const name = other.name || 'User';
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const isOnline = SocketService.isUserOnline(other.id);
    const unread = item.unread_count || 0;

    return (
      <TouchableOpacity
        style={styles.convCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatThread', {conversation: item, otherUser: other})}>
        <View style={styles.avatarWrap}>
          {other.profile_image ? (
            <Image source={{uri: other.profile_image}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={[styles.onlineDot, {backgroundColor: isOnline ? colors.success : colors.textMuted}]} />
        </View>

        <View style={styles.convInfo}>
          <Text style={styles.convName} numberOfLines={1}>{name}</Text>
          <Text style={styles.convLastMsg} numberOfLines={1}>
            {item.last_message || 'Start a conversation'}
          </Text>
        </View>

        <View style={styles.convRight}>
          <Text style={styles.convTime}>{formatTime(item.last_message_at || item.updated_at)}</Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Chats" />

      {loading && conversations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.secPrimary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <MessageCircle size={wp(48)} color={colors.textMuted} strokeWidth={1.2} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            Start a conversation by booking a session or contacting an expert.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default UserChat;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(32)},
  emptyTitle: {fontSize: fp(18), fontWeight: '700', color: colors.text, marginTop: hp(16)},
  emptySub: {fontSize: fp(13), color: colors.textSecondary, textAlign: 'center', marginTop: hp(8), lineHeight: fp(20)},
  listContent: {paddingTop: hp(4)},
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECF0',
  },
  avatarWrap: {position: 'relative'},
  avatar: {width: wp(48), height: wp(48), borderRadius: wp(16)},
  avatarPlaceholder: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: fp(14), fontWeight: '700', color: colors.secPrimary},
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    borderWidth: 2,
    borderColor: colors.white,
  },
  convInfo: {flex: 1, marginLeft: wp(12)},
  convName: {fontSize: fp(15), fontWeight: '600', color: colors.text},
  convLastMsg: {fontSize: fp(13), color: colors.textSecondary, marginTop: hp(2)},
  convRight: {alignItems: 'flex-end', gap: hp(4)},
  convTime: {fontSize: fp(11), color: colors.textSecondary},
  unreadBadge: {
    backgroundColor: colors.secPrimary,
    borderRadius: wp(10),
    minWidth: wp(20),
    height: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  unreadText: {fontSize: fp(10), fontWeight: '800', color: colors.white},
});
