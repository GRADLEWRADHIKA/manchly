import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import colors from '../../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../../utils/responsive';

type DateRange = { from: Date | null; to: Date | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (from: Date, to: Date) => void;
  onClear?: () => void;
  initialRange?: DateRange;
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const startOfDay = (d: Date) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const isSameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.toDateString() === b.toDateString();

const isBetween = (d: Date, from: Date, to: Date) =>
  d.getTime() > from.getTime() && d.getTime() < to.getTime();

// Returns a flat array of Date|null for a month grid (null = padding cell)
const getMonthGrid = (viewDate: Date): (Date | null)[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0 = Sunday

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // pad to complete final week
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const formatFooterDate = (d: Date) =>
  `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;

const PRESETS = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Last Month',
  'Custom range',
] as const;

const DateRangeFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  onApply,
  onClear,
  initialRange,
}) => {
  const today = startOfDay(new Date());

  const [activePreset, setActivePreset] = useState<string>('Custom range');
  const [rangeStart, setRangeStart] = useState<Date | null>(
    initialRange?.from ?? null,
  );
  const [rangeEnd, setRangeEnd] = useState<Date | null>(
    initialRange?.to ?? null,
  );
  const [viewMonth, setViewMonth] = useState<Date>(initialRange?.from ?? today);

  useEffect(() => {
    if (visible) {
      setRangeStart(initialRange?.from ?? null);
      setRangeEnd(initialRange?.to ?? null);
      setViewMonth(initialRange?.from ?? today);
      setActivePreset(
        initialRange?.from && initialRange?.to
          ? 'Custom range'
          : 'Custom range',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const goToMonth = (offset: number) => {
    setViewMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const applyPreset = (key: string) => {
    setActivePreset(key);
    let from: Date | null = null;
    let to: Date | null = null;

    switch (key) {
      case 'Today':
        from = today;
        to = today;
        break;
      case 'Yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        from = y;
        to = y;
        break;
      }
      case 'Last 7 Days': {
        const s = new Date(today);
        s.setDate(s.getDate() - 6);
        from = s;
        to = today;
        break;
      }
      case 'Last 30 Days': {
        const s = new Date(today);
        s.setDate(s.getDate() - 29);
        from = s;
        to = today;
        break;
      }
      case 'This Month': {
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = today;
        break;
      }
      case 'Last Month': {
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        from = lastMonth;
        to = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        break;
      }
      case 'Custom range':
      default:
        // Let the user pick manually on the calendar; don't set a range yet.
        return;
    }

    setRangeStart(from);
    setRangeEnd(to);
    if (from) setViewMonth(from);
  };

  const handleDayPress = (day: Date) => {
    setActivePreset('Custom range');
    if (!rangeStart || (rangeStart && rangeEnd)) {
      // start a fresh selection
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }
    // rangeStart set, rangeEnd not yet set
    if (day.getTime() < rangeStart.getTime()) {
      setRangeStart(day);
      setRangeEnd(null);
    } else {
      setRangeEnd(day);
    }
  };

  const handleClear = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setActivePreset('Custom range');
    onClear?.();
    onClose();
  };

  const handleApply = () => {
    if (rangeStart && rangeEnd) {
      onApply(rangeStart, rangeEnd);
    } else if (rangeStart && !rangeEnd) {
      // single day selected — treat as a one-day range
      onApply(rangeStart, rangeStart);
    }
  };

  const grid = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);

  const renderDay = (day: Date | null, idx: number) => {
    if (!day) return <View key={idx} style={styles.dayCell} />;

    const isStart = isSameDay(day, rangeStart);
    const isEnd = isSameDay(day, rangeEnd);
    const inRange =
      rangeStart && rangeEnd ? isBetween(day, rangeStart, rangeEnd) : false;
    const isEdge = isStart || isEnd;

    return (
      <TouchableOpacity
        key={idx}
        style={[
          styles.dayCell,
          inRange && styles.dayCellInRange,
          isEdge && styles.dayCellEdge,
        ]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <View style={[styles.dayCircle, isEdge && styles.dayCircleEdge]}>
          <Text style={[styles.dayText, isEdge && styles.dayTextEdge]}>
            {day.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetRow}
          >
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetChip,
                  activePreset === p && styles.presetChipActive,
                ]}
                onPress={() => applyPreset(p)}
              >
                <Text
                  style={[
                    styles.presetText,
                    activePreset === p && styles.presetTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Month header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => goToMonth(-1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={wp(20)} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => goToMonth(1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={wp(20)} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={styles.weekLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {grid.map((day, idx) => renderDay(day, idx))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerRangeText} numberOfLines={1}>
              {rangeStart && rangeEnd
                ? `${formatFooterDate(rangeStart)} – ${formatFooterDate(
                    rangeEnd,
                  )}`
                : rangeStart
                ? `${formatFooterDate(rangeStart)} – Select end date`
                : 'Select a date range'}
            </Text>
            <View style={styles.footerButtons}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  !rangeStart && styles.applyBtnDisabled,
                ]}
                onPress={handleApply}
                disabled={!rangeStart}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.closeRow} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DateRangeFilterModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: wp(20),
    borderTopRightRadius: wp(20),
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(24),
  },
  presetRow: {
    gap: wp(8),
    paddingBottom: hp(12),
  },
  presetChip: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: '#1C1B1B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderColor: colors.gold,
  },
  presetText: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.gold,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(10),
  },
  monthTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: fp(11),
    color: colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleEdge: {
    backgroundColor: colors.gold,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(240,192,64,0.10)',
  },
  dayCellEdge: {
    backgroundColor: colors.gold,
    borderRadius: wp(999),
  },
  dayText: {
    fontSize: fp(13),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dayTextEdge: {
    color: '#000',
    fontWeight: '700',
  },
  footer: {
    marginTop: hp(14),
  },
  footerRangeText: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  footerButtons: {
    flexDirection: 'row',
    gap: wp(10),
  },
  clearBtn: {
    flex: 1,
    paddingVertical: hp(12),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1B1B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  clearBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: fp(13),
  },
  applyBtn: {
    flex: 1,
    paddingVertical: hp(12),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: fp(13),
  },
  closeRow: {
    alignItems: 'center',
    marginTop: hp(10),
  },
  closeText: {
    color: colors.textMuted,
    fontSize: fp(12.5),
    fontWeight: '600',
  },
});
