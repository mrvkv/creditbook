import DateTimePickerModal from "@/components/DateTimePickerModal";
import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { ITransaction } from "@/types/transaction.interface";
import { formatDateTime } from "@/utils/date.util";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Icon, Text, TextInput } from "react-native-paper";

interface ITransactionModalProps {
    readonly userId: string | number;
    readonly setVisibility: (isVisible: boolean) => void;
    readonly refreshTransactionList: () => void;
    readonly transaction?: ITransaction;
}

export default function TransactionModal({ userId, setVisibility, refreshTransactionList, transaction }: ITransactionModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();
    const [type, setType] = useState(transaction ? transaction.type : TransactionType.Debit);
    const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
    const [remark, setRemark] = useState(transaction?.remark ?? "");
    const [txDate, setTxDate] = useState<Date>(() => (transaction?.date ? new Date(transaction.date) : new Date()));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const amountInputRef = useRef<any>(null);

    const isDebit = type === TransactionType.Debit;
    const isFormValid = !!amount && parseFloat(amount) > 0;

    useEffect(() => {
        const timer = setTimeout(() => {
            amountInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    function handleSubmit() {
        if (!isFormValid) return;
        const dateIso = txDate.toISOString();
        if (transaction) {
            DatabaseService.updateTransaction(db, transaction, {
                amount: parseFloat(amount),
                type: type as TransactionType,
                remark,
                date: dateIso,
            });
        } else {
            const numericUserId = typeof userId === "number" ? userId : parseInt(userId, 10);
            DatabaseService.createTransaction(db, numericUserId, parseFloat(amount), type, remark, dateIso);
        }
        setAmount("");
        setRemark("");
        setType(TransactionType.Debit);
        setVisibility(false);
        refreshTransactionList();
    }

    return (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            {/* Header */}
            <View
                style={{
                    paddingTop: 24,
                    paddingBottom: 16,
                    paddingHorizontal: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    marginBottom: 20,
                }}
            >
                <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: "800", marginBottom: 4 }}>
                    {transaction ? "Edit Transaction" : "Add Transaction"}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                    {transaction ? "Modify credit or debit transaction details." : "Record a credit or debit transaction."}
                </Text>
            </View>

            {/* Segmented control — Given / Taken */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <Text
                    variant="labelMedium"
                    style={{
                        color: colors.onSurfaceVariant,
                        marginBottom: 8,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        fontSize: 11,
                        fontWeight: "700",
                    }}
                >
                    Transaction Type
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        backgroundColor: colors.surfaceVariant,
                        borderRadius: 12,
                        padding: 4,
                        borderWidth: 1,
                        borderColor: colors.borderStrong || colors.border,
                    }}
                >
                    {/* Given (Debit - Red) */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 9,
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 6,
                            backgroundColor: isDebit ? colors.danger : "transparent",
                        }}
                        onPress={() => setType(TransactionType.Debit)}
                    >
                        <Text
                            style={{
                                color: isDebit ? colors.onDanger : colors.onSurfaceVariant,
                                fontWeight: isDebit ? "800" : "500",
                                fontSize: 14,
                            }}
                        >
                            ↑ Given
                        </Text>
                    </Pressable>

                    {/* Taken (Credit - Green) */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 9,
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 6,
                            backgroundColor: !isDebit ? colors.success : "transparent",
                        }}
                        onPress={() => setType(TransactionType.Credit)}
                    >
                        <Text
                            style={{
                                color: !isDebit ? colors.onSuccess : colors.onSurfaceVariant,
                                fontWeight: !isDebit ? "800" : "500",
                                fontSize: 14,
                            }}
                        >
                            ↓ Taken
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Amount */}
            <TextInput
                ref={amountInputRef}
                autoFocus
                mode="outlined"
                textColor={colors.onSurface}
                style={{
                    marginHorizontal: 20,
                    marginBottom: 14,
                    backgroundColor: colors.surface,
                }}
                label="Amount"
                value={amount}
                onChangeText={(text) => {
                    if (/^(\d*)\.?(\d){0,2}$/.exec(text)) setAmount(text);
                }}
                keyboardType="numeric"
                left={<TextInput.Affix text="₹" textStyle={{ color: colors.onSurfaceVariant }} />}
                outlineStyle={{ borderRadius: 12, borderColor: colors.borderStrong || colors.border }}
            />

            {/* Date & Time Selector */}
            <View style={{ marginHorizontal: 20, marginBottom: 14 }}>
                <Text
                    variant="labelMedium"
                    style={{
                        color: colors.onSurfaceVariant,
                        marginBottom: 6,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        fontSize: 11,
                        fontWeight: "700",
                    }}
                >
                    Date & Time
                </Text>

                <Pressable
                    onPress={() => setIsDatePickerOpen(true)}
                    style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.borderStrong || colors.border,
                    })}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                backgroundColor: colors.chipAccountBg,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon source="calendar-clock" size={18} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.onSurface }}>{formatDateTime(txDate)}</Text>
                            <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: "600" }}>Tap to customize date or time</Text>
                        </View>
                    </View>

                    <Icon source="pencil-outline" size={18} color={colors.primary} />
                </Pressable>

                {/* Quick preset chips */}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <Pressable
                        onPress={() => setTxDate(new Date())}
                        style={({ pressed }) => ({
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 14,
                            backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                            borderWidth: 1,
                            borderColor: colors.border,
                        })}
                    >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurface }}>Now (Today)</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            const now = new Date();
                            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), now.getMinutes());
                            setTxDate(yesterday);
                        }}
                        style={({ pressed }) => ({
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 14,
                            backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                            borderWidth: 1,
                            borderColor: colors.border,
                        })}
                    >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurface }}>Yesterday</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setIsDatePickerOpen(true)}
                        style={({ pressed }) => ({
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 14,
                            backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                            borderWidth: 1,
                            borderColor: colors.border,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                        })}
                    >
                        <Icon source="dots-horizontal" size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>Custom</Text>
                    </Pressable>
                </View>
            </View>

            {/* Remark */}
            <TextInput
                mode="outlined"
                textColor={colors.onSurface}
                style={{
                    marginHorizontal: 20,
                    marginBottom: 20,
                    backgroundColor: colors.surface,
                }}
                label="Remark (optional)"
                value={remark}
                onChangeText={(text) => setRemark(text)}
                left={<TextInput.Icon icon="text" color={colors.onSurfaceVariant} />}
                outlineStyle={{ borderRadius: 12, borderColor: colors.borderStrong || colors.border }}
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8 }}>
                <Button
                    mode="outlined"
                    style={{ flex: 1, borderRadius: 12, borderColor: colors.borderStrong || colors.border }}
                    labelStyle={{ color: colors.onSurfaceVariant, fontWeight: "700" }}
                    onPress={() => setVisibility(false)}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    buttonColor={isFormValid ? (isDebit ? colors.danger : colors.success) : undefined}
                    disabled={!isFormValid}
                    style={{ flex: 1, borderRadius: 12 }}
                    labelStyle={{
                        color: isFormValid ? (isDebit ? colors.onDanger : colors.onSuccess) : colors.onSurfaceMuted,
                        fontWeight: "700",
                    }}
                    onPress={handleSubmit}
                >
                    Save
                </Button>
            </View>

            {/* Date & Time Picker Modal */}
            <DateTimePickerModal
                isVisible={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                value={txDate}
                onConfirm={(newDate) => setTxDate(newDate)}
                title={transaction ? "Edit Transaction Date & Time" : "Set Transaction Date & Time"}
            />
        </ScrollView>
    );
}
