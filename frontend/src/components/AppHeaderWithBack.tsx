import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import { useSelector } from 'react-redux';

const AppHeaderWithBack = ({ title }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useSelector((state: any) => state.userReducer);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + hp(10),
          backgroundColor:
            user?.user_type === 'USER' ? colors.secPrimary : colors.primary,
        },
      ]}
    >
      <View style={styles.mainHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color="#fff" size={wp(24)} />
        </TouchableOpacity>

        <Text style={styles.title}>
          {title ? title.charAt(0).toUpperCase() + title.slice(1) : ''}
        </Text>
      </View>
    </View>
  );
};

export default AppHeaderWithBack;

const styles = StyleSheet.create({
  container: {
    // backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp(14),
  },
  backButton: {
    position: 'absolute',
    left: wp(16),
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  title: {
    color: '#fff',
    fontSize: fp(18),
    fontWeight: '700',
  },
  mainHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
