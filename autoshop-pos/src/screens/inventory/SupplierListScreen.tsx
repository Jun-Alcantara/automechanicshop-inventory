import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { useCatalogStore } from '@stores/catalogStore';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useSessionStore } from '@stores/sessionStore';
import { createSupplier, updateSupplier, deleteSupplier } from '@services/catalogService';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Supplier } from '@/types';

type FormState = {
  name: string;
  contactInfo: string;
};

type FormErrors = {
  name?: string;
};

export const SupplierListScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  const { suppliers, loading, subscribe } = useCatalogStore();
  const currentUser = useSessionStore((s) => s.user);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', contactInfo: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      subscribe();
    }, [subscribe])
  );


  if (!isAuthorized) return null;

  const openCreateForm = () => {
    setEditingSupplier(null);
    setForm({ name: '', contactInfo: '' });
    setErrors({});
    setModalVisible(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({ name: supplier.name, contactInfo: supplier.contactInfo ?? '' });
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !currentUser) return;

    try {
      setIsSaving(true);
      if (editingSupplier) {
        await updateSupplier(
          editingSupplier.id,
          { name: form.name.trim(), contactInfo: form.contactInfo.trim() },
          currentUser
        );
      } else {
        await createSupplier(
          { name: form.name.trim(), contactInfo: form.contactInfo.trim() },
          currentUser
        );
      }
      closeModal();
    } catch {
      Alert.alert('Error', 'Failed to save supplier. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (supplier: Supplier) => {
    Alert.alert(
      'Delete Supplier',
      `Delete "${supplier.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupplier(supplier.id);
            } catch {
              Alert.alert('Error', 'Failed to delete supplier. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => openEditForm(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <Text style={styles.supplierName}>{item.name}</Text>
        {item.contactInfo ? (
          <Text style={styles.contactInfo}>{item.contactInfo}</Text>
        ) : (
          <Text style={styles.noContact}>No contact info</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          suppliers.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No Suppliers Yet"
              subtitle="Tap the button below to add your first supplier."
            />
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateForm} activeOpacity={0.8}>
        <Text style={styles.fabLabel}>+ New Supplier</Text>
      </TouchableOpacity>

      <LoadingOverlay visible={loading} />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
            </Text>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <AppInput
                label="Name"
                placeholder="e.g. ABC Auto Parts"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                error={errors.name}
                autoFocus
              />
              <AppInput
                label="Contact (phone or email)"
                placeholder="e.g. 09XX-XXX-XXXX"
                value={form.contactInfo}
                onChangeText={(v) => setForm((f) => ({ ...f, contactInfo: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <AppButton
                label="Cancel"
                variant="secondary"
                onPress={closeModal}
                style={styles.actionButton}
              />
              <AppButton
                label={editingSupplier ? 'Save Changes' : 'Create'}
                onPress={handleSave}
                loading={isSaving}
                style={styles.actionButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
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
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  supplierName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: 2,
  },
  contactInfo: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  noContact: {
    fontSize: Typography.sm,
    color: Colors.gray300,
    fontStyle: 'italic',
  },
  deleteButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dangerLight,
  },
  deleteButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.danger,
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
    fontWeight: Typography.semiBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  modalForm: {
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
