import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, Clock, IndianRupee, Video, Mic } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Product = {
  title: string;
  duration_min: number;
  type: 'audio' | 'video';
  suggested_price_inr: number;
  blurb: string;
  ideal_for: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  expertHeadline: string;
  expertBio?: string;
  category?: string;
  onSelect: (product: Product) => void;
};

const ProductSuggestionsModal: React.FC<Props> = ({
  visible, onClose, expertHeadline, expertBio, category, onSelect,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await aiCall('/ai/session/product-suggestions', {
        expert_headline: expertHeadline,
        ...(expertBio ? { expert_bio: expertBio } : {}),
        ...(category ? { category } : {}),
        count: 4,
      });
      setProducts(data.products || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to get suggestions', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (p: Product) => {
    onSelect(p);
    setProducts([]);
    onClose();
  };

  const handleClose = () => { setProducts([]); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Product Ideas</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {products.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.subtitle}>Get AI-suggested session products</Text>
              <AiButton label="Suggest Products" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              {products.map((p, i) => (
                <TouchableOpacity key={i} style={styles.card} onPress={() => handleSelect(p)} activeOpacity={0.8}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.blurb}>{p.blurb}</Text>

                  <View style={styles.metaRow}>
                    {p.type === 'video'
                      ? <Video size={wp(14)} color={colors.success} />
                      : <Mic size={wp(14)} color={colors.info} />}
                    <Text style={styles.metaText}>{p.type}</Text>

                    <Clock size={wp(14)} color={colors.textMuted} />
                    <Text style={styles.metaText}>{p.duration_min} min</Text>

                    <IndianRupee size={wp(14)} color={colors.textMuted} />
                    <Text style={styles.metaText}>{p.suggested_price_inr}</Text>
                  </View>

                  <Text style={styles.idealFor}>Ideal for: {p.ideal_for}</Text>
                </TouchableOpacity>
              ))}
              <AiButton label="More Ideas" onPress={generate} loading={loading} />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ProductSuggestionsModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  center: { alignItems: 'center', paddingTop: hp(40), gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  card: {
    backgroundColor: colors.white, borderRadius: wp(14), padding: wp(16),
    marginBottom: hp(12), borderWidth: 1, borderColor: colors.borderLight,
  },
  cardTitle: { fontSize: fp(15), fontWeight: '700', color: colors.text, marginBottom: hp(4) },
  blurb: { fontSize: fp(13), color: colors.textSecondary, lineHeight: fp(20), marginBottom: hp(10) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: wp(6), marginBottom: hp(8) },
  metaText: { fontSize: fp(12), color: colors.textSecondary, marginRight: wp(6) },
  idealFor: { fontSize: fp(12), color: colors.info, fontStyle: 'italic' },
});
