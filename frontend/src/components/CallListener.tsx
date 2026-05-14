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
      console.log('[CallListener] incoming_call received:', data);
      const {callId, sessionId, mode, caller} = data;

      // Ignore if we are the caller (server echoed it back to us)
      if (caller?.id === user?.id) {
        console.log('[CallListener] Ignoring own incoming_call echo');
        return;
      }

      if (navigationRef?.isReady()) {
        // Don't navigate if already on CallScreen or IncomingCallScreen
        const currentRoute = navigationRef.getCurrentRoute?.();
        if (currentRoute?.name === 'CallScreen' || currentRoute?.name === 'IncomingCallScreen') {
          console.log('[CallListener] Already on call screen, ignoring');
          return;
        }

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

    const handleCallDeclined = (data: any) => {
      console.log('[CallListener] call_declined received:', data);
      Toast.show({
        type: 'error',
        text1: 'Call Declined',
        text2: 'The user declined your call.',
        position: 'top',
      });
    };

    const handleCallEnded = (data: any) => {
      console.log('[CallListener] call_ended received:', data);
      // Ignore if this is our own event echoed back
      if (data.endedBy === user?.id) {
        console.log('[CallListener] Ignoring own call_ended echo');
        return;
      }
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
