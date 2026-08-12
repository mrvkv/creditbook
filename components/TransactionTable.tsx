import EmptyState from "@/components/EmptyState";
import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ITransaction } from "@/types/transaction.interface";
import * as React from "react";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Text } from "react-native-paper";

function formatDate(dateStr: string): string {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

export type TabType = "all" | "credit" | "debit";
export type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export interface ITransactionFilter {
    tab: TabType;
    sortBy: SortOption;
}

const SORT_LABELS: Record<SortOption, { label: string; icon: string }> = {
    date_desc: { label: "Newest", icon: "sort-calendar-descending" },
    date_asc: { label: "Oldest", icon: "sort-calendar-ascending" },
    amount_desc: { label: "High Amount", icon: "sort-numeric-descending" },
    amount_asc: { label: "Low Amount", icon: "sort-numeric-ascending" },
};

// ─── Transaction row card ──────────────────────────────────────────────────
const TransactionRow = ({
    transaction,
    onEdit,
    onDelete,
}: {
    transaction: ITransaction;
    onEdit?: (t: ITransaction) => void;
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

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 2, marginRight: 8, flexShrink: 0 }}>
                {onEdit && (
                    <Pressable
                        onPress={() => onEdit(transaction)}
                        style={({ pressed }) => ({
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: pressed ? colors.surfaceVariant : "transparent",
                        })}
                        hitSlop={6}
                    >
                        <Icon source="pencil-outline" size={17} color={colors.primary} />
                    </Pressable>
                )}
                <Pressable
                    onPress={() => onDelete(transaction)}
                    style={({ pressed }) => ({
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: pressed ? colors.dangerBg : "transparent",
                    })}
                    hitSlop={6}
                >
                    <Icon source="trash-can-outline" size={17} color={colors.danger} />
                </Pressable>
            </View>
        </View>
    );
};

// ─── Main component ─────────────────────────────────────────────────────────
const TransactionTable = ({
    transactions,
    onEdit,
    onDelete,
}: {
    transactions: ITransaction[];
    onEdit?: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
}) => {
    const { colors } = useAppTheme();

    // Single unified filter object
    const [filter, setFilter] = useState<ITransactionFilter>({
        tab: "all",
        sortBy: "date_desc",
    });

    const [visibleLimit, setVisibleLimit] = useState(25);

    const summary = useMemo(() => {
        const given = (transactions || []).filter((t) => t.type === TransactionType.Debit).reduce((s, t) => s + t.amount, 0);
        const taken = (transactions || []).filter((t) => t.type === TransactionType.Credit).reduce((s, t) => s + t.amount, 0);
        const net = taken - given;
        return { given, taken, net };
    }, [transactions]);

    // Apply filtering and sorting using the filter object
    const filteredAndSortedTransactions = useMemo(() => {
        let list = [...(transactions || [])];

        // 1. Tab filter
        if (filter.tab === "credit") {
            list = list.filter((t) => t.type === TransactionType.Credit);
        } else if (filter.tab === "debit") {
            list = list.filter((t) => t.type === TransactionType.Debit);
        }

        // 2. Sort order
        list.sort((a, b) => {
            if (filter.sortBy === "date_desc") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (filter.sortBy === "date_asc") {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            } else if (filter.sortBy === "amount_desc") {
                return b.amount - a.amount;
            } else if (filter.sortBy === "amount_asc") {
                return a.amount - b.amount;
            }
            return 0;
        });

        return list;
    }, [transactions, filter]);

    // Paginate 25 items at a time
    const visibleTransactions = useMemo(() => {
        return filteredAndSortedTransactions.slice(0, visibleLimit);
    }, [filteredAndSortedTransactions, visibleLimit]);

    const loadMore = () => {
        if (visibleLimit < filteredAndSortedTransactions.length) {
            setVisibleLimit((prev) => prev + 25);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setFilter((prev) => ({ ...prev, tab }));
        setVisibleLimit(25);
    };

    const cycleSort = () => {
        const sortOptions: SortOption[] = ["date_desc", "date_asc", "amount_desc", "amount_asc"];
        const currentIndex = sortOptions.indexOf(filter.sortBy);
        const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
        setFilter((prev) => ({ ...prev, sortBy: nextSort }));
        setVisibleLimit(25);
    };

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

            {/* Filter & Sort Bar */}
            <View
                style={{
                    backgroundColor: colors.surfaceVariant,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        gap: 12,
                        minWidth: "100%",
                    }}
                >
                    {/* 3 Tabs: All, Taken (Credit), Given (Debit) */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                        {(["all", "credit", "debit"] as TabType[]).map((tabKey) => {
                            const active = filter.tab === tabKey;
                            const label = tabKey === "all" ? "All" : tabKey === "credit" ? "Taken" : "Given";
                            const activeColor =
                                tabKey === "credit" ? colors.successText : tabKey === "debit" ? colors.dangerText : colors.primary;
                            const activeBg =
                                tabKey === "credit" ? colors.successBg : tabKey === "debit" ? colors.dangerBg : colors.chipAccountBg;
                            const activeBorder =
                                tabKey === "credit" ? colors.success : tabKey === "debit" ? colors.danger : colors.primary;

                            return (
                                <Pressable
                                    key={tabKey}
                                    onPress={() => handleTabChange(tabKey)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        backgroundColor: active ? activeBg : colors.surface,
                                        borderWidth: 1,
                                        borderColor: active ? activeBorder : colors.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: active ? "700" : "500",
                                            color: active ? activeColor : colors.onSurfaceVariant,
                                        }}
                                    >
                                        {label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Sort Toggle Button */}
                    <Pressable
                        onPress={cycleSort}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 16,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        <Icon source={SORT_LABELS[filter.sortBy].icon} size={14} color={colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.onSurface }}>
                            {SORT_LABELS[filter.sortBy].label}
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>

            {/* List with 25-item incremental loading */}
            {filteredAndSortedTransactions.length === 0 ? (
                <EmptyState
                    icon="filter-remove-outline"
                    title="No matching transactions"
                    subtitle="Try switching tabs or changing sort options"
                />
            ) : (
                <FlatList
                    data={visibleTransactions}
                    keyExtractor={(t) => t.transactionId.toString()}
                    renderItem={({ item: t }) => (
                        <TransactionRow transaction={t} onEdit={onEdit} onDelete={onDelete} />
                    )}
                    contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={25}
                    maxToRenderPerBatch={25}
                    windowSize={5}
                />
            )}
        </View>
    );
};

export default TransactionTable;
