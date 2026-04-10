import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { VehicleForm } from '@components/vehicles/VehicleForm';
import { useSessionStore } from '@stores/sessionStore';
import { observeVehiclesForCustomer } from '@services/vehicleService';
import { createTransaction } from '@services/transactionService';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { TransactionsStackScreenProps } from '@navigation/types';
import type { Vehicle } from '@/types';

type Props = TransactionsStackScreenProps<'VehicleSelection'>;

type ViewMode = 'loading' | 'list' | 'add';

export const VehicleSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { customerId, customerName } = route.params;
  const user = useSessionStore((s) => s.user);

  const [mode, setMode] = useState<ViewMode>('loading');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // ─── Load vehicles ───────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      const sub = observeVehiclesForCustomer(customerId).subscribe((models) => {
        const mapped: Vehicle[] = models.map((v) => ({
          id: v.id,
          customerId: v.customerId,
          make: v.make,
          model: v.model,
          color: v.color,
          plateNumber: v.plateNumber,
          createdAt: v.createdAt,
          createdBy: v.createdBy,
        }));
        setVehicles(mapped);
        setMode((prev) => {
          if (prev === 'loading') return mapped.length === 0 ? 'add' : 'list';
          return prev;
        });
      });
      return () => sub.unsubscribe();
    }, [customerId])
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    if (!user) return;
    setIsStarting(true);
    try {
      const transaction = await createTransaction(
        { customerId, cashierId: user.id, vehicleId: vehicle.id },
        user
      );
      navigation.replace('TransactionDetail', { transactionId: transaction.id });
    } catch {
      Alert.alert('Error', 'Failed to start transaction.');
      setIsStarting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (mode === 'loading') {
    return (
      <ScreenWrapper>
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      </ScreenWrapper>
    );
  }

  if (mode === 'add') {
    return (
      <ScreenWrapper>
        <VehicleForm
          customerId={customerId}
          onSaved={() => setMode('list')}
          {...(vehicles.length > 0 && { onCancel: () => setMode('list') })}
        />
      </ScreenWrapper>
    );
  }

  // ─── List mode ───────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleRow}
              onPress={() => handleSelectVehicle(item)}
              disabled={isStarting}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleMain}>
                <Text style={styles.vehicleMake}>
                  {item.make}{item.model ? ` ${item.model}` : ''}
                </Text>
                {item.plateNumber ? (
                  <Text style={styles.vehiclePlate}>{item.plateNumber}</Text>
                ) : null}
              </View>
              {item.color ? (
                <Text style={styles.vehicleColor}>{item.color}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />

        <View style={styles.footer}>
          <AppButton
            label="Add Vehicle"
            variant="secondary"
            onPress={() => setMode('add')}
            fullWidth
          />
        </View>

        {isStarting && (
          <View style={styles.startingOverlay}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: Spacing.xxl,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  vehicleMain: {
    flex: 1,
    gap: 2,
  },
  vehicleMake: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },
  vehiclePlate: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  vehicleColor: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginLeft: Spacing.sm,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
