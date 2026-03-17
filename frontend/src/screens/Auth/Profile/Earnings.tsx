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
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';

const Earnings = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Earnings" />
      <View style={{ padding: wp(16) }}>
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
    borderRadius: wp(12),
    padding: wp(16),
    marginBottom: hp(16),
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  balanceTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    marginLeft: wp(8),
  },
  withdrawButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: hp(6),
    paddingHorizontal: wp(16),
    borderRadius: wp(8),
  },
  withdrawText: {
    color: colors.white,
    fontWeight: '600',
  },
  bankSection: {
    alignItems: 'center',
    marginBottom: hp(16),
  },
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  sectionSubtitle: {
    fontSize: fp(13),
    color: '#666',
    marginBottom: hp(16),
    textAlign: 'center',
  },
  bankImage: {
    width: wp(120),
    height: hp(120),
    marginBottom: hp(8),
  },
  noDetails: {
    color: '#666',
    marginBottom: hp(12),
  },
  addBankButton: {
    borderWidth: wp(1),
    borderColor: colors.primary,
    borderRadius: wp(8),
    paddingVertical: hp(8),
    paddingHorizontal: wp(16),
  },
  addBankText: {
    color: colors.primary,
    fontWeight: '600',
  },
  menuContainer: {
    marginTop: hp(10),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
    borderBottomWidth: wp(1),
    borderBottomColor: '#eee',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: wp(12),
    fontSize: fp(15),
    fontWeight: '500',
  },
  bankIconWrapper: {
    width: wp(100),
    height: hp(100),
    borderRadius: wp(50),
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
});
