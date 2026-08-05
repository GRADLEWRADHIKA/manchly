import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Infinity as InfinityIcon, Clock, CalendarClock } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

export type AccessPolicy = {
  access_duration_days: number | null;
  access_expires_at: string | null;
};

type Mode = 'none' | 'days' | 'date';

type Props = {
  initialDurationDays?: number | null;
  initialExpiresAt?: string | null;
  onChange: (policy: AccessPolicy) => void;
};

const OPTIONS: { key: Mode; label: string; Icon: any }[] = [
  { key: 'none', label: 'No expiry', Icon: InfinityIcon },
  { key: 'days', label: 'Duration', Icon: Clock },
  { key: 'date', label: 'Fixed date', Icon: CalendarClock },
];

const AccessExpiryField: React.FC<Props> = ({
  initialDurationDays,
  initialExpiresAt,
  onChange,
}) => {
  const initialMode: Mode = initialDurationDays
    ? 'days'
    : initialExpiresAt
    ? 'date'
    : 'none';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [daysText, setDaysText] = useState(
    initialDurationDays ? String(initialDurationDays) : '',
  );
  const [date, setDate] = useState<Date | null>(
    initialExpiresAt ? new Date(initialExpiresAt) : null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);

  const emit = (nextMode: Mode, nextDays: string, nextDate: Date | null) => {
    if (nextMode === 'days') {
      const n = parseInt(nextDays, 10);
      onChange({
        access_duration_days: Number.isFinite(n) && n > 0 ? n : null,
        access_expires_at: null,
      });
    } else if (nextMode === 'date') {
      onChange({
        access_duration_days: null,
        access_expires_at: nextDate ? nextDate.toISOString() : null,
      });
    } else {
      onChange({ access_duration_days: null, access_expires_at: null });
    }
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    emit(m, daysText, date);
  };

  const onDaysChange = (t: string) => {
    const clean = t.replace(/[^0-9]/g, '');
    setDaysText(clean);
    emit('days', clean, date);
  };

  const onDatePicked = (picked: Date) => {
    setPickerVisible(false);
    setDate(picked);
    emit('date', daysText, picked);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Access expiry</Text>
      <Text style={styles.help}>
        Choose how long buyers keep access after they get this product.
      </Text>

      <View style={styles.segment}>
        {OPTIONS.map(({ key, label, Icon }) => {
          const active = mode === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segItem, active && styles.segItemActive]}
              onPress={() => selectMode(key)}
              activeOpacity={0.85}>
              <Icon
                size={wp(15)}
                color={active ? colors.cBg : colors.textMuted}
                strokeWidth={2}
              />
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'days' && (
        <View style={styles.daysRow}>
          <TextInput
            style={styles.daysInput}
            placeholder="30"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={daysText}
            onChangeText={onDaysChange}
            maxLength={5}
          />
          <Text style={styles.daysSuffix}>days from purchase</Text>
        </View>
      )}

      {mode === 'date' && (
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.85}>
          <CalendarClock size={wp(16)} color={colors.gold} />
          <Text style={styles.dateBtnText}>
            {date ? `Access ends ${formatDate(date)}` : 'Pick an expiry date'}
          </Text>
        </TouchableOpacity>
      )}

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="date"
        minimumDate={new Date()}
        date={date || new Date()}
        onConfirm={onDatePicked}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
};

export default AccessExpiryField;

const styles = StyleSheet.create({
  wrap: {
    marginTop: hp(6),
  },
  label: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(4),
  },
  help: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginBottom: hp(10),
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cBg,
    borderRadius: wp(12),
    padding: wp(4),
    gap: wp(4),
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(5),
    paddingVertical: hp(9),
    borderRadius: wp(9),
  },
  segItemActive: {
    backgroundColor: colors.gold,
  },
  segText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.textMuted,
  },
  segTextActive: {
    color: colors.cBg,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginTop: hp(12),
  },
  daysInput: {
    width: wp(80),
    backgroundColor: colors.cBg,
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    fontSize: fp(15),
    color: colors.white,
    textAlign: 'center',
  },
  daysSuffix: {
    fontSize: fp(13),
    color: colors.textSecondary,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(12),
    backgroundColor: colors.cBg,
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
  },
  dateBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
  },
});
