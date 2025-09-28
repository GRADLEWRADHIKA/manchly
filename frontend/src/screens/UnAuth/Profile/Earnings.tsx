import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {
  Wallet,
  List,
  LayoutGrid,
  History,
  CreditCard,
} from 'lucide-react-native';
import colors from '../../../theme/colors';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';

const Earnings = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Earnings" />
      <View style={{ padding: 16 }}>
        {/* Withdrawable Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Wallet size={20} color={colors.black} />
            <Text style={styles.balanceTitle}>Withdrawable Balance</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Details */}
        <View style={styles.bankSection}>
          <Text style={styles.sectionTitle}>Your Bank accounts</Text>
          <Text style={styles.sectionSubtitle}>
            Add account details to withdraw your earnings instantly!
          </Text>

          {/* Empty state icon instead of image */}
          <View style={styles.bankIconWrapper}>
            <CreditCard size={60} color={colors.primary} />
          </View>

          <Text style={styles.noDetails}>No details added</Text>

          <TouchableOpacity style={styles.addBankButton}>
            <Text style={styles.addBankText}>ADD BANK DETAILS</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer}>
          <MenuItem
            title="Earnings"
            icon={<List size={20} color={colors.black} />}
          />
          <MenuItem
            title="Expenditures"
            icon={<List size={20} color={colors.black} />}
          />
          <MenuItem
            title="Affiliate Dashboard"
            icon={<LayoutGrid size={20} color={colors.black} />}
          />
          <MenuItem
            title="Gap Up Affiliate"
            icon={<LayoutGrid size={20} color={colors.black} />}
          />
          <MenuItem
            title="Withdrawal history"
            icon={<History size={20} color={colors.black} />}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const MenuItem = ({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) => {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuLeft}>
        {icon}
        <Text style={styles.menuText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Earnings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  balanceCard: {
    backgroundColor: '#f2e7fc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  withdrawButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  withdrawText: {
    color: colors.white,
    fontWeight: '600',
  },
  bankSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  bankImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  noDetails: {
    color: '#666',
    marginBottom: 12,
  },
  addBankButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addBankText: {
    color: colors.primary,
    fontWeight: '600',
  },
  menuContainer: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  bankIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
});
