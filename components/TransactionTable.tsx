import EmptyState from "@/components/EmptyState";
import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ITransaction } from "@/types/transaction.interface";
import { formatDateLabel, formatTime } from "@/utils/date.util";
import * as React from "react";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Text } from "react-native-paper";

export type TabType = "all" | "credit" | "debit";
export type StatusFilter = "active" | "settled" | "all";
export type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export interface ITransactionFilter {
    status: StatusFilter;
    tab: TabType;
    sortBy: SortOption;
}

const SORT_LABELS: Record<SortOption, { label: string; icon: string }> = {
    date_desc: { label: "Newest", icon: "sort-calendar-descending" },
    date_asc: { label: "Oldest", icon: "sort-calendar-ascending" },
    amount_desc: { label: "High Amount", icon: "sort-numeric-descending" },
    amount_asc: { label: "Low Amount", icon: "sort-numeric-ascending" },
};

// ─── Transaction Card Component (Identical to Global Timeline styling) ───────
const TransactionRow = ({
    transaction: t,
    onEdit,
    onDelete,
}: {
    transaction: ITransaction;
    onEdit?: (t: ITransaction) => void;
    onDelete: (t: ITransaction) => void;
}) => {
    const { colors } = useAppTheme();
    const isCredit = t.type === TransactionType.Credit;
    const isSettled = t.isSettled === 1;

    const textColor = isSettled ? colors.settledText : isCredit ? colors.successText : colors.dangerText;
    const bgColor = isSettled ? colors.settledBg : isCredit ? colors.successBg : colors.dangerBg;
    const borderColor = isSettled ? colors.borderStrong || colors.border : isCredit ? colors.success : colors.danger;

    const timeString = formatTime(t.date);
    const dateLabel = formatDateLabel(t.date);
    const dateDisplay = timeString ? `${dateLabel} • ${timeString}` : dateLabel;

    return (
        <Pressable
            onPress={() => !isSettled && onEdit?.(t)}
            style={({ pressed }) => ({
                backgroundColor: colors.surface,
                marginHorizontal: 16,
                marginVertical: 4,
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed && !isSettled ? 0.85 : 1,
                padding: 12,
                gap: 10,
            })}
        >
            {/* Top Line: Date/Time on Left + Settled Badge on Right */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceVariant }}>
                    {dateDisplay}
                </Text>
                {isSettled && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                            backgroundColor: colors.settledBg,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.borderStrong || colors.border,
                        }}
                    >
                        <Icon source="check-circle" size={11} color={colors.settledText} />
                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.settledText }}>
                            Settled
                        </Text>
                    </View>
                )}
            </View>

            {/* Bottom Line: Icon + Remark on Left, Amount + Type + Action Buttons on Right */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 }}>
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: bgColor,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: borderColor + "50",
                        }}
                    >
                        <Icon
                            source={isSettled ? "check-all" : isCredit ? "arrow-down" : "arrow-up"}
                            size={16}
                            color={textColor}
                        />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface, flex: 1 }} numberOfLines={1}>
                        {t.remark || (isCredit ? "Credit Entry" : "Debit Entry")}
                    </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: "800",
                                color: textColor,
                                textDecorationLine: isSettled ? "line-through" : "none",
                            }}
                        >
                            ₹{t.amount.toLocaleString("en-IN")}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: textColor }}>
                            {isSettled ? "Settled" : isCredit ? "Got" : "Gave"}
                        </Text>
                    </View>

                    {!isSettled && onEdit && (
                        <Pressable
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                onEdit(t);
                            }}
                            hitSlop={8}
                            style={({ pressed }) => ({
                                padding: 6,
                                borderRadius: 8,
                                backgroundColor: pressed ? colors.surfaceVariant : "transparent",
                            })}
                        >
                            <Icon source="pencil-outline" size={18} color={colors.primary} />
                        </Pressable>
                    )}

                    {!isSettled && (
                        <Pressable
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                onDelete(t);
                            }}
                            hitSlop={8}
                            style={({ pressed }) => ({
                                padding: 6,
                                borderRadius: 8,
                                backgroundColor: pressed ? colors.dangerBg : "transparent",
                            })}
                        >
                            <Icon source="trash-can-outline" size={18} color={colors.onSurfaceMuted} />
                        </Pressable>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const TransactionTable = ({
    transactions,
    onEdit,
    onDelete,
    onSettleAccount,
    onExportStatement,
}: {
    transactions: ITransaction[];
    onEdit?: (transaction: ITransaction) => void;
    onDelete: (transaction: ITransaction) => void;
    onSettleAccount?: () => void;
    onExportStatement?: () => void;
}) => {
    const { colors } = useAppTheme();

    const [filter, setFilter] = useState<ITransactionFilter>({
        status: "active",
        tab: "all",
        sortBy: "date_desc",
    });

    const [visibleLimit, setVisibleLimit] = useState(25);

    // Summary calculation (active transactions)
    const summary = useMemo(() => {
        const activeTxList = (transactions || []).filter((t) => t.isSettled !== 1);
        const given = activeTxList.filter((t) => t.type === TransactionType.Debit).reduce((s, t) => s + t.amount, 0);
        const taken = activeTxList.filter((t) => t.type === TransactionType.Credit).reduce((s, t) => s + t.amount, 0);
        const net = taken - given;
        return { given, taken, net, activeCount: activeTxList.length };
    }, [transactions]);

    const counts = useMemo(() => {
        const total = transactions?.length || 0;
        const active = (transactions || []).filter((t) => t.isSettled !== 1).length;
        const settled = total - active;
        return { active, settled, total };
    }, [transactions]);

    // Filtering and Sorting logic
    const filteredAndSortedTransactions = useMemo(() => {
        let list = [...(transactions || [])];

        // 1. Status filter (Active vs Settled vs All)
        if (filter.status === "active") {
            list = list.filter((t) => t.isSettled !== 1);
        } else if (filter.status === "settled") {
            list = list.filter((t) => t.isSettled === 1);
        }

        // 2. Type Tab filter
        if (filter.tab === "credit") {
            list = list.filter((t) => t.type === TransactionType.Credit);
        } else if (filter.tab === "debit") {
            list = list.filter((t) => t.type === TransactionType.Debit);
        }

        // 3. Sort order
        list.sort((a, b) => {
            if (filter.sortBy === "date_desc") {
                const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
                return diff !== 0 ? diff : b.transactionId - a.transactionId;
            } else if (filter.sortBy === "date_asc") {
                const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
                return diff !== 0 ? diff : a.transactionId - b.transactionId;
            } else if (filter.sortBy === "amount_desc") {
                const diff = b.amount - a.amount;
                return diff !== 0 ? diff : new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (filter.sortBy === "amount_asc") {
                const diff = a.amount - b.amount;
                return diff !== 0 ? diff : new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return 0;
        });

        return list;
    }, [transactions, filter]);

    // Group items by date headers when sorting by date
    const groupedData = useMemo(() => {
        const isDateSort = filter.sortBy === "date_desc" || filter.sortBy === "date_asc";
        if (!isDateSort) {
            return filteredAndSortedTransactions.map((item) => ({ type: "item" as const, item }));
        }

        const groups: { dateLabel: string; data: ITransaction[] }[] = [];
        let currentLabel = "";
        let currentGroup: ITransaction[] = [];

        filteredAndSortedTransactions.forEach((t) => {
            const label = formatDateLabel(t.date);
            if (label !== currentLabel) {
                if (currentGroup.length > 0) {
                    groups.push({ dateLabel: currentLabel, data: currentGroup });
                }
                currentLabel = label;
                currentGroup = [t];
            } else {
                currentGroup.push(t);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ dateLabel: currentLabel, data: currentGroup });
        }

        const items: ({ type: "header"; label: string } | { type: "item"; item: ITransaction })[] = [];
        groups.forEach((g) => {
            items.push({ type: "header", label: g.dateLabel });
            g.data.forEach((item) => items.push({ type: "item", item }));
        });
        return items;
    }, [filteredAndSortedTransactions, filter.sortBy]);

    const visibleItems = useMemo(() => {
        return groupedData.slice(0, visibleLimit);
    }, [groupedData, visibleLimit]);

    const loadMore = () => {
        if (visibleLimit < groupedData.length) {
            setVisibleLimit((prev) => prev + 25);
        }
    };

    const handleStatusChange = (status: StatusFilter) => {
        setFilter((prev) => ({ ...prev, status }));
        setVisibleLimit(25);
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
            {/* Summary Bar */}
            <View
                style={{
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-around",
                        alignItems: "center",
                    }}
                >
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Given</Text>
                        <Text style={{ color: colors.dangerText, fontWeight: "700", fontSize: 14 }}>
                            ₹{summary.given.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Taken</Text>
                        <Text style={{ color: colors.successText, fontWeight: "700", fontSize: 14 }}>
                            ₹{summary.taken.toLocaleString("en-IN")}
                        </Text>
                    </View>
                    <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ color: colors.onSurfaceMuted, fontSize: 11, marginBottom: 2 }}>Net Balance</Text>
                        <Text style={{ color: netColor, fontWeight: "700", fontSize: 14 }}>
                            {summary.net === 0 ? "Settled" : (netPositive ? "+" : "") + `₹${Math.abs(summary.net).toLocaleString("en-IN")}`}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons: Settle Up and PDF Statement */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    {onSettleAccount && counts.active > 0 && (
                        <Pressable
                            onPress={onSettleAccount}
                            style={({ pressed }) => ({
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                backgroundColor: pressed ? colors.successBg : colors.surfaceVariant,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.success + "60",
                            })}
                        >
                            <Icon source="check-all" size={16} color={colors.successText} />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.successText }}>
                                Settle Up
                            </Text>
                        </Pressable>
                    )}

                    {onExportStatement && transactions.length > 0 && (
                        <Pressable
                            onPress={onExportStatement}
                            style={({ pressed }) => ({
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.primary + "50",
                            })}
                        >
                            <Icon source="file-pdf-box" size={18} color={colors.primary} />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                                Statement (PDF)
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Status Tabs Bar (Active vs Settled History vs All) */}
            <View
                style={{
                    backgroundColor: colors.surface,
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
                        paddingLeft: 16,
                        paddingRight: 24,
                        paddingVertical: 6,
                        gap: 8,
                    }}
                >
                    {(["active", "settled", "all"] as StatusFilter[]).map((statusKey) => {
                        const active = filter.status === statusKey;
                        const count = statusKey === "active" ? counts.active : statusKey === "settled" ? counts.settled : counts.total;
                        const label = statusKey === "active" ? "Active" : statusKey === "settled" ? "Settled History" : "All Entries";

                        return (
                            <Pressable
                                key={statusKey}
                                onPress={() => handleStatusChange(statusKey)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 16,
                                    backgroundColor: active ? colors.primary + "18" : "transparent",
                                    borderWidth: 1,
                                    borderColor: active ? colors.primary : colors.border,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: active ? "700" : "500",
                                        color: active ? colors.primary : colors.onSurfaceVariant,
                                    }}
                                >
                                    {label}
                                </Text>
                                <View
                                    style={{
                                        paddingHorizontal: 5,
                                        paddingVertical: 1,
                                        borderRadius: 8,
                                        backgroundColor: active ? colors.primary : colors.surfaceVariant,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: "700",
                                            color: active ? colors.onPrimary : colors.onSurfaceMuted,
                                        }}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Sub-Filter (Taken/Given) & Sort Bar */}
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
                        paddingLeft: 16,
                        paddingRight: 24,
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
                            marginRight: 4,
                        }}
                    >
                        <Icon source={SORT_LABELS[filter.sortBy].icon} size={14} color={colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.onSurface }}>
                            {SORT_LABELS[filter.sortBy].label}
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>

            {/* List Content */}
            {filteredAndSortedTransactions.length === 0 ? (
                <EmptyState
                    icon="filter-remove-outline"
                    title={
                        filter.status === "active"
                            ? "No active transactions"
                            : filter.status === "settled"
                            ? "No settled history"
                            : "No matching transactions"
                    }
                    subtitle={
                        filter.status === "active"
                            ? "Account has no open entries. View Settled History tab for past entries."
                            : "Try switching filters or changing sort options"
                    }
                />
            ) : (
                <FlatList
                    data={visibleItems}
                    keyExtractor={(item, index) =>
                        item.type === "header" ? `header-${item.label}-${index}` : `tx-${item.item.transactionId}`
                    }
                    renderItem={({ item }) => {
                        if (item.type === "header") {
                            return (
                                <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "800", color: colors.onSurfaceVariant, letterSpacing: 0.5 }}>
                                        {item.label}
                                    </Text>
                                </View>
                            );
                        }
                        return <TransactionRow transaction={item.item} onEdit={onEdit} onDelete={onDelete} />;
                    }}
                    contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={25}
                    maxToRenderPerBatch={25}
                    windowSize={5}
                    ListFooterComponent={
                        filter.status === "active" && counts.settled > 0 ? (
                            <Pressable
                                onPress={() => handleStatusChange("settled")}
                                style={{
                                    marginHorizontal: 16,
                                    marginTop: 12,
                                    marginBottom: 16,
                                    paddingVertical: 10,
                                    paddingHorizontal: 14,
                                    borderRadius: 12,
                                    backgroundColor: colors.surfaceVariant,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
                            >
                                <Icon source="history" size={16} color={colors.primary} />
                                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                                    View Settled History ({counts.settled} past entries)
                                </Text>
                            </Pressable>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

export default TransactionTable;
