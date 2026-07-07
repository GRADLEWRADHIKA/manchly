import React, {useState, useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation, useRoute, useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Coins, Gift, Plus, Pencil, Trash2, Clock, IndianRupee} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {
  createSessionProduct,
  getMySessionProducts,
  updateSessionProduct,
  deleteSessionProduct,
} from '../../../../store/SessionSlice';
import CustomTextInput from '../../../../components/CustomInput';
import {Dropdown} from 'react-native-element-dropdown';

const DURATION_OPTIONS = [
  {label: '15 mins', value: '15'},
  {label: '30 mins', value: '30'},
  {label: '45 mins', value: '45'},
  {label: '60 mins', value: '60'},
];

const PLATFORM_OPTIONS = [
  {label: 'Zoom', value: 'Zoom'},
  {label: 'Google Meet', value: 'Google Meet'},
  {label: 'Manchly Live', value: 'Manchly Live'},
];

const CreateSessionProduct: React.FC<{embedded?: boolean}> = ({embedded = false}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const {products} = useSelector((s: any) => s.sessionReducer);
  const prefill = route.params?.prefill;
  const editProduct = route.params?.editProduct;

  const [showForm, setShowForm] = useState(!embedded || !!editProduct);
  const [editingProduct, setEditingProduct] = useState<any>(editProduct || null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [platform, setPlatform] = useState('Zoom');
  const [availability, setAvailability] = useState(
    'Available Mon-Fri, 9 AM - 5 PM EST. Please book at least 24 hours in advance.',
  );
  const [pricingModel, setPricingModel] = useState<'paid' | 'free'>('paid');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (embedded && isFocused) {
      dispatch(getMySessionProducts());
    }
  }, [isFocused, embedded]);

  const resetForm = () => {
    setTitle(prefill?.title || '1:1 Expert Consulting');
    setDescription(prefill?.blurb || '');
    setDuration(prefill?.duration_min ? String(prefill.duration_min) : '30');
    setPrice(prefill?.suggested_price_inr ? String(prefill.suggested_price_inr) : '');
    setPlatform('Zoom');
    setAvailability('Available Mon-Fri, 9 AM - 5 PM EST. Please book at least 24 hours in advance.');
    setPricingModel(
      prefill?.suggested_price_inr && Number(prefill.suggested_price_inr) > 0 ? 'paid' : 'free',
    );
    setEditingProduct(null);
  };

  const openEditForm = (product: any) => {
    setEditingProduct(product);
    setTitle(product.title || '');
    // Parse description to extract platform and availability
    const desc = product.description || '';
    const platformMatch = desc.match(/Platform: (.+)/);
    const availMatch = desc.match(/Availability: (.+)/);
    const cleanDesc = desc
      .replace(/\nPlatform: .+/, '')
      .replace(/\nAvailability: .+/, '')
      .trim();
    setDescription(cleanDesc);
    setPlatform(platformMatch?.[1] || 'Zoom');
    setAvailability(availMatch?.[1] || '');
    setDuration(String(product.duration || 30));
    setPrice(String(product.price || 0));
    setPricingModel(Number(product.price) > 0 ? 'paid' : 'free');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !duration) {
      Toast.show({type: 'error', text1: 'Please fill in all details', position: 'bottom'});
      return;
    }

    const finalPrice = pricingModel === 'free' ? 0 : parseFloat(price) || 0;
    const payload = {
      title: title.trim(),
      description: `${description.trim()}\nPlatform: ${platform}\nAvailability: ${availability}`,
      duration: parseInt(duration),
      price: finalPrice,
      mode: 'video',
    };

    setLoading(true);

    if (editingProduct) {
      dispatch(updateSessionProduct({productId: editingProduct.id, data: payload}))
        .unwrap()
        .then(() => {
          if (embedded) {
            setShowForm(false);
            resetForm();
            dispatch(getMySessionProducts());
          } else {
            navigation.goBack();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      dispatch(createSessionProduct(payload))
        .unwrap()
        .then(() => {
          Toast.show({type: 'success', text1: 'Session created!', position: 'bottom'});
          if (embedded) {
            setShowForm(false);
            resetForm();
            dispatch(getMySessionProducts());
          } else {
            navigation.goBack();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleDelete = (productId: string) => {
    setDeleting(productId);
    dispatch(deleteSessionProduct(productId))
      .unwrap()
      .then(() => Toast.show({type: 'success', text1: 'Product deleted', position: 'bottom'}))
      .finally(() => setDeleting(null));
  };

  const renderDropdownItem = (item: any, selectedValue: any) => {
    const isSelected = item.value === selectedValue;
    return (
      <View style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}>
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.label}
        </Text>
      </View>
    );
  };

  // ── Product List (embedded mode) ────────────────────────────────────────
  if (embedded && !showForm) {
    return (
      <View style={styles.root}>
        <FlatList
          data={products || []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.addProductBtn}
              activeOpacity={0.8}
              onPress={() => {
                resetForm();
                setShowForm(true);
              }}>
              <Plus size={wp(18)} color={colors.gold} />
              <Text style={styles.addProductText}>Create New Session Product</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Clock size={wp(36)} color={colors.textMuted} strokeWidth={1.2} />
              <Text style={styles.emptyText}>No session products yet</Text>
              <Text style={styles.emptySubText}>
                Create your first 1:1 session offering above.
              </Text>
            </View>
          }
          renderItem={({item}) => {
            const isPaid = Number(item.price) > 0;
            return (
              <View style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.productMeta}>
                    <Clock size={wp(12)} color={colors.textSecondary} />
                    <Text style={styles.productMetaText}>{item.duration} min</Text>
                    <View style={styles.dot} />
                    <IndianRupee size={wp(12)} color={colors.textSecondary} />
                    <Text style={styles.productMetaText}>
                      {isPaid ? `₹${item.price}` : 'Free'}
                    </Text>
                  </View>
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditForm(item)}
                    activeOpacity={0.7}>
                    <Pencil size={wp(15)} color={colors.gold} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    activeOpacity={0.7}>
                    {deleting === item.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Trash2 size={wp(15)} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  }

  // ── Form (create or edit) ───────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {!embedded && (
        <AppHeaderWithBack
          title={editingProduct ? 'Edit Session Product' : '1:1 Session Details'}
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Session Details Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>
              {editingProduct ? 'Edit Session Details' : '1:1 Session Details'}
            </Text>
            <Text style={styles.cardHeaderSubtitle}>
              Configure the specifics for your personalized coaching sessions.
            </Text>

            <Text style={styles.inputLabel}>SESSION TITLE</Text>
            <CustomTextInput
              inputContainerStyle={styles.input}
              inputStyle={styles.inputText}
              placeholder="e.g. 1:1 Expert Consulting"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChange={setTitle}
            />

            <Text style={styles.inputLabel}>SESSION DURATION</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.selectedText}
              containerStyle={styles.dropdownContainer}
              activeColor={colors.inputBg}
              data={DURATION_OPTIONS}
              labelField="label"
              valueField="value"
              placeholder="Select Duration"
              value={duration}
              onChange={item => setDuration(item.value)}
              renderItem={item => renderDropdownItem(item, duration)}
            />

            <Text style={styles.inputLabel}>MEETING PLATFORM</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.selectedText}
              containerStyle={styles.dropdownContainer}
              activeColor={colors.inputBg}
              data={PLATFORM_OPTIONS}
              labelField="label"
              valueField="value"
              placeholder="Select Platform"
              value={platform}
              onChange={item => setPlatform(item.value)}
              renderItem={item => renderDropdownItem(item, platform)}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <CustomTextInput
              inputContainerStyle={[styles.input, styles.textArea]}
              inputStyle={[styles.inputText, {textAlignVertical: 'top'}]}
              placeholder="Describe what the session covers..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChange={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>AVAILABILITY</Text>
            <CustomTextInput
              inputContainerStyle={[styles.input, styles.textArea]}
              inputStyle={[styles.inputText, {textAlignVertical: 'top'}]}
              placeholder="e.g. Available Mon-Fri, 9 AM - 5 PM EST."
              placeholderTextColor={colors.textMuted}
              value={availability}
              onChange={setAvailability}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Pricing Model Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Pricing Model</Text>
            <Text style={styles.pricingSubtitle}>Set the value for your knowledge.</Text>

            <View style={styles.pricingPillRow}>
              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'paid' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => setPricingModel('paid')}
                activeOpacity={0.9}>
                <Coins size={16} color={pricingModel === 'paid' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'paid'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
                  ]}>
                  Paid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingPill,
                  pricingModel === 'free' ? styles.pricingPillActive : styles.pricingPillInactive,
                ]}
                onPress={() => {
                  setPricingModel('free');
                  setPrice('0');
                }}
                activeOpacity={0.9}>
                <Gift size={16} color={pricingModel === 'free' ? '#000000' : colors.white} />
                <Text
                  style={[
                    styles.pricingPillText,
                    pricingModel === 'free'
                      ? styles.pricingPillTextActive
                      : styles.pricingPillTextInactive,
                  ]}>
                  Free
                </Text>
              </TouchableOpacity>
            </View>

            {pricingModel === 'paid' && (
              <View style={{marginTop: hp(12)}}>
                <Text style={styles.inputLabel}>PRICE (INR)</Text>
                <CustomTextInput
                  inputContainerStyle={styles.input}
                  inputStyle={styles.inputText}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                  placeholderTextColor={colors.textMuted}
                  value={price}
                  onChange={setPrice}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              if (embedded) {
                setShowForm(false);
                resetForm();
              } else {
                navigation.goBack();
              }
            }}
            disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && {opacity: 0.7}]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.primaryText}>
                {editingProduct ? 'Save Changes' : 'Create 1:1 Session'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(CreateSessionProduct);

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(40),
  },
  // Product list styles
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: hp(40),
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    paddingVertical: hp(16),
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: hp(16),
  },
  addProductText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.gold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(48),
    gap: hp(8),
  },
  emptyText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: fp(12),
    color: colors.textMuted,
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: {flex: 1, marginRight: wp(10)},
  productTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  productMetaText: {
    fontSize: fp(11),
    color: colors.textSecondary,
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: colors.textMuted,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  editBtn: {
    padding: wp(8),
    borderRadius: wp(8),
    backgroundColor: colors.gold + '15',
  },
  deleteBtn: {
    padding: wp(8),
    borderRadius: wp(8),
    backgroundColor: '#EF444415',
  },
  // Form styles
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
  },
  cardHeaderTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  cardHeaderSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(14),
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: hp(6),
    marginTop: hp(6),
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: wp(12),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(10),
  },
  inputText: {color: colors.white, fontSize: fp(14)},
  textArea: {height: hp(88)},
  dropdown: {
    height: hp(44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: wp(12),
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    marginBottom: hp(10),
  },
  dropdownContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(10),
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: 8,
  },
  dropdownItemSelected: {backgroundColor: colors.inputBg},
  dropdownItemText: {color: colors.textSecondary, fontSize: fp(13)},
  dropdownItemTextSelected: {color: colors.gold, fontWeight: '600'},
  placeholderText: {fontSize: fp(14), color: colors.textMuted},
  selectedText: {fontSize: fp(14), color: colors.white},
  pricingSubtitle: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(12),
  },
  pricingPillRow: {flexDirection: 'row', gap: wp(10)},
  pricingPill: {
    flex: 1,
    height: hp(44),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
  },
  pricingPillActive: {backgroundColor: colors.gold},
  pricingPillInactive: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingPillText: {fontSize: fp(13), fontWeight: '700'},
  pricingPillTextActive: {color: '#000000'},
  pricingPillTextInactive: {color: colors.white},
  actions: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  cancelBtn: {
    flex: 1,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {color: colors.white, fontWeight: '600', fontSize: fp(14)},
  primaryBtn: {
    flex: 1.5,
    backgroundColor: colors.gold,
    height: hp(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {color: '#000000', fontWeight: '700', fontSize: fp(14)},
});
