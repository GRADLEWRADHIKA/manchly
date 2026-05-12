import React, {useRef, useCallback, useEffect} from 'react';
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

const CallScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const {user} = useSelector((state: any) => state.userReducer);
  const startTime = useRef(Date.now());
  const ended = useRef(false);

  const {callID, userID, userName, mode, sessionId, otherUserId} =
    route.params || {};

  const isVideoCall = mode === 'video';
  const config = isVideoCall
    ? ONE_ON_ONE_VIDEO_CALL_CONFIG
    : ONE_ON_ONE_VOICE_CALL_CONFIG;

  // Listen for other side ending the call
  useEffect(() => {
    const handleRemoteEnd = (data: any) => {
      if (data.callId === callID && !ended.current) {
        ended.current = true;

        // End session in DB
        if (sessionId) {
          const durationMs = Date.now() - startTime.current;
          const durationMin = Math.ceil(durationMs / 60000);
          dispatch(endSession({sessionId, duration: durationMin}));
        }

        Toast.show({
          type: 'info',
          text1: 'Call Ended',
          text2: 'The other person disconnected.',
          position: 'top',
        });

        navigation.goBack();
      }
    };

    SocketService.on('call_ended', handleRemoteEnd);
    return () => {
      SocketService.off('call_ended', handleRemoteEnd);
    };
  }, [callID, sessionId]);

  const handleCallEnd = useCallback(() => {
    if (ended.current) return;
    ended.current = true;

    // End session in DB
    if (sessionId) {
      const durationMs = Date.now() - startTime.current;
      const durationMin = Math.ceil(durationMs / 60000);
      dispatch(endSession({sessionId, duration: durationMin}));
    }

    // Notify the other side via socket
    const otherUser = otherUserId;
    if (otherUser) {
      SocketService.emit('call_ended', {
        callId: callID,
        otherUserId: otherUser,
      });
    }

    Toast.show({
      type: 'info',
      text1: 'Call Ended',
      text2: `Session lasted ${Math.ceil(
        (Date.now() - startTime.current) / 60000,
      )} min`,
      position: 'top',
    });

    navigation.goBack();
  }, [sessionId, dispatch, navigation, callID, otherUserId]);

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={ZEGO_APP_ID}
        appSign={ZEGO_APP_SIGN}
        userID={userID}
        userName={userName}
        callID={callID}
        config={{
          ...config,
          onCallEnd: handleCallEnd,
          durationConfig: {
            isVisible: true,
          },
        }}
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
