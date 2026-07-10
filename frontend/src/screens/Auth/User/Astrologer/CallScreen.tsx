import React, {useRef, useCallback, useEffect, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {useRoute, useNavigation, CommonActions} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import {ZEGO_APP_ID, ZEGO_APP_SIGN} from '../../../../utils/zegoConfig';
import {endSession} from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';

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
  console.log('[CallScreen] Mounted with params:', {callID, userID, userName, mode, sessionId, otherUserId});

  const userType = user?.user_type;
  const hasUserRole = Array.isArray(userType) ? userType.includes('USER') : userType === 'USER';
  const isCreator = !hasUserRole;

  // Use refs so socket handlers always access the latest values
  const isCreatorRef = useRef(isCreator);
  const navigationRef = useRef(navigation);
  const routeParamsRef = useRef(route.params);
  useEffect(() => { isCreatorRef.current = isCreator; }, [isCreator]);
  useEffect(() => { navigationRef.current = navigation; }, [navigation]);
  useEffect(() => { routeParamsRef.current = route.params; }, [route.params]);

  const forceLeaveCall = useCallback((durationMin: number) => {
    console.log('[CallScreen] forceLeaveCall called, isCreator:', isCreatorRef.current, 'duration:', durationMin);
    const nav = navigationRef.current;

    if (isCreatorRef.current) {
      Toast.show({
        type: 'info',
        text1: 'Session Ended',
        text2: `Session lasted ${durationMin} min.`,
        position: 'top',
      });
      nav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'CreatorBottomTab'}],
        }),
      );
    } else {
      const params = routeParamsRef.current || {};
      nav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {name: 'UserBottomTab'},
            {
              name: 'SessionRatingScreen',
              params: {
                sessionId,
                expertName: params.expertName || '',
                expertImage: params.expertImage || '',
                mode,
                duration: durationMin,
              },
            },
          ],
        }),
      );
    }
  }, [sessionId, mode]);

  // Listen for other side ending or declining the call — registered ONCE
  useEffect(() => {
    const handleRemoteEnd = (data: any) => {
      console.log('[CallScreen] call_ended socket event received:', data);
      console.log('[CallScreen] rawUserID:', rawUserID, 'rawCallID:', rawCallID, 'ended:', ended.current);
      if (data.endedBy === rawUserID) {
        console.log('[CallScreen] Ignoring own call_ended echo');
        return;
      }
      if (!ended.current) {
        ended.current = true;
        const durationMin = Math.ceil((Date.now() - startTime.current) / 60000);
        console.log('[CallScreen] Remote end detected, navigating away. Duration:', durationMin);
        if (sessionId) {
          dispatch(endSession({sessionId, duration: durationMin}));
        }
        forceLeaveCall(durationMin);
      }
    };

    const handleCallDeclined = (data: any) => {
      console.log('[CallScreen] call_declined socket event received:', data);
      if (!ended.current) {
        ended.current = true;
        Toast.show({
          type: 'error',
          text1: 'Call Declined',
          text2: 'The user declined your call.',
          position: 'top',
        });
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: isCreatorRef.current ? 'CreatorBottomTab' : 'UserBottomTab'}],
          }),
        );
      }
    };

    console.log('[CallScreen] Registering socket listeners for callId:', rawCallID);
    SocketService.on('call_ended', handleRemoteEnd);
    SocketService.on('call_declined', handleCallDeclined);
    return () => {
      console.log('[CallScreen] Cleaning up socket listeners');
      SocketService.off('call_ended', handleRemoteEnd);
      SocketService.off('call_declined', handleCallDeclined);
    };
  }, []); // Empty deps — registered once, uses refs for latest values

  const handleCallEnd = useCallback(() => {
    if (ended.current) return;
    ended.current = true;

    const durationMin = Math.ceil((Date.now() - startTime.current) / 60000);
    console.log('[CallScreen] Local call end. Duration:', durationMin);

    if (sessionId) {
      dispatch(endSession({sessionId, duration: durationMin}));
    }

    if (otherUserId) {
      SocketService.emit('call_ended', {
        callId: rawCallID,
        otherUserId,
        endedBy: rawUserID,
      });
    }

    forceLeaveCall(durationMin);
  }, [sessionId, dispatch, rawCallID, rawUserID, otherUserId, forceLeaveCall]);

  const zegoConfig = useMemo(() => ({
    ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
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
  }), [handleCallEnd]);

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
