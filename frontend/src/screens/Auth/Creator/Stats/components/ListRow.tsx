import React from 'react';
import { View, Text, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface ListRowProps {
  title: string;
  meta: string;
  imageUri?: string;
  avatarInitials?: string;
  icon?: React.ReactNode;
  imageType?: 'circle' | 'square';
  imageSize?: number;
  trailingType?: 'tag' | 'percentage' | 'text' | 'none';
  trailingText?: string;
  trailingSubText?: string;
  trailingTagBg?: string;
  trailingTagTextColor?: string;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ListRow: React.FC<ListRowProps> = ({
  title,
  meta,
  imageUri,
  avatarInitials,
  icon,
  imageType = 'circle',
  imageSize = 32,
  trailingType = 'none',
  trailingText,
  trailingSubText,
  trailingTagBg,
  trailingTagTextColor,
  showDivider = true,
  style,
}) => {
  const isCircle = imageType === 'circle';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {/* Leading Avatar / Thumbnail / Icon */}
        <View
          style={[
            styles.leadingContainer,
            {
              width: wp(imageSize),
              height: wp(imageSize),
              borderRadius: isCircle ? wp(imageSize) / 2 : 8,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: wp(imageSize),
                height: wp(imageSize),
                borderRadius: isCircle ? wp(imageSize) / 2 : 8,
              }}
            />
          ) : avatarInitials ? (
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          ) : icon ? (
            icon
          ) : (
            <View style={[styles.fallbackSquare, { borderRadius: isCircle ? wp(imageSize) / 2 : 8 }]} />
          )}
        </View>

        {/* Title and Meta Description */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {meta}
          </Text>
        </View>

        {/* Trailing Section */}
        {trailingType !== 'none' && (
          <View style={styles.trailingContainer}>
            {trailingType === 'tag' && trailingText && (
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: trailingTagBg || colors.goldDim || 'rgba(240, 192, 64, 0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: trailingTagTextColor || colors.gold || '#F0C040',
                    },
                  ]}
                >
                  {trailingText}
                </Text>
              </View>
            )}

            {trailingType === 'percentage' && trailingText && (
              <View style={styles.percentageColumn}>
                <Text style={styles.percentageText}>{trailingText}</Text>
                {trailingSubText && <Text style={styles.subText}>{trailingSubText}</Text>}
              </View>
            )}

            {trailingType === 'text' && trailingText && (
              <View style={styles.textColumn}>
                <Text style={styles.valueText}>{trailingText}</Text>
                {trailingSubText && <Text style={styles.subText}>{trailingSubText}</Text>}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Optional row divider */}
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

export default ListRow;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
  },
  leadingContainer: {
    backgroundColor: colors.inputBg || '#242426',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    color: colors.white || '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '700',
  },
  fallbackSquare: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(2),
  },
  metaText: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
  },
  trailingContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: wp(8),
  },
  tag: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  percentageColumn: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.gold || '#F0C040',
  },
  textColumn: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: fp(12),
    fontWeight: '500',
    color: colors.white || '#FFFFFF',
  },
  subText: {
    fontSize: fp(9),
    color: colors.textMuted || '#555558',
    marginTop: hp(2),
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
});
