import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, clothingTypes, seasons } from '@/utils/theme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createFormDataFile } from '@/utils';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

const typeOptions = Object.entries(clothingTypes).map(([key, label]) => ({ key, label }));
const seasonOptions = Object.entries(seasons).map(([key, label]) => ({ key, label }));

export default function AddClothScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ wardrobeId?: number; slotId?: string }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('tops');
  const [season, setSeason] = useState('all');
  const [saving, setSaving] = useState(false);

  const wardrobeId = params.wardrobeId;
  const slotId = params.slotId;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册权限才能选择照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入衣服名称');
      return;
    }
    if (!wardrobeId) {
      Alert.alert('提示', '请先创建衣柜');
      return;
    }

    try {
      setSaving(true);
      let imageKey: string | null = null;

      // Upload image if exists
      if (imageUri) {
        const formData = new FormData();
        const file = await createFormDataFile(imageUri, `cloth_${Date.now()}.jpg`, 'image/jpeg');
        formData.append('file', file as unknown as Blob);

        const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageKey = uploadData.key;
        }
      }

      // Create cloth record
      /**
       * 服务端文件：server/src/routes/clothes.ts
       * 接口：POST /api/v1/clothes
       * Body 参数：wardrobe_id: number, slot_id?: string, name: string, type: string, season: string, image_key?: string
       */
      const res = await fetch(`${API_BASE}/api/v1/clothes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobe_id: wardrobeId,
          slot_id: slotId || null,
          name: name.trim(),
          type,
          season,
          image_key: imageKey,
        }),
      });

      if (res.ok) {
        router.back();
      } else {
        const errData = await res.json();
        Alert.alert('错误', errData.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save cloth:', err);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加衣服</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Feather name="x" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={32} color={colors.textMuted} />
                <Text style={styles.imagePlaceholderText}>添加衣服照片</Text>
              </View>
            )}

            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
                <Feather name="camera" size={18} color={colors.primary} />
                <Text style={styles.imageButtonText}>拍照</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Feather name="image" size={18} color={colors.primary} />
                <Text style={styles.imageButtonText}>相册</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>衣服名称</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例如：白色T恤"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>衣服类型</Text>
            <View style={styles.optionsGrid}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionChip, type === option.key && styles.optionChipActive]}
                  onPress={() => setType(option.key)}
                >
                  <Text style={[styles.optionChipText, type === option.key && styles.optionChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Season Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>适合季节</Text>
            <View style={styles.optionsGrid}>
              {seasonOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionChip, season === option.key && styles.optionChipSeasonActive]}
                  onPress={() => setSeason(option.key)}
                >
                  <Text style={[styles.optionChipText, season === option.key && styles.optionChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Slot Info */}
          {slotId && (
            <View style={styles.slotInfo}>
              <Feather name="grid" size={16} color={colors.accent} />
              <Text style={styles.slotInfoText}>
                将放入格子：{slotId.replace('slot_', '').replace('_', '行 ').replace('_', ' 列')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
  imageButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 111, 78, 0.1)',
    gap: 6,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipSeasonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionChipTextActive: {
    color: colors.white,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 138, 114, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  slotInfoText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
