import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import { useRoute } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { Calendar, Clock, User, Tag, ImageOff } from 'lucide-react-native';

const WebinarDetails = () => {
  const { params } = useRoute();
  const data = params?.data;

  const hasThumbnail = !!data?.thumbnail_url;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Webinar Details" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.thumbnailWrapper}>
          {hasThumbnail ? (
            <Image
              source={{ uri: data.thumbnail_url }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ImageOff size={60} color={colors.textSecondary} />
              <Text style={styles.noImageText}>No Thumbnail Available</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{data?.title}</Text>

        <View style={styles.row}>
          <User size={18} color={colors.textSecondary} />
          <Text style={styles.host}>
            Hosted by {data?.creator?.name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={18} color={colors.textSecondary} />
          <Text style={styles.detailText}>{data?.duration} mins</Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Tag size={14} color={colors.white} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.price}>₹ {data?.price}</Text>
          <Text style={styles.participants}>
            Max Participants: {data?.max_participants}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>About Webinar</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.buyButton} onPress={()=>{
            console.log('--paynow--')
        }}>
          <Text style={styles.buyText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WebinarDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  thumbnailWrapper: {
    width: '100%',
    height: 220,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 15,
    paddingHorizontal: 15,
    color: colors.text,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 15,
    gap: 6,
  },
  host: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    paddingHorizontal: 15,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secPrimary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
  },

  priceBox: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
  },
  participants: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 25,
    paddingHorizontal: 15,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    paddingHorizontal: 15,
    lineHeight: 20,
    paddingBottom: 40,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: colors.secPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
