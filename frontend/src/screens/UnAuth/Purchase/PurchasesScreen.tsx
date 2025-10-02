// PurchasesScreen.jsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CalendarClock, Video, GraduationCap, Plus } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import colors from '../../../theme/colors';

const purchases = [
  {
    id: '1',
    title: 'Master Digital Marketing',
    type: 'Course',
    date: 'Sep 20, 2025',
    status: 'Completed',
    price: 1499,
    // individual purchase records for this item (history)
    purchaseHistory: [
      { id: 'h1', date: '2025-09-20', price: 1499 },
      { id: 'h2', date: '2025-06-12', price: 999 },
    ],
  },
  {
    id: '2',
    title: 'Webinar: AI in Marketing',
    type: 'Webinar',
    date: 'Sep 28, 2025',
    status: 'Upcoming',
    price: 499,
    purchaseHistory: [
      { id: 'h3', date: '2025-09-01', price: 499 },
      { id: 'h4', date: '2025-08-15', price: 299 },
    ],
  },
  {
    id: '3',
    title: 'One-on-One Strategy Meeting',
    type: 'Meeting',
    date: 'Oct 2, 2025',
    status: 'Scheduled',
    price: 2499,
    purchaseHistory: [
      { id: 'h5', date: '2025-10-02', price: 2499 },
    ],
  },
];

const formatINR = (value) =>
  typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value;

const PurchasesScreen = () => {
  return (
    <View style={styles.container}>
      <AppHeader title="My Purchases" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {purchases.map((item) => (
          <View key={item.id} style={styles.card}>
            {/* Header: Icon + Title */}
            <View style={styles.cardHeader}>
              {item.type === 'Course' && (
                <GraduationCap size={20} color={colors.primary} />
              )}
              {item.type === 'Webinar' && <Video size={20} color={colors.primary} />}
              {item.type === 'Meeting' && (
                <CalendarClock size={20} color={colors.primary} />
              )}
              <Text style={styles.title}>{item.title}</Text>
            </View>

            {/* Meta: Type, Date, Price */}
            <View style={styles.meta}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>

            {/* Price and status row */}
            <View style={styles.priceRow}>
              <Text style={styles.purchasedFor}>Purchased for</Text>
              <Text style={styles.priceValue}>{formatINR(item.price)}</Text>
            </View>

            {/* Small purchase history list */}
            <View style={styles.historyBox}>
              <Text style={styles.historyTitle}>Purchase history</Text>
              {item.purchaseHistory && item.purchaseHistory.length > 0 ? (
                item.purchaseHistory.map((h) => (
                  <View key={h.id} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{h.date}</Text>
                    <Text style={styles.historyPrice}>{formatINR(h.price)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.historyEmpty}>No purchase history available.</Text>
              )}
            </View>

            {/* Footer: Status + Action */}
            <View style={styles.footer}>
              <Text
                style={[
                  styles.status,
                  item.status === 'Completed' && styles.completed,
                  item.status === 'Upcoming' && styles.upcoming,
                  item.status === 'Scheduled' && styles.scheduled,
                ]}
              >
                {item.status}
              </Text>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                <Text style={styles.actionText}>
                  {item.status === 'Upcoming' || item.status === 'Scheduled' ? 'Join' : 'View'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {purchases.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven’t purchased anything yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Button to Add Purchase (placeholder) */}
      {/* <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity> */}
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginLeft: 8,
  },

  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  type: {
    fontSize: 13,
    color: '#777',
  },
  date: {
    fontSize: 13,
    color: '#777',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchasedFor: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  historyBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f3f3f3',
  },
  historyDate: { color: '#666' },
  historyPrice: { fontWeight: '700', color: '#222' },
  historyEmpty: { color: '#888' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  completed: { color: 'green' },
  upcoming: { color: colors.primary },
  scheduled: { color: '#E68A00' },

  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
