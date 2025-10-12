import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../utils/colors';
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
    height: 120,
    borderRadius: 14,
    backgroundColor: '#7b2f6b22',
    marginHorizontal: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  head: { fontSize: 16, color: colors.primaryDark, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#5a2b58' },
  btn: {
    backgroundColor: '#2fc27b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
