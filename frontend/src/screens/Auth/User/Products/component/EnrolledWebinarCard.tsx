import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { Calendar, Clock, User, Video } from 'lucide-react-native';
import moment from 'moment-timezone';
import { useNavigation } from '@react-navigation/native';
import { IndianRupee } from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const EnrolledWebinarCard = ({ item }) => {
  const webinar = item;
  const navigation = useNavigation<any>();

  const price =
    webinar?.price === 0 || webinar?.price === '0'
      ? 'Free'
      : `₹${webinar?.price}`;

  return (
    <View style={styles.cardContainer}>
      <Image
        source={{ uri: webinar?.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.contentBox}>
        <Text style={styles.title}>{webinar?.title}</Text>

        <Text style={styles.description} numberOfLines={2}>
          {webinar?.description}
        </Text>

        <View style={styles.row}>
          <Calendar size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {moment(webinar?.scheduled_at)
              .tz(webinar?.timezone)
              .format('DD MMM YYYY')}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {moment(webinar?.scheduled_at)
              .tz(webinar?.timezone)
              .format('hh:mm A')}{' '}
            (Local Time)
          </Text>
        </View>

        <View style={styles.row}>
          <User size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.infoText}>{webinar?.creator?.name}</Text>
        </View>

        {/* PRICE SECTION */}
        <View style={styles.row}>
          <IndianRupee size={wp(18)} color={colors.textSecondary} />
          <Text
            style={[styles.infoText, { fontWeight: '700', color: colors.text }]}
          >
            {price}
          </Text>
        </View>

        {/* {webinar?.is_enrolled && ( */}
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() =>
              navigation.navigate('WebinarDetails', { data: item })
            }
          >
            <Video size={wp(20)} color="#fff" />
            <Text style={styles.joinText}>Join Webinar</Text>
          </TouchableOpacity>
        {/* )} */}
      </View>
    </View>
  );
};

export default EnrolledWebinarCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    marginBottom: hp(15),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#0009',
    borderWidth: 0.1,
  },
  thumbnail: {
    width: '100%',
    height: hp(160),
    backgroundColor: colors.muted,
  },
  contentBox: {
    padding: wp(12),
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginVertical: hp(5),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    gap: wp(6),
  },
  infoText: {
    fontSize: fp(13),
    color: colors.textSecondary,
  },
  joinBtn: {
    marginTop: hp(12),
    backgroundColor: colors.secPrimary,
    paddingVertical: hp(10),
    borderRadius: wp(10),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(8),
  },
  joinText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fp(15),
  },
});
