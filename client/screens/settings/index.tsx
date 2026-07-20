import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/utils/theme';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

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

export default function SettingsScreen() {
  const [wardrobe, setWardrobe] = useState<Wardrobe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const fetchWardrobe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/wardrobes`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setWardrobe(data[0]);
        setName(data[0].name);
        setRows(data[0].layout.rows);
        setCols(data[0].layout.cols);
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

  const generateSlots = (r: number, c: number): Slot[] => {
    const slots: Slot[] = [];
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        slots.push({ id: `slot_${row}_${col}`, row, col });
      }
    }
    return slots;
  };

  const handleSave = async () => {
    if (!wardrobe) return;
    if (!name.trim()) {
      Alert.alert('提示', '衣柜名称不能为空');
      return;
    }
    if (rows < 1 || rows > 6 || cols < 1 || cols > 6) {
      Alert.alert('提示', '行数和列数需要在1-6之间');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/wardrobes/${wardrobe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          layout: { rows, cols, slots: generateSlots(rows, cols) },
        }),
      });
      if (res.ok) {
        Alert.alert('成功', '衣柜布局已更新');
        fetchWardrobe();
      }
    } catch (err) {
      console.error('Failed to save:', err);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('确认重置', '重置将清除所有格子中的衣服关联，确定继续吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          if (!wardrobe) return;
          try {
            // Delete all clothes in this wardrobe
            const clothesRes = await fetch(`${API_BASE}/api/v1/clothes?wardrobe_id=${wardrobe.id}`);
            const clothesData = await clothesRes.json();
            for (const cloth of clothesData) {
              await fetch(`${API_BASE}/api/v1/clothes/${cloth.id}`, { method: 'DELETE' });
            }
            Alert.alert('成功', '已清除所有衣服关联');
          } catch (err) {
            console.error('Failed to reset:', err);
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
        </View>
      </Screen>
    );
  }

  if (!wardrobe) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Feather name="settings" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>请先在衣柜页面创建衣柜</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>衣柜管理</Text>
          <Text style={styles.pageSubtitle}>自定义你的衣柜布局</Text>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>衣柜名称</Text>
          <View style={styles.inputContainer}>
            <Feather name="edit-2" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="输入衣柜名称"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Layout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>格子布局</Text>
          <Text style={styles.sectionDesc}>调整衣柜的行数和列数（1-6）</Text>

          <View style={styles.layoutControls}>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>行数</Text>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setRows(Math.max(1, rows - 1))}
                >
                  <Feather name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.controlValue}>{rows}</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setRows(Math.min(6, rows + 1))}
                >
                  <Feather name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>列数</Text>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setCols(Math.max(1, cols - 1))}
                >
                  <Feather name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.controlValue}>{cols}</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setCols(Math.min(6, cols + 1))}
                >
                  <Feather name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>预览</Text>
            <View style={styles.previewGrid}>
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <View key={`row_${rowIdx}`} style={styles.previewRow}>
                  {Array.from({ length: cols }).map((_, colIdx) => (
                    <View key={`cell_${rowIdx}_${colIdx}`} style={styles.previewCell} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>保存布局</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Feather name="trash-2" size={16} color={colors.danger} />
            <Text style={styles.resetButtonText}>清除所有衣服关联</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  layoutControls: {
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 111, 78, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  previewSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  previewGrid: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 8,
    alignSelf: 'flex-start',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surface,
    margin: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
});
