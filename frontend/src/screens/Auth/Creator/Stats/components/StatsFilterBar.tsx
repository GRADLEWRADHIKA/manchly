import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, ChevronDown, Download } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface StatsFilterBarProps {
  onFilterPress?: () => void;
  onExportPress?: () => void;
  filterLabel?: string;
}

const StatsFilterBar: React.FC<StatsFilterBarProps> = ({
  onFilterPress,
  onExportPress,
  filterLabel = 'Last 30 Days',
}) => {
  return (
    <View style={styles.container}>
      {/* Left Filter Pill */}
      <TouchableOpacity
        style={styles.filterPill}
        onPress={onFilterPress}
        activeOpacity={0.8}
      >
        <Calendar size={14} color={colors.white} style={styles.leftIcon} />
        <Text style={styles.filterText}>{filterLabel}</Text>
        <ChevronDown size={14} color={colors.textSecondary} style={styles.rightIcon} />
      </TouchableOpacity>

      {/* Right Export Pill */}
      <TouchableOpacity
        style={styles.exportPill}
        onPress={onExportPress}
        activeOpacity={0.8}
      >
        <Download size={14} color="#000000" style={styles.leftIcon} />
        <Text style={styles.exportText}>Export</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StatsFilterBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(8),
    marginBottom: hp(12),
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface || '#1C1C1E',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    borderRadius: 20,
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
  },
  exportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold || '#F0C040',
    borderRadius: 20,
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
  },
  leftIcon: {
    marginRight: wp(6),
  },
  rightIcon: {
    marginLeft: wp(6),
  },
  filterText: {
    color: colors.white || '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '500',
  },
  exportText: {
    color: '#000000',
    fontSize: fp(12),
    fontWeight: '700',
  },
});
