import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { Play, UserPen, Clock, Plus } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import colors from '../../theme/colors';

const PurchasesScreen = () => {
  
  return (
    <View style={styles.container}>
      <AppHeader title="RIGI" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Course Card */}
        <View style={styles.card}>
          <View style={styles.hero}>
            <Play size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>Master Digital Marketing</Text>
          <Text style={styles.subtitle}>Learn from industry experts</Text>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <UserPen size={16} color="#555" />
              <Text style={styles.rowText}>2.5K students</Text>
            </View>
            <View style={styles.rowItem}>
              <Clock size={16} color="#555" />
              <Text style={styles.rowText}>4.5 hours</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cta}>
            <Text style={styles.ctaText}>Start Learning</Text>
          </TouchableOpacity>
        </View>

        {/* Courses Section */}
        <Text style={styles.sectionTitle}>Courses</Text>

        <View style={styles.lessonsRow}>
          <View style={styles.lessonColLeft}>
            <Text style={styles.lessonTitle}>Lesson 1</Text>
            <Text style={styles.lessonSubtitle}>Short course preview</Text>
          </View>
          <View style={styles.lessonColRight}>
            <Text style={styles.lessonTitle}>Lesson 2</Text>
            <Text style={styles.lessonSubtitle}>Short course preview</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default PurchasesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  hero: {
    backgroundColor: '#eaeaea',
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111',
  },
  subtitle: {
    color: '#555',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rowText: {
    marginLeft: 4,
    color: '#555',
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  lessonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonColLeft: {
    flex: 1,
    marginRight: 8,
  },
  lessonColRight: {
    flex: 1,
    marginLeft: 8,
  },
  lessonTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#222',
  },
  lessonSubtitle: {
    color: '#777',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
