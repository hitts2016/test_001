import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, clothingTypes, seasons } from '@/utils/theme';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slot {
  id: string;
  row: number;
  col: number;
}

interface WardrobeLayout {
  rows: number;
  cols: number;
  slots: Slot[];
}

interface Wardrobe {
  id: number;
  name: string;
  layout: WardrobeLayout;
}

interface Cloth {
  id: number;
  wardrobe_id: number;
  slot_id: string;
  name: string;
  type: string;
  season: string;
  image_key: string | null;
}

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [wardrobe, setWardrobe] = useState<Wardrobe | null>(null);
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchWardrobe = useCallback(async () => {
    try {
      setLoading(true);
      // Get first wardrobe
      const wardRes = await fetch(`${API_BASE}/api/v1/wardrobes`);
      const wardData = await wardRes.json();
      if (Array.isArray(wardData) && wardData.length > 0) {
        setWardrobe(wardData[0]);
        // Get clothes for this wardrobe
        const clothRes = await fetch(`${API_BASE}/api/v1/clothes?wardrobe_id=${wardData[0].id}`);
        const clothData = await clothRes.json();
        setClothes(clothData);
        // Fetch image URLs for clothes with images
        const urlMap: Record<string, string> = {};
        for (const cloth of clothData) {
          if (cloth.image_key) {
            try {
              const urlRes = await fetch(`${API_BASE}/api/v1/upload/${encodeURIComponent(cloth.image_key)}/url`);
              const urlData = await urlRes.json();
              urlMap[cloth.id] = urlData.url;
            } catch {
              // skip
            }
          }
        }
        setImageUrls(urlMap);
      } else {
        // Create default wardrobe
        const createRes = await fetch(`${API_BASE}/api/v1/wardrobes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '我的衣柜',
            layout: {
              rows: 3,
              cols: 3,
              slots: generateSlots(3, 3),
            },
          }),
        });
        const created = await createRes.json();
        setWardrobe(created);
      }
    } catch (err) {
      console.error('Failed to fetch wardrobe:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWardrobe();
    }, [fetchWardrobe])
  );

  const generateSlots = (rows: number, cols: number): Slot[] => {
    const slots: Slot[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({ id: `slot_${r}_${c}`, row: r, col: c });
      }
    }
    return slots;
  };

  const getClothesForSlot = (slotId: string) => {
    return clothes.filter((c) => c.slot_id === slotId);
  };

  const handleSlotPress = (slot: Slot) => {
    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const handleAddCloth = (slotId?: string) => {
    setModalVisible(false);
    router.push('/add-cloth', {
      wardrobeId: wardrobe?.id,
      slotId: slotId,
    });
  };

  const handleDeleteCloth = async (clothId: number) => {
    Alert.alert('删除衣服', '确定要删除这件衣服吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/v1/clothes/${clothId}`, { method: 'DELETE' });
            setClothes((prev) => prev.filter((c) => c.id !== clothId));
          } catch (err) {
            console.error('Failed to delete cloth:', err);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!wardrobe) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Feather name="box" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>还没有衣柜</Text>
          <TouchableOpacity style={styles.createButton} onPress={fetchWardrobe}>
            <Text style={styles.createButtonText}>创建衣柜</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const layout = wardrobe.layout;
  const slotSize = (SCREEN_WIDTH - 48 - (layout.cols - 1) * 8) / layout.cols;

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{wardrobe.name}</Text>
            <Text style={styles.headerSubtitle}>
              {clothes.length} 件衣物
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddCloth()}
          >
            <Feather name="plus" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Wardrobe Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wardrobeFrame}>
            {Array.from({ length: layout.rows }).map((_, rowIdx) => (
              <View key={`row_${rowIdx}`} style={styles.wardrobeRow}>
                {Array.from({ length: layout.cols }).map((_, colIdx) => {
                  const slotId = `slot_${rowIdx}_${colIdx}`;
                  const slot = layout.slots.find((s) => s.id === slotId);
                  const slotClothes = slot ? getClothesForSlot(slotId) : [];
                  return (
                    <TouchableOpacity
                      key={slotId}
                      style={[styles.slot, { width: slotSize, height: slotSize }]}
                      onPress={() => slot && handleSlotPress(slot)}
                      activeOpacity={0.7}
                    >
                      {slotClothes.length > 0 ? (
                        <View style={styles.slotContent}>
                          {slotClothes[0].image_key && imageUrls[slotClothes[0].id] ? (
                            <Image
                              source={{ uri: imageUrls[slotClothes[0].id] }}
                              style={styles.slotImage}
                            />
                          ) : (
                            <View style={styles.slotPlaceholder}>
                              <Feather name="grid" size={20} color={colors.primaryLight} />
                            </View>
                          )}
                          {slotClothes.length > 1 && (
                            <View style={styles.slotBadge}>
                              <Text style={styles.slotBadgeText}>+{slotClothes.length - 1}</Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.emptySlot}>
                          <Feather name="plus" size={16} color={colors.textMuted} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Slot Detail Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedSlot ? `第${selectedSlot.row + 1}行 第${selectedSlot.col + 1}列` : ''}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedSlot && getClothesForSlot(selectedSlot.id).length > 0 ? (
                  getClothesForSlot(selectedSlot.id).map((cloth) => (
                    <View key={cloth.id} style={styles.clothItem}>
                      {cloth.image_key && imageUrls[cloth.id] ? (
                        <Image
                          source={{ uri: imageUrls[cloth.id] }}
                          style={styles.clothImage}
                        />
                      ) : (
                        <View style={styles.clothImagePlaceholder}>
                          <Feather name="grid" size={20} color={colors.primaryLight} />
                        </View>
                      )}
                      <View style={styles.clothInfo}>
                        <Text style={styles.clothName}>{cloth.name}</Text>
                        <Text style={styles.clothMeta}>
                          {clothingTypes[cloth.type] || cloth.type} · {seasons[cloth.season] || cloth.season}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteCloth(cloth.id)}>
                        <Feather name="trash-2" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptySlotModal}>
                    <Feather name="inbox" size={32} color={colors.textMuted} />
                    <Text style={styles.emptySlotText}>这个格子还没有衣服</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={() => handleAddCloth(selectedSlot?.id)}
              >
                <Feather name="plus-circle" size={20} color={colors.accent} />
                <Text style={styles.modalAddText}>添加衣服</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  createButton: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  wardrobeFrame: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  wardrobeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  slot: {
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: 4,
    marginBottom: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotContent: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slotPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    margin: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 300,
  },
  clothItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clothImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  clothImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clothInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clothName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  clothMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptySlotModal: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptySlotText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(91, 138, 114, 0.1)',
    gap: 8,
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
