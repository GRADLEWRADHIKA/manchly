import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {X, Send, Sparkles} from 'lucide-react-native';
import colors from '../../utils/colors';
import {wp, hp, fp} from '../../utils/responsive';
import {aiCall} from '../../utils/aiApi';
import {useAssistant} from '../../context/AssistantContext';

type Message = {role: 'user' | 'assistant'; text: string};

const AssistantPanel = () => {
  const {isOpen, close} = useAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages(m => [...m, {role: 'user', text}]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const data = await aiCall('/ai/chat/assistant', {message: text});
      const reply = data?.reply || "Sorry, I couldn't generate a response.";
      setMessages(m => [...m, {role: 'assistant', text: reply}]);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    setError('');
    close();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.sheet}>
          <View style={s.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: wp(8)}}>
              <Sparkles size={wp(18)} color={colors.golden} />
              <Text style={s.title}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <X size={wp(20)} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={s.messageList}
            contentContainerStyle={s.messageListContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}>
            {messages.length === 0 && (
              <Text style={s.emptyText}>
                Ask me anything — course ideas, pricing, copywriting, or just talk through what
                you're stuck on.
              </Text>
            )}

            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  s.bubble,
                  m.role === 'user' ? s.bubbleUser : s.bubbleAssistant,
                ]}>
                <Text style={m.role === 'user' ? s.bubbleTextUser : s.bubbleTextAssistant}>
                  {m.text}
                </Text>
              </View>
            ))}

            {sending && (
              <View style={[s.bubble, s.bubbleAssistant]}>
                <Text style={s.bubbleTextAssistant}>Thinking…</Text>
              </View>
            )}

            {error ? <Text style={s.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={4000}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!input.trim() || sending}
              style={[s.sendButton, (!input.trim() || sending) && {opacity: 0.5}]}>
              <Send size={wp(18)} color={colors.black} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AssistantPanel;

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    height: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.white,
  },
  closeBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {flex: 1},
  messageListContent: {padding: wp(16), gap: hp(10)},
  emptyText: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(19),
    textAlign: 'center',
    marginTop: hp(40),
    paddingHorizontal: wp(20),
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: wp(14),
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.golden,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleTextUser: {
    color: colors.black,
    fontSize: fp(13.5),
    lineHeight: fp(19),
    fontWeight: '600',
  },
  bubbleTextAssistant: {
    color: '#D5C4AB',
    fontSize: fp(13.5),
    lineHeight: fp(19),
  },
  errorText: {
    color: colors.error,
    fontSize: fp(12),
    textAlign: 'center',
    marginTop: hp(6),
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp(8),
    padding: wp(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1E1E1E',
  },
  input: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    fontSize: fp(13.5),
    color: colors.white,
    maxHeight: hp(100),
  },
  sendButton: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.golden,
    alignItems: 'center',
    justifyContent: 'center',
  },
});