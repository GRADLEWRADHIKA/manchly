import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {Infinity as InfinityIcon, Clock, CheckCircle} from 'lucide-react-native';
import {Dropdown} from 'react-native-element-dropdown';
import colors from '../utils/colors';
import {wp, hp, fp} from '../utils/responsive';

export type AccessPolicy = {
  access_duration_days: number | null;
  access_duration_unit: string | null;
  access_expires_at: string | null;
};

type Mode = 'lifetime' | 'limited';

type Props = {
  initialDurationDays?: number | null;
  initialDurationUnit?: string | null;
  initialExpiresAt?: string | null;
  onChange: (policy: AccessPolicy) => void;
};

const GOLD = '#F0C040';

const UNIT_DATA = [
  {label: 'Days', value: 'days'},
  {label: 'Months', value: 'months'},
];

const AccessExpiryField: React.FC<Props> = ({
  initialDurationDays,
  initialDurationUnit,
  onChange,
}) => {
  const initialMode: Mode = initialDurationDays ? 'limited' : 'lifetime';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [durationValue, setDurationValue] = useState(
    initialDurationDays ? String(initialDurationDays) : '1',
  );
  const [durationUnit, setDurationUnit] = useState(
    initialDurationUnit || 'days',
  );

  const emit = (nextMode: Mode, nextValue: string, nextUnit: string) => {
    if (nextMode === 'limited') {
      const n = parseInt(nextValue, 10);
      const valid = Number.isFinite(n) && n > 0;
      onChange({
        access_duration_days: valid ? n : null,
        access_duration_unit: valid ? nextUnit : null,
        access_expires_at: null,
      });
    } else {
      onChange({
        access_duration_days: null,
        access_duration_unit: null,
        access_expires_at: null,
      });
    }
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    emit(m, durationValue, durationUnit);
  };

  const onValueChange = (t: string) => {
    const clean = t.replace(/[^0-9]/g, '');
    setDurationValue(clean);
    emit('limited', clean, durationUnit);
  };

  const onUnitChange = (u: string) => {
    setDurationUnit(u);
    emit('limited', durationValue, u);
  };

  const durationSummary = () => {
    const n = parseInt(durationValue, 10);
    if (!Number.isFinite(n) || n <= 0) return '';
    const unitLabel = durationUnit === 'months' ? 'Month' : 'Day';
    return `Access to this course will be removed ${n} ${unitLabel}${n > 1 ? 's' : ''} from the date of purchase.`;
  };

  return (
    <View style={styles.wrap}>
      
      {/* Cards Row */}
      <View style={styles.cardsRow}>
        {/* Lifetime */}
        <TouchableOpacity
          style={[styles.card, mode === 'lifetime' && styles.cardActive]}
          onPress={() => selectMode('lifetime')}
          activeOpacity={0.85}>
          <View style={styles.cardTop}>
            <InfinityIcon
              size={wp(18)}
              color={mode === 'lifetime' ? GOLD : 'rgba(255,255,255,0.4)'}
            />
            {mode === 'lifetime' && (
              <CheckCircle size={wp(18)} color={GOLD} fill="#1A1A1A" />
            )}
          </View>
          <Text
            style={[
              styles.cardLabel,
              mode === 'lifetime' && styles.cardLabelActive,
            ]}>
            Lifetime Access
          </Text>
          <Text style={styles.cardDesc}>
            Student will have access forever
          </Text>
        </TouchableOpacity>

        {/* Limited */}
        <TouchableOpacity
          style={[styles.card, mode === 'limited' && styles.cardActive]}
          onPress={() => selectMode('limited')}
          activeOpacity={0.85}>
          <View style={styles.cardTop}>
            <Clock
              size={wp(18)}
              color={mode === 'limited' ? GOLD : 'rgba(255,255,255,0.4)'}
            />
            {mode === 'limited' && (
              <CheckCircle size={wp(18)} color={GOLD} fill="#1A1A1A" />
            )}
          </View>
          <Text
            style={[
              styles.cardLabel,
              mode === 'limited' && styles.cardLabelActive,
            ]}>
            Limited Access
          </Text>
          <Text style={styles.cardDesc}>
            Access will be removed after a set time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Duration Picker */}
      {mode === 'limited' && (
        <View style={styles.durationSection}>
          <Text style={styles.durationLabel}>SELECTION DURATION</Text>
          <View style={styles.durationRow}>
            <TextInput
              style={styles.durationInput}
              placeholder="1"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              value={durationValue}
              onChangeText={onValueChange}
              maxLength={5}
            />
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownText}
              selectedTextStyle={styles.dropdownText}
              containerStyle={styles.dropdownContainer}
              itemTextStyle={styles.dropdownItemText}
              activeColor="rgba(240,192,64,0.15)"
              data={UNIT_DATA}
              labelField="label"
              valueField="value"
              value={durationUnit}
              onChange={item => onUnitChange(item.value)}
            />
          </View>
          {durationValue && parseInt(durationValue, 10) > 0 && (
            <Text style={styles.durationSummary}>{durationSummary()}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default AccessExpiryField;

const styles = StyleSheet.create({
  wrap: {
    marginTop: hp(16),
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp(12),
  },

  // Cards
  cardsRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  card: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(240,192,64,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  cardLabel: {
    fontSize: fp(13),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: hp(4),
  },
  cardLabelActive: {
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.4)',
    lineHeight: fp(15),
  },

  // Duration
  durationSection: {
    marginTop: hp(16),
  },
  durationLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    letterSpacing: 0.5,
    color: GOLD,
    marginBottom: hp(8),
  },
  durationRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  durationInput: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
    fontSize: fp(15),
    color: '#FFFFFF',
  },
  dropdown: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: wp(14),
    height: hp(48),
  },
  dropdownText: {
    fontSize: fp(14),
    color: '#FFFFFF',
  },
  dropdownContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dropdownItemText: {
    fontSize: fp(14),
    color: '#FFFFFF',
  },
  durationSummary: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(8),
    lineHeight: fp(16),
  },
});
