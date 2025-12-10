import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { Calendar, Clock, User, Video } from 'lucide-react-native';
import moment from 'moment-timezone';

const PurchaseWebinarCard = ({ item }) => {
  const webinar = item?.webinar;

  return (
    <View style={styles.card}>
      {webinar?.thumbnail_url && (
        <Image
          source={{ uri: webinar.thumbnail_url }}
          style={styles.thumbnail}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{webinar?.title}</Text>

        <View style={styles.tagContainer}>
          {webinar?.tags?.map((t, index) => (
            <Text key={index} style={styles.tag}>
              #{t}
            </Text>
          ))}
        </View>

        <View style={styles.row}>
          <User size={18} color={colors.textSecondary} />
          <Text style={styles.creatorName}>{webinar?.creator?.name}</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color={colors.secPrimary} />
          <Text style={styles.infoText}>
            {moment(webinar?.scheduled_at).format('DD MMM YYYY')}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={18} color={colors.secPrimary} />
          <Text style={styles.infoText}>{webinar?.duration} mins</Text>
        </View>

        <Text style={styles.price}>₹{webinar?.price}</Text>

        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => {
            const meetingId = webinar?.zoom_meeting_id;
            const password = webinar?.zoom_password;

            if (meetingId && password) {
              const zoomURL = `zoomus://zoom.us/join?confno=${meetingId}&pwd=${password}`;

              Linking.openURL(zoomURL).catch(() => {
                if (webinar?.zoom_join_url) {
                  Linking.openURL(webinar.zoom_join_url);
                }
              });
            } else {
              console.log('Meeting ID or password missing');
            }
          }}
        >
          <Video size={18} color={colors.white} />
          <Text style={styles.joinText}>Join Webinar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PurchaseWebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginVertical: 12,
    overflow: 'hidden',
    elevation: 3,
    borderWidth: 0.1,
    borderColor: colors.borderColor,
    marginHorizontal: 10,
  },

  thumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: colors.lightGrey,
  },

  content: {
    padding: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },

  tagContainer: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },

  tag: {
    backgroundColor: colors.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    fontSize: 12,
    color: colors.secPrimary,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  creatorName: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },

  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    color: colors.accent,
  },

  joinBtn: {
    marginTop: 14,
    backgroundColor: colors.secPrimary,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  joinText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
});
