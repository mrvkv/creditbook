import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

interface ITransactionModalProps {
    readonly userId: string;
    readonly setVisibility: (isVisible: boolean) => void;
    readonly refreshTransactionList: () => void;
}

export default function TransactionModal({ userId, setVisibility, refreshTransactionList }: ITransactionModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();
    const [type, setType] = useState(TransactionType.Debit);
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const amountInputRef = useRef<any>(null);

    const isDebit = type === TransactionType.Debit;

    useEffect(() => {
        const timer = setTimeout(() => {
            amountInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    function handleSubmit() {
        if (!amount || parseFloat(amount) <= 0) return;
        DatabaseService.createTransaction(db, parseInt(userId), parseFloat(amount), type, remark);
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
                <Text
                    variant="titleLarge"
                    style={{ color: colors.onSurface, fontWeight: "700", marginBottom: 4 }}
                >
                    Add Transaction
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceMuted }}>
                    Record a credit or debit entry.
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
                        borderColor: colors.border,
                    }}
                >
                    {/* Given (Debit) */}
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
                            backgroundColor: isDebit ? colors.dangerBg : "transparent",
                            borderWidth: isDebit ? 1 : 0,
                            borderColor: isDebit ? colors.danger : "transparent",
                        }}
                        onPress={() => setType(TransactionType.Debit)}
                    >
                        <Text
                            style={{
                                color: isDebit ? colors.dangerText : colors.onSurfaceMuted,
                                fontWeight: isDebit ? "700" : "400",
                                fontSize: 14,
                            }}
                        >
                            ↑ Given
                        </Text>
                    </Pressable>

                    {/* Taken (Credit) */}
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
                            backgroundColor: !isDebit ? colors.successBg : "transparent",
                            borderWidth: !isDebit ? 1 : 0,
                            borderColor: !isDebit ? colors.success : "transparent",
                        }}
                        onPress={() => setType(TransactionType.Credit)}
                    >
                        <Text
                            style={{
                                color: !isDebit ? colors.successText : colors.onSurfaceMuted,
                                fontWeight: !isDebit ? "700" : "400",
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
                left={<TextInput.Affix text="₹" />}
                outlineStyle={{ borderRadius: 12 }}
            />

            {/* Remark */}
            <TextInput
                mode="outlined"
                style={{
                    marginHorizontal: 20,
                    marginBottom: 20,
                    backgroundColor: colors.surface,
                }}
                label="Remark (optional)"
                value={remark}
                onChangeText={(text) => setRemark(text)}
                left={<TextInput.Icon icon="text" />}
                outlineStyle={{ borderRadius: 12 }}
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8 }}>
                <Button
                    mode="outlined"
                    style={{ flex: 1, borderRadius: 12, borderColor: colors.border }}
                    labelStyle={{ color: colors.onSurfaceVariant }}
                    onPress={() => setVisibility(false)}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    style={{ flex: 1, borderRadius: 12 }}
                    onPress={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0}
                >
                    Save
                </Button>
            </View>
        </ScrollView>
    );
}
