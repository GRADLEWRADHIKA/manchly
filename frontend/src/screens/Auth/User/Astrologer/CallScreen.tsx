import React, {useRef, useCallback, useEffect, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import {ZEGO_APP_ID, ZEGO_APP_SIGN} from '../../../../utils/zegoConfig';
import {endSession} from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';

// Sanitize IDs for Zego: only [a-zA-Z0-9_], max length
const sanitizeId = (id: string, max: number) =>
  String(id || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, max);

const CallScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const {user} = useSelector((state: any) => state.userReducer);
  const startTime = useRef(Date.now());
  const ended = useRef(false);

  const {callID: rawCallID, userID: rawUserID, userName, mode, sessionId, otherUserId} =
    route.params || {};

  const userID = useMemo(() => sanitizeId(rawUserID, 32), [rawUserID]);
  const callID = useMemo(() => sanitizeId(rawCallID, 64), [rawCallID]);
  const isVideoCall = mode === 'video' || mode === 'VIDEO';

  console.log('[CallScreen] Mounted with params:', {callID, userID, userName, mode, isVideoCall, sessionId, otherUserId});

  // Listen for other side ending the call
  useEffect(() => {
    const handleRemoteEnd = (data: any) => {
      console.log('[CallScreen] call_ended socket event received:', data);
      if (data.endedBy === rawUserID) return;
      if (data.callId === rawCallID && !ended.current) {
        ended.current = true;
        if (sessionId) {
          const durationMin = Math.ceil((Date.now() - startTime.current) / 60000);
          dispatch(endSession({sessionId, duration: durationMin}));
        }
        Toast.show({type: 'info', text1: 'Call Ended', text2: 'The other person disconnected.', position: 'top'});
        navigation.goBack();
      }
    };

    SocketService.on('call_ended', handleRemoteEnd);
    return () => { SocketService.off('call_ended', handleRemoteEnd); };
  }, [rawCallID, sessionId]);

  const handleCallEnd = useCallback(() => {
    if (ended.current) return;
    ended.current = true;

    if (sessionId) {
      const durationMin = Math.ceil((Date.now() - startTime.current) / 60000);
      dispatch(endSession({sessionId, duration: durationMin}));
    }

    if (otherUserId) {
      SocketService.emit('call_ended', {
        callId: rawCallID,
        otherUserId,
        endedBy: rawUserID,
      });
    }

    Toast.show({
      type: 'info',
      text1: 'Call Ended',
      text2: `Session lasted ${Math.ceil((Date.now() - startTime.current) / 60000)} min`,
      position: 'top',
    });
    navigation.goBack();
  }, [sessionId, dispatch, navigation, rawCallID, rawUserID, otherUserId]);

  // Memoize config so Zego doesn't remount on every render
  const zegoConfig = useMemo(() => ({
    ...(isVideoCall ? ONE_ON_ONE_VIDEO_CALL_CONFIG : ONE_ON_ONE_VOICE_CALL_CONFIG),
    onCallEnd: handleCallEnd,
    hangUpConfirmInfo: {
      title: 'End Call',
      message: 'Are you sure you want to end the call?',
      cancelButtonName: 'Cancel',
      confirmButtonName: 'End',
    },
    durationConfig: {
      isVisible: true,
    },
  }), [isVideoCall, handleCallEnd]);

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={ZEGO_APP_ID}
        appSign={ZEGO_APP_SIGN}
        userID={userID}
        userName={userName}
        callID={callID}
        config={zegoConfig}
      />
    </View>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
