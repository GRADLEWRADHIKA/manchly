import React, {useEffect, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {Phone, PhoneOff, Video} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {acceptSession} from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';

const IncomingCallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const {user} = useSelector((state: any) => state.userReducer);

  const {callID, callerName, mode, sessionId, callerId} = route.params || {};

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleAccept = () => {
    if (sessionId) {
      dispatch(acceptSession(sessionId));
    }
    // Notify expert that call was accepted
    SocketService.emit('call_accepted', {
      callId: callID,
      callerId: callerId,
    });

    navigation.replace('CallScreen', {
      callID,
      userID: user?.id,
      userName: user?.name || 'User',
      mode,
      sessionId,
      otherUserId: callerId,
    });
  };

  const handleDecline = () => {
    SocketService.emit('call_declined', {
      callId: callID,
      callerId: callerId,
    });
    navigation.goBack();
  };

  const isVideo = mode === 'video';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.incomingLabel}>
          Incoming {isVideo ? 'Video' : 'Audio'} Call
        </Text>

        <Animated.View
          style={[styles.avatarRing, {transform: [{scale: pulseAnim}]}]}>
          <View style={styles.avatarOuter} />
        </Animated.View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(callerName || 'U')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>

        <Text style={styles.callerName}>{callerName || 'User'}</Text>
        <Text style={styles.callType}>
          {isVideo ? 'Video Call' : 'Audio Call'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineBtn}
          activeOpacity={0.8}
          onPress={handleDecline}>
          <PhoneOff size={wp(28)} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.acceptBtn,
            isVideo
              ? {backgroundColor: colors.success}
              : {backgroundColor: colors.info},
          ]}
          activeOpacity={0.8}
          onPress={handleAccept}>
          {isVideo ? (
            <Video size={wp(28)} color={colors.white} strokeWidth={2} />
          ) : (
            <Phone size={wp(28)} color={colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(IncomingCallScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  incomingLabel: {
    fontSize: fp(14),
    color: colors.white + '80',
    fontWeight: '500',
    marginBottom: hp(30),
  },
  avatarRing: {
    position: 'absolute',
    width: wp(130),
    height: wp(130),
    borderRadius: wp(65),
    borderWidth: 2,
    borderColor: colors.info + '30',
  },
  avatarOuter: {
    flex: 1,
  },
  avatar: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.secPrimary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  avatarText: {
    fontSize: fp(32),
    fontWeight: '700',
    color: colors.white,
  },
  callerName: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.white,
  },
  callType: {
    fontSize: fp(14),
    color: colors.white + '70',
    marginTop: hp(6),
  },
  actions: {
    flexDirection: 'row',
    gap: wp(50),
    paddingBottom: hp(60),
  },
  declineBtn: {
    width: wp(70),
    height: wp(70),
    borderRadius: wp(35),
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptBtn: {
    width: wp(70),
    height: wp(70),
    borderRadius: wp(35),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
