import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import ZegoUIKitPrebuiltCall, {
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import {ZEGO_APP_ID, ZEGO_APP_SIGN} from '../../../../utils/zegoConfig';

const CallScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const {callID, userID, userName, mode} = route.params || {};

  const isVideoCall = mode === 'video';
  const config = isVideoCall
    ? ONE_ON_ONE_VIDEO_CALL_CONFIG
    : ONE_ON_ONE_VOICE_CALL_CONFIG;

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
          onCallEnd: () => {
            navigation.goBack();
          },
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
