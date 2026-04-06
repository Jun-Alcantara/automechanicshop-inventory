import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useCatalogStore } from '@stores/catalogStore';
import { useSessionStore } from '@stores/sessionStore';
import { createCategory, deleteCategory } from '@services/catalogService';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Category } from '@/types';

export const CategoryListScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  const { categories, loading, subscribe, unsubscribe } = useCatalogStore();
  const user = useSessionStore((s) => s.user);

  const [showInlineInput, setShowInlineInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      subscribe();
    }, [subscribe])
  );

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  useEffect(() => {
    if (showInlineInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showInlineInput]);

  if (!isAuthorized) return null;

  const handleCreate = async () => {
    const name = newCategoryName.trim();
    if (!name || !user) return;

    setSubmitting(true);
    try {
      await createCategory(name, user);
      setNewCategoryName('');
      setShowInlineInput(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (e: any) {
              Alert.alert('Cannot Delete', e?.message ?? 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.row}>
      <Text style={styles.rowName}>{item.name}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => {
    if (!showInlineInput) return null;
    return (
      <View style={styles.inlineInput}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Category name…"
          placeholderTextColor={Colors.gray500}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
          editable={!submitting}
        />
        <TouchableOpacity
          style={[styles.confirmButton, (!newCategoryName.trim() || submitting) && styles.confirmButtonDisabled]}
          onPress={handleCreate}
          disabled={!newCategoryName.trim() || submitting}
        >
          <Text style={styles.confirmLabel}>{submitting ? '…' : 'Add'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowInlineInput(false);
            setNewCategoryName('');
          }}
          disabled={submitting}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.list,
          categories.length === 0 && !showInlineInput && styles.listEmpty,
        ]}
        ListEmptyComponent={
          showInlineInput ? null : (
            <EmptyState
              title="No categories yet"
              subtitle="Tap 'Add Category' to create one."
            />
          )
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowInlineInput(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabLabel}>+ Add Category</Text>
      </TouchableOpacity>

      <LoadingOverlay visible={loading} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 4,
  },
  listEmpty: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowName: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.black,
  },
  deleteButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  deleteLabel: {
    fontSize: Typography.sm,
    color: Colors.danger,
    fontWeight: '600',
  },
  inlineInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.black,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginLeft: Spacing.xs,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  cancelLabel: {
    color: Colors.gray500,
    fontSize: Typography.sm,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabLabel: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
