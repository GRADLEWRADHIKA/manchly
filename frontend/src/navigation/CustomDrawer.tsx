import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import colors from '../theme/colors';
import {
  MessageCircle,
  ShoppingCart,
  ShoppingBag,
  Settings as SettingsIcon,
  X,
} from 'lucide-react-native';

const items = [
  { name: 'Chats', label: 'Chats', Icon: MessageCircle },
  { name: 'MyProducts', label: 'My Products', Icon: ShoppingCart },
  { name: 'MyPurchases', label: 'My Purchases', Icon: ShoppingBag },
  { name: 'Settings', label: 'Settings', Icon: SettingsIcon },
];

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const goTo = (tabName: string) => {
    navigation.navigate('Main', { screen: tabName });
    navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity onPress={() => navigation.closeDrawer()}>
          <X size={22} color={colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        {items.map(({ name, label, Icon }) => (
          <TouchableOpacity
            key={name}
            style={styles.menuItem}
            onPress={() => goTo(name)}
          >
            <View style={styles.left}>
              <Icon size={22} color={colors.primary} />
              <Text style={styles.itemText}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderColor,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.black },
  menu: { paddingVertical: 8 },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderColor,
  },
  left: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  itemText: { fontSize: 16, color: colors.black, fontWeight: '600' },
});
