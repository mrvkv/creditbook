import EmptyState from "@/components/EmptyState";
import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ITransaction } from "@/types/transaction.interface";
import * as React from "react";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Icon, Text } from "react-native-paper";

function formatDate(date: string): string {
    const monthMap: Record<string, string> = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
        "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
    };
    const d = new Date(date);
    const parts = d.toLocaleDateString("en-GB").replace(/\//g, " ").split(" ");
    return `${parts[0]} ${monthMap[parts[1]]} ${parts[2]}`;
}

// ─── Transaction row card ──────────────────────────────────────────────────
const TransactionRow = ({
    transaction,
    onDelete,
}: {
    transaction: ITransaction;
    onDelete: (t: ITransaction) => void;
}) => {
    const { colors, isDark } = useAppTheme();
    const isCredit = transaction.type === TransactionType.Credit;

    const accentColor = isCredit ? colors.success : colors.danger;
    const textColor = isCredit ? colors.successText : colors.dangerText;
    const bgColor = isCredit ? colors.successBg : colors.dangerBg;
    const borderColor = isCredit ? colors.success : colors.danger;
    const typeLabel = isCredit ? "Taken" : "Given";
    const typeIcon = isCredit ? "arrow-down" : "arrow-up";

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                marginHorizontal: 16,
                marginVertical: 5,
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: isDark ? "#000" : "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 4,
                elevation: 1,
            }}
        >
            {/* Left accent bar */}
            <View
                style={{
                    width: 4,
                    alignSelf: "stretch",
                    backgroundColor: accentColor,
                }}
            />

            {/* Type icon */}
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: bgColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                    marginRight: 10,
                    borderWidth: 1,
                    borderColor: borderColor + "50",
                    flexShrink: 0,
                }}
            >
                <Icon source={typeIcon} size={16} color={textColor} />
            </View>

            {/* Content */}
            <View style={{ flex: 1, paddingVertical: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <Text
                        style={{
                            color: textColor,
                            fontWeight: "800",
                            fontSize: 15,
                        }}
                    >
                        ₹{transaction.amount.toLocaleString("en-IN")}
                    </Text>
                    <View
                        style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: bgColor,
                            borderWidth: 1,
                            borderColor: borderColor + "50",
                        }}
                    >
                        <Text style={{ color: textColor, fontSize: 10, fontWeight: "700" }}>
                            {typeLabel}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Icon source="calendar-outline" size={11} color={colors.onSurfaceMuted} />
                        <Text style={{ color: colors.onSurfaceMuted, fontSize: 12 }}>
                            {formatDate(transaction.date)}
                        </Text>
                    </View>

                    {!!transaction.remark && (
                        <>
                            <Text style={{ color: colors.border, fontSize: 12 }}>•</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, flex: 1 }}>
                                <Icon source="text" size={11} color={colors.onSurfaceMuted} />
                                <Text
                                    style={{ color: colors.onSurfaceVariant, fontSize: 12, flex: 1 }}
                                    numberOfLines={1}
                                >
                                    {transaction.remark}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Delete button */}
            <Pressable
                onPress={() => onDelete(transaction)}
                style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? colors.dangerBg : "transparent",
                    marginRight: 8,
                    flexShrink: 0,
                })}
                hitSlop={6}
            >
                <Icon source="trash-can-outline" size={18} color={colors.danger} />
            </Pressable>
        </View>
    );
};

// ─── Main component ─────────────────────────────────────────────────────────
const TransactionTable = ({
    transactions,
    onDelete,
}: {
    transactions: ITransaction[];
    onDelete: (transaction: ITransaction) => void;
}) => {
    const { colors } = useAppTheme();

    const summary = useMemo(() => {
        const given = transactions.filter((t) => t.type === TransactionType.Debit).reduce((s, t) => s + t.amount, 0);
        const taken = transactions.filter((t) => t.type === TransactionType.Credit).reduce((s, t) => s + t.amount, 0);
        const net = taken - given;
        return { given, taken, net };
    }, [transactions]);

    if (!transactions || transactions.length === 0) {
        return (
            <EmptyState
                icon="file-document-outline"
                title="No transactions yet"
                subtitle="Tap the + button to add a transaction"
            />
        );
    }

    const netPositive = summary.net > 0;
    const netColor = summary.net === 0 ? colors.onSurfaceMuted : netPositive ? colors.successText : colors.dangerText;

    return (
        <View style={{ flex: 1 }}>
            {/* Summary bar */}
            <View
                style={{
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: "row",
                    justifyContent: "space-around",
                }}
            >
                <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Given</Text>
                    <Text style={{ color: colors.dangerText, fontWeight: "700", fontSize: 14 }}>
                        ₹{summary.given.toLocaleString("en-IN")}
                    </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Taken</Text>
                    <Text style={{ color: colors.successText, fontWeight: "700", fontSize: 14 }}>
                        ₹{summary.taken.toLocaleString("en-IN")}
                    </Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Net Balance</Text>
                    <Text style={{ color: netColor, fontWeight: "700", fontSize: 14 }}>
                        {summary.net === 0 ? "Settled" : (netPositive ? "+" : "") + `₹${Math.abs(summary.net).toLocaleString("en-IN")}`}
                    </Text>
                </View>
            </View>

            {/* List */}
            <ScrollView
                contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {transactions.map((t) => (
                    <TransactionRow key={t.transactionId} transaction={t} onDelete={onDelete} />
                ))}
            </ScrollView>
        </View>
    );
};

export default TransactionTable;
