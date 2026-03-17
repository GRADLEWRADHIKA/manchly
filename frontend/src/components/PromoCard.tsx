import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
export default function PromoCard() {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.head}>Launch paid</Text>
        <Text style={styles.title}>Zoom Webinar</Text>
      </View>
      <TouchableOpacity style={styles.btn}>
        <Text style={styles.btnText}>LAUNCH NOW</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    height: hp(120),
    borderRadius: wp(14),
    backgroundColor: '#7b2f6b22',
    marginHorizontal: wp(16),
    padding: wp(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  head: { fontSize: fp(16), color: colors.primaryDark, marginBottom: hp(4) },
  title: { fontSize: fp(22), fontWeight: '700', color: '#5a2b58' },
  btn: {
    backgroundColor: '#2fc27b',
    paddingVertical: hp(8),
    paddingHorizontal: wp(14),
    borderRadius: wp(18),
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
