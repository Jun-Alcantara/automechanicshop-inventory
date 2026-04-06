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
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useCatalogStore } from '@stores/catalogStore';
import { useSessionStore } from '@stores/sessionStore';
import {
  createAddOn,
  updateAddOn,
  deactivateAddOn,
  activateAddOn,
} from '@services/catalogService';
import { formatPHP } from '@utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { AddOn } from '@/types';

type FormState = {
  name: string;
  amount: string;
};

type FormErrors = {
  name?: string;
  amount?: string;
};

export const AddOnCatalogScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  const { addOns, loading, subscribe } = useCatalogStore();
  const currentUser = useSessionStore((s) => s.user);

  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', amount: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      subscribe();
    }, [subscribe])
  );


  if (!isAuthorized) return null;

  const filteredAddOns = showActiveOnly
    ? addOns.filter((a) => a.isActive)
    : addOns;

  const openCreateForm = () => {
    setEditingAddOn(null);
    setForm({ name: '', amount: '' });
    setErrors({});
    setModalVisible(true);
  };

  const openEditForm = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setForm({ name: addOn.name, amount: String(addOn.amount) });
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
    const parsed = parseFloat(form.amount);
    if (!form.amount.trim() || isNaN(parsed) || parsed < 0) {
      newErrors.amount = 'A valid amount is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !currentUser) return;

    try {
      setIsSaving(true);
      const amount = parseFloat(form.amount);
      if (editingAddOn) {
        await updateAddOn(editingAddOn.id, { name: form.name.trim(), amount }, currentUser);
      } else {
        await createAddOn({ name: form.name.trim(), amount }, currentUser);
      }
      closeModal();
    } catch {
      Alert.alert('Error', 'Failed to save add-on. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = (addOn: AddOn) => {
    Alert.alert(
      'Deactivate Add-on',
      `Deactivate "${addOn.name}"? It will no longer appear during transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateAddOn(addOn.id, currentUser!);
            } catch {
              Alert.alert('Error', 'Failed to deactivate add-on. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleActivate = async (addOn: AddOn) => {
    try {
      await activateAddOn(addOn.id);
    } catch {
      Alert.alert('Error', 'Failed to activate add-on. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: AddOn }) => (
    <TouchableOpacity
      style={[styles.row, !item.isActive && styles.rowInactive]}
      onPress={() => openEditForm(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, !item.isActive && styles.rowNameInactive]}>
            {item.name}
          </Text>
          <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatPHP(item.amount)}</Text>
      </View>
      {item.isActive ? (
        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={() => handleDeactivate(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deactivateLabel}>Deactivate</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.activateButton}
          onPress={() => handleActivate(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.activateLabel}>Activate</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, showActiveOnly && styles.filterChipActive]}
          onPress={() => setShowActiveOnly(true)}
        >
          <Text style={[styles.filterChipText, showActiveOnly && styles.filterChipTextActive]}>
            Active Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, !showActiveOnly && styles.filterChipActive]}
          onPress={() => setShowActiveOnly(false)}
        >
          <Text style={[styles.filterChipText, !showActiveOnly && styles.filterChipTextActive]}>
            Show All
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAddOns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          filteredAddOns.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No Add-ons Found"
              subtitle={
                showActiveOnly
                  ? 'No active add-ons. Toggle "Show All" or tap "+ New Add-on" to create one.'
                  : 'No add-ons yet. Tap "+ New Add-on" to create one.'
              }
            />
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateForm} activeOpacity={0.8}>
        <Text style={styles.fabLabel}>+ New Add-on</Text>
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
              {editingAddOn ? 'Edit Add-on' : 'New Add-on'}
            </Text>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <AppInput
                label="Name"
                placeholder="e.g. Wheel Alignment"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                error={errors.name}
                autoFocus
              />
              <AppInput
                label="Amount"
                placeholder="e.g. 350"
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                error={errors.amount}
                keyboardType="decimal-pad"
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
                label={editingAddOn ? 'Save Changes' : 'Create'}
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
  filterBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
  rowInactive: {
    opacity: 0.6,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  rowName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },
  rowNameInactive: {
    color: Colors.gray500,
  },
  amount: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeActive: {
    backgroundColor: Colors.successLight,
  },
  badgeInactive: {
    backgroundColor: Colors.gray100,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },
  badgeTextActive: {
    color: Colors.success,
  },
  badgeTextInactive: {
    color: Colors.gray500,
  },
  deactivateButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dangerLight,
  },
  deactivateLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.danger,
  },
  activateButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.successLight,
  },
  activateLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.success,
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
