import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import {ArrowLeft, Send} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {getMessages, sendMessage, markMessagesRead, addSocketMessage} from '../../../../store/ChatSlice';
import SocketService from '../../../../services/SocketService';

const ChatThread = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const {user} = useSelector((s: any) => s.userReducer);
  const {messages: allMessages, messagesLoading} = useSelector((s: any) => s.chatReducer);

  const conversation = route.params?.conversation;
  const otherUser = route.params?.otherUser;
  const convId = conversation?.id;
  const messages = allMessages[convId] || [];
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (convId) {
      dispatch(getMessages(convId));
      dispatch(markMessagesRead(convId));
      SocketService.emit('join_conversation', convId);
    }
    return () => {
      if (convId) SocketService.emit('leave_conversation', convId);
    };
  }, [convId]);

  // Listen for new messages in this conversation
  useEffect(() => {
    const handler = (msg: any) => {
      const msgConvId = msg.conversationId || msg.conversation_id;
      if (msgConvId === convId) {
        dispatch(addSocketMessage(msg));
        dispatch(markMessagesRead(convId));
      }
    };
    SocketService.on('new_message', handler);
    return () => SocketService.off('new_message', handler);
  }, [convId]);

  // Typing indicator
  const [otherTyping, setOtherTyping] = useState(false);
  useEffect(() => {
    const handler = (data: any) => {
      if (data.conversationId === convId && data.userId !== user?.id) {
        setOtherTyping(data.isTyping);
      }
    };
    SocketService.on('user_typing', handler);
    return () => SocketService.off('user_typing', handler);
  }, [convId, user?.id]);

  // Read receipts
  useEffect(() => {
    const handler = (data: any) => {
      if (data.conversationId === convId) {
        // Could update message read status UI here
      }
    };
    SocketService.on('messages_read', handler);
    return () => SocketService.off('messages_read', handler);
  }, [convId]);

  const handleSend = useCallback(() => {
    if (!text.trim() || sending) return;
    setSending(true);

    // Send via socket for real-time
    SocketService.emit('send_message', {
      conversationId: convId,
      content: text.trim(),
      type: 'TEXT',
    });

    // Also send via API for persistence
    dispatch(sendMessage({conversationId: convId, content: text.trim()}))
      .finally(() => setSending(false));

    setText('');
  }, [text, convId, sending]);

  const handleTyping = useCallback(
    (val: string) => {
      setText(val);
      SocketService.emit('typing', {conversationId: convId, isTyping: val.length > 0});
    },
    [convId],
  );

  const otherName = otherUser?.name || 'User';
  const otherInitials = otherName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const isOnline = SocketService.isUserOnline(otherUser?.id);

  const renderMessage = ({item}: {item: any}) => {
    const senderId = item.sender_id || item.senderId || item.sender?.id;
    const isMine = senderId === user?.id;
    const time = item.created_at
      ? new Date(item.created_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})
      : '';

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.msgTimeMine : styles.msgTimeOther]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={wp(22)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {otherUser?.profile_image ? (
            <Image source={{uri: otherUser.profile_image}} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>{otherInitials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{otherName}</Text>
            <Text style={styles.headerStatus}>
              {otherTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {messagesLoading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.secPrimary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: any, idx) => item.id || String(idx)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: false})}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={handleTyping}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send size={wp(18)} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatThread;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  backBtn: {padding: wp(6)},
  headerInfo: {flexDirection: 'row', alignItems: 'center', gap: wp(10), marginLeft: wp(4)},
  headerAvatar: {width: wp(36), height: wp(36), borderRadius: wp(12)},
  headerAvatarFallback: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {fontSize: fp(12), fontWeight: '700', color: colors.secPrimary},
  headerName: {fontSize: fp(15), fontWeight: '600', color: colors.text},
  headerStatus: {fontSize: fp(11), color: colors.success, marginTop: hp(1)},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {fontSize: fp(14), color: colors.textSecondary},
  messagesList: {paddingHorizontal: wp(12), paddingVertical: hp(8), flexGrow: 1, justifyContent: 'flex-end'},
  msgRow: {marginBottom: hp(6)},
  msgRowMine: {alignItems: 'flex-end'},
  msgRowOther: {alignItems: 'flex-start'},
  bubble: {maxWidth: '78%', borderRadius: wp(16), paddingHorizontal: wp(14), paddingVertical: hp(8)},
  bubbleMine: {backgroundColor: colors.secPrimary, borderBottomRightRadius: wp(4)},
  bubbleOther: {backgroundColor: colors.white, borderBottomLeftRadius: wp(4), borderWidth: 1, borderColor: '#E8ECF0'},
  msgText: {fontSize: fp(14), lineHeight: fp(20)},
  msgTextMine: {color: colors.white},
  msgTextOther: {color: colors.text},
  msgTime: {fontSize: fp(10), marginTop: hp(2), alignSelf: 'flex-end'},
  msgTimeMine: {color: 'rgba(255,255,255,0.6)'},
  msgTimeOther: {color: colors.textSecondary},
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
  },
  textInput: {
    flex: 1,
    minHeight: hp(40),
    maxHeight: hp(100),
    backgroundColor: '#F1F5F9',
    borderRadius: wp(20),
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    fontSize: fp(14),
    color: colors.text,
    marginRight: wp(8),
  },
  sendBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.secPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {opacity: 0.5},
});
