import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSessionStore } from '@stores/sessionStore';
import { useTransactionDraftStore } from '@stores/transactionDraftStore';
import { finalizeTransaction, getTransactionById } from '@services/transactionService';
import { calculateChangeDue } from '@utils/calculateTransaction';
import { formatPHP } from '@utils/formatCurrency';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { PaymentInput, PaymentMethod } from '../../types';
import type { TransactionsStackScreenProps } from '@navigation/types';

type Props = TransactionsStackScreenProps<'Payment'>;

type PaymentEntry = {
  method: PaymentMethod;
  amount: number;
  referenceNumber: string;
  photoUri: string | null;
};

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'GCASH', 'MAYA'];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  GCASH: 'GCash',
  MAYA: 'Maya',
};

export const PaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { transactionId } = route.params;

  const user = useSessionStore((s) => s.user);
  const sessionStatus = useSessionStore((s) => s.status);
  const { draft, openDraft } = useTransactionDraftStore();

  const [totalAmount, setTotalAmount] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Load transaction total ───────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      if (draft?.id === transactionId && draft.totalAmount) {
        setTotalAmount(draft.totalAmount);
      } else {
        try {
          const tx = await getTransactionById(transactionId);
          setTotalAmount(tx.totalAmount);
        } catch {
          // fall through
        }
      }
      // Also open draft in store for consistency
      if (!draft || draft.id !== transactionId) {
        openDraft(transactionId).catch(() => {});
      }
    };
    load();
  }, [transactionId]);

  // ─── Session lock guard ───────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStatus === 'LOCKED') {
      navigation.goBack();
    }
  }, [sessionStatus]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  const cashPaid = payments
    .filter((p) => p.method === 'CASH')
    .reduce((s, p) => s + p.amount, 0);
  const toPaymentInput = (p: PaymentEntry): PaymentInput => {
    const input: PaymentInput = { method: p.method, amount: p.amount };
    if (p.referenceNumber) input.referenceNumber = p.referenceNumber;
    if (p.photoUri) input.receiptPhotoUri = p.photoUri;
    return input;
  };
  const cashChange = calculateChangeDue(totalAmount, payments.map(toPaymentInput));

  const parsedAmount = parseFloat(amount) || 0;

  const isEwallet = method === 'GCASH' || method === 'MAYA';
  const hasRefNumber = referenceNumber.trim().length > 0;
  const isAmountValid = parsedAmount > 0;
  const isAddPaymentEnabled =
    isAmountValid &&
    (!isEwallet || hasRefNumber) &&
    remainingBalance > 0;

  const isFinalizeEnabled = totalPaid >= totalAmount && totalAmount > 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleMethodChange = (m: PaymentMethod) => {
    setMethod(m);
    setReferenceNumber('');
    setPhotoUri(null);
  };

  const handleAddPayment = () => {
    let entryAmount = parsedAmount;

    // Cap e-wallet amount at remaining balance
    if (isEwallet && entryAmount > remainingBalance) {
      Alert.alert(
        'Amount Exceeds Balance',
        `${METHOD_LABELS[method]} amount cannot exceed the remaining balance of ${formatPHP(remainingBalance)}.`,
      );
      return;
    }

    const entry: PaymentEntry = {
      method,
      amount: entryAmount,
      referenceNumber: referenceNumber.trim(),
      photoUri: photoUri,
    };

    setPayments((prev) => [...prev, entry]);
    setAmount('');
    setReferenceNumber('');
    setPhotoUri(null);
  };

  const handleRemovePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.7,
      });

      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        setPhotoUri(asset.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  const handleFinalize = async () => {
    if (!user) return;

    const paymentInputs: PaymentInput[] = payments.map(toPaymentInput);

    setLoading(true);
    try {
      await finalizeTransaction(transactionId, paymentInputs, cashChange, user);
      navigation.replace('Receipt', { transactionId });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to finalize transaction.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Total */}
          <View style={styles.totalCard} testID="total-card">
            <Text style={styles.totalLabel}>Total Amount Due</Text>
            <Text style={styles.totalAmount} testID="total-amount">
              {formatPHP(totalAmount)}
            </Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  testID={`method-${m}`}
                  style={[
                    styles.methodButton,
                    method === m && styles.methodButtonActive,
                  ]}
                  onPress={() => handleMethodChange(m)}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      method === m && styles.methodButtonTextActive,
                    ]}
                  >
                    {METHOD_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <TextInput
              testID="amount-input"
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.gray300}
            />
          </View>

          {/* Reference Number & Photo (e-wallet only) */}
          {isEwallet && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reference Number</Text>
              <TextInput
                testID="reference-input"
                style={styles.input}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="Enter reference number"
                placeholderTextColor={Colors.gray300}
              />

              <TouchableOpacity
                testID="attach-photo-btn"
                style={styles.attachButton}
                onPress={handleAttachPhoto}
              >
                <Text style={styles.attachButtonText}>
                  {photoUri ? 'Photo Attached ✓' : 'Attach Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add Payment Button */}
          <View testID="add-payment-btn">
            <AppButton
              label="Add Payment"
              onPress={handleAddPayment}
              disabled={!isAddPaymentEnabled}
              variant="secondary"
            />
          </View>

          {/* Payment Summary List */}
          {payments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payments</Text>
              {payments.map((entry, index) => (
                <View key={index} style={styles.paymentRow} testID={`payment-row-${index}`}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethod}>{METHOD_LABELS[entry.method]}</Text>
                    <Text style={styles.paymentAmount}>{formatPHP(entry.amount)}</Text>
                    {entry.referenceNumber ? (
                      <Text style={styles.paymentRef}>Ref: {entry.referenceNumber}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    testID={`remove-payment-${index}`}
                    onPress={() => handleRemovePayment(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Remaining Balance */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Remaining Balance</Text>
            <Text
              testID="remaining-balance"
              style={[
                styles.balanceValue,
                remainingBalance <= 0 && styles.balanceValuePaid,
              ]}
            >
              {formatPHP(Math.max(0, remainingBalance))}
            </Text>
          </View>

          {/* Cash Change */}
          {cashPaid > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Cash Change</Text>
              <Text testID="cash-change" style={styles.changeValue}>
                {formatPHP(cashChange)}
              </Text>
            </View>
          )}

          {/* Finalize Button */}
          <View style={styles.finalizeContainer} testID="finalize-btn">
            <AppButton
              label="Finalize"
              onPress={handleFinalize}
              disabled={!isFinalizeEnabled}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    color: Colors.white,
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.gray700,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  methodButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  methodButtonTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.black,
    backgroundColor: Colors.surface,
  },
  attachButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  attachButtonText: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentMethod: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },
  paymentAmount: {
    fontSize: Typography.base,
    color: Colors.gray700,
  },
  paymentRef: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: Typography.xl,
    color: Colors.danger,
    fontWeight: Typography.bold,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  balanceLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  balanceValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.danger,
  },
  balanceValuePaid: {
    color: Colors.success,
  },
  changeValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.success,
  },
  finalizeContainer: {
    marginTop: Spacing.sm,
  },
});
