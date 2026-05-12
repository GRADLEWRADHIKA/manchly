import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import SocketService from '../services/SocketService';

let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

const CallListener: React.FC = () => {
  const {token, user} = useSelector((state: any) => state.userReducer);
  const listenerSet = useRef(false);

  useEffect(() => {
    if (token) {
      SocketService.connect(token);
    } else {
      SocketService.disconnect();
    }

    return () => {
      SocketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token || listenerSet.current) return;
    listenerSet.current = true;

    const handleIncomingCall = (data: any) => {
      const {callId, sessionId, mode, caller} = data;

      if (navigationRef?.isReady()) {
        navigationRef.navigate('IncomingCallScreen', {
          callID: callId,
          sessionId,
          mode,
          callerName: caller?.name || 'Expert',
          callerImage: caller?.profile_image,
          callerId: caller?.id,
        });
      }
    };

    const handleCallDeclined = () => {
      Toast.show({
        type: 'error',
        text1: 'Call Declined',
        text2: 'The user declined your call.',
        position: 'top',
      });
    };

    const handleCallEnded = () => {
      Toast.show({
        type: 'info',
        text1: 'Call Ended',
        text2: 'The user disconnected the call.',
        position: 'top',
      });
    };

    SocketService.on('incoming_call', handleIncomingCall);
    SocketService.on('call_declined', handleCallDeclined);
    SocketService.on('call_ended', handleCallEnded);

    return () => {
      SocketService.off('incoming_call', handleIncomingCall);
      SocketService.off('call_declined', handleCallDeclined);
      SocketService.off('call_ended', handleCallEnded);
      listenerSet.current = false;
    };
  }, [token]);

  return null;
};

export default CallListener;
