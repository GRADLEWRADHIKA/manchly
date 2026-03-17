import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { EllipsisVertical } from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import DynamicModal from '../../../../../components/CommonModal';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteWebinar } from '../../../../../store/WebinarSlice';
import { useNavigation } from '@react-navigation/native';

interface WebinarData {
  id: string;
  title: string;
  thumbnail_url?: string;
  tags?: string[];
  creator?: {
    name?: string;
    profile_image?: string;
  };
  name?: string;
  profile_image?: string;
  price: number;
  scheduled_at: string | Date;
}

interface WebinarCardProps {
  data: WebinarData;
}

const WebinarCard: React.FC<WebinarCardProps> = ({
  data,
  setRefreshWebinar,
}) => {
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [webinarId, setWebinarId] = useState<string>();
  const Nav = useNavigation();

  const handleMenuOpen = (id: string) => {
    setMenuVisible(id);
  };

  const handleMenuClose = () => {
    setMenuVisible(null);
  };

  // close the modal ------------
  const handleCancel = () => {
    setShowModal(false);
  };

  // delete the webinar ----------
  const handleDelete = () => {
    setDeleteLoader(true);
    dispatch(deleteWebinar(webinarId))
      .unwrap()
      .then(() => {
        setRefreshWebinar(true);
        setDeleteLoader(false);
        setShowModal(false);
      })
      .catch(() => setDeleteLoader(false));
  };

  console.log(data);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          const meetingId = data?.zoom_meeting_id;
          const password = data?.zoom_password;

          if (meetingId && password) {
            const zoomURL = `zoomus://zoom.us/join?confno=${meetingId}&pwd=${password}`;

            Linking.openURL(zoomURL).catch(() => {
              if (data?.zoom_join_url) {
                Linking.openURL(data.zoom_join_url);
              }
            });
          } else {
            console.log('Meeting ID or password missing');
          }
        }}
      >
        <Image
          source={{
            uri:
              data.thumbnail_url ||
              'https://via.placeholder.com/300x200.png?text=Webinar',
          }}
          style={styles.thumbnail}
        />

        <View style={styles.row}>
          <View style={{ width: '90%' }}>
            <Text numberOfLines={2} style={styles.title}>
              {data?.title}
            </Text>
          </View>

          <Menu
            visible={menuVisible === data?.id}
            onDismiss={handleMenuClose}
            anchor={
              <TouchableOpacity
                onPress={() => handleMenuOpen(data?.id)}
                style={styles.menuButton}
              >
                <EllipsisVertical color={colors.primary} size={wp(20)} />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => {
                handleMenuClose();
                Nav.navigate('CreateWebinar', { data: data });
              }}
              title="Edit"
              style={styles.menuItem}
            />

            <Menu.Item
              onPress={() => {
                handleMenuClose();
                setShowModal(true);
                setWebinarId(data?.id);
              }}
              title="Delete"
              titleStyle={styles.deleteText}
              style={styles.menuItem}
            />
          </Menu>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.slice(0, 2).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>

        <View style={styles.creatorRow}>
          <Image
            source={{
              uri: data?.creator?.profile_image || data?.profile_image,
            }}
            style={styles.creatorImg}
          />
          <Text style={styles.creatorName}>
            {data?.creator?.name || data?.name}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>₹{data.price}</Text>
          <Text style={styles.date}>
            {moment(data.scheduled_at).format('DD/MM/YYYY')}
          </Text>
        </View>
      </TouchableOpacity>

      <DynamicModal
        visible={showModal}
        heading="Delete Webinar"
        message="Are you sure you want to delete this webinar?"
        onCancel={handleCancel}
        onDelete={handleDelete}
        loading={deleteLoader}
      />
    </>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    width: wp(260),
    backgroundColor: colors.white,
    borderRadius: wp(16),
    paddingBottom: hp(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginLeft: wp(20),
    marginVertical: hp(5),
  },

  thumbnail: {
    width: '100%',
    height: hp(140),
    backgroundColor: colors.borderColor,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(10),
    paddingHorizontal: wp(12),
  },

  title: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.primary,
  },

  tagContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(12),
    marginTop: hp(6),
  },

  tag: {
    fontSize: fp(12),
    backgroundColor: '#E8F1FF',
    color: '#3E7BFA',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(8),
    marginRight: wp(6),
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(10),
    paddingHorizontal: wp(12),
  },

  creatorImg: {
    width: wp(26),
    height: hp(26),
    borderRadius: wp(13),
    backgroundColor: '#ddd',
  },

  creatorName: {
    marginLeft: wp(8),
    fontSize: fp(14),
    color: '#555',
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    marginTop: hp(12),
  },

  price: {
    fontSize: fp(16),
    color: '#000',
    fontWeight: '700',
  },

  date: {
    fontSize: fp(12),
    color: '#888',
  },

  menuButton: {
    padding: wp(4),
  },

  menuContent: {
    backgroundColor: colors.white,
    borderRadius: wp(8),
    elevation: 4,
  },

  menuItem: {
    paddingVertical: hp(8),
  },

  deleteText: {
    color: colors.error,
  },
});
