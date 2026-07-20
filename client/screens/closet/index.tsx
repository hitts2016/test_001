import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Feather } from '@expo/vector-icons';
import { colors, clothingTypes, seasons } from '@/utils/theme';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

interface Cloth {
  id: number;
  wardrobe_id: number;
  slot_id: string;
  name: string;
  type: string;
  season: string;
  image_key: string | null;
}

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'tops', label: '上衣' },
  { key: 'pants', label: '裤子' },
  { key: 'skirts', label: '裙装' },
  { key: 'outerwear', label: '外套' },
  { key: 'dresses', label: '连衣裙' },
  { key: 'shoes', label: '鞋子' },
  { key: 'accessories', label: '配饰' },
];

const seasonFilters = [
  { key: 'all', label: '全部' },
  { key: 'spring', label: '春' },
  { key: 'summer', label: '夏' },
  { key: 'autumn', label: '秋' },
  { key: 'winter', label: '冬' },
];

export default function ClosetScreen() {
  const router = useSafeRouter();
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const fetchClothes = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/v1/clothes`;
      const params: string[] = [];
      if (typeFilter !== 'all') params.push(`type=${typeFilter}`);
      if (seasonFilter !== 'all') params.push(`season=${seasonFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      setClothes(data);

      // Fetch image URLs
      const urlMap: Record<string, string> = {};
      for (const cloth of data) {
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
    } catch (err) {
      console.error('Failed to fetch clothes:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, seasonFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchClothes();
    }, [fetchClothes])
  );

  const handleDeleteCloth = (clothId: number) => {
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

  const renderClothItem = ({ item }: { item: Cloth }) => (
    <View style={styles.card}>
      {item.image_key && imageUrls[item.id] ? (
        <Image source={{ uri: imageUrls[item.id] }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Feather name="grid" size={32} color={colors.primaryLight} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{clothingTypes[item.type] || item.type}</Text>
          </View>
          <View style={styles.tagSeason}>
            <Text style={styles.tagTextSeason}>{seasons[item.season] || item.season}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCloth(item.id)}
      >
        <Feather name="trash-2" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerPlaceholder} />

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>我的衣橱</Text>
          <Text style={styles.subtitle}>{clothes.length} 件衣物</Text>
        </View>

        {/* Type Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>类型</Text>
          <FlatList
            data={typeFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, typeFilter === item.key && styles.filterChipActive]}
                onPress={() => setTypeFilter(item.key)}
              >
                <Text style={[styles.filterChipText, typeFilter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Season Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>季节</Text>
          <FlatList
            data={seasonFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, seasonFilter === item.key && styles.filterChipSeasonActive]}
                onPress={() => setSeasonFilter(item.key)}
              >
                <Text style={[styles.filterChipText, seasonFilter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Clothes List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : clothes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="shopping-bag" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>还没有衣服</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-cloth', {})}
            >
              <Text style={styles.addButtonText}>添加第一件</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={clothes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderClothItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerPlaceholder: {
    height: 56,
    backgroundColor: colors.background,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  filterRow: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipSeasonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  addButton: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardTags: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 111, 78, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  tagSeason: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(91, 138, 114, 0.1)',
  },
  tagTextSeason: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});
