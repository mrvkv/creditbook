import ConfirmationModal from "@/components/ConfirmationModal";
import EmptyState from "@/components/EmptyState";
import HeaderLeft from "@/components/HeaderLeft";
import { GlobalTimelineHeaderTitle } from "@/components/HeaderTitle";
import Modal from "@/components/Modal";
import TransactionModal from "@/components/TransactionModal";
import { TransactionType } from "@/enums/transaction.enum";
import { ThemeContext, useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { ITransaction } from "@/types/transaction.interface";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BackHandler, FlatList, Pressable, ScrollView, View } from "react-native";
import { Chip, Icon, Portal, Text, TextInput } from "react-native-paper";

export type TimelineFilterTab = "all" | "credit" | "debit" | "settled";

const dateLabelCache = new Map<string, string>();
const timeCache = new Map<string, string>();

function formatDateLabel(dateStr: string): string {
    const key = dateStr.substring(0, 10);
    if (dateLabelCache.has(key)) return dateLabelCache.get(key)!;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let res = "";
    if (itemDate.getTime() === today.getTime()) {
        res = "Today";
    } else if (itemDate.getTime() === yesterday.getTime()) {
        res = "Yesterday";
    } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        res = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    dateLabelCache.set(key, res);
    return res;
}

function formatTime(dateStr: string): string {
    if (timeCache.has(dateStr)) return timeCache.get(dateStr)!;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const res = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    timeCache.set(dateStr, res);
    return res;
}

// ─── Summary Chip matching Home Screen ──────────────────────────────────────
const SummaryChip = ({
    icon,
    label,
    value,
    bgColor,
    textColor,
    borderColor,
    isSelected,
    onPress,
}: {
    icon: string;
    label: string;
    value: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    isSelected: boolean;
    onPress: () => void;
}) => {
    const { colors } = useAppTheme();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isSelected ? bgColor : colors.surface,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? borderColor : colors.border,
                opacity: pressed ? 0.8 : 1,
                gap: 6,
            })}
        >
            <Icon source={icon} size={14} color={isSelected ? textColor : colors.onSurfaceMuted} />
            <Text style={{ color: isSelected ? textColor : colors.onSurfaceVariant, fontSize: 12, fontWeight: isSelected ? "800" : "500" }}>
                {label}{value ? `: ${value}` : ""}
            </Text>
        </Pressable>
    );
};

export default function TransactionsTimeline() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const appTheme = useAppTheme();
    const { colors, isDark, toggleTheme } = appTheme;

    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<TimelineFilterTab>("all");

    // Modal state for Edit / Delete
    const [isVisible, setIsVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<ITransaction>();

    const navigateToHome = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    }, [router]);

    useEffect(() => {
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            navigateToHome();
            return true;
        });
        return () => subscription.remove();
    }, [navigateToHome]);

    const refreshTimeline = useCallback(() => {
        setTransactions(DatabaseService.getAllTransactions(db));
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            refreshTimeline();
        }, [refreshTimeline])
    );

    useLayoutEffect(() => {
        const headerLeft = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderLeft handler={navigateToHome} />
            </ThemeContext.Provider>
        );
        const headerTitle = () => (
            <ThemeContext.Provider value={appTheme}>
                <GlobalTimelineHeaderTitle />
            </ThemeContext.Provider>
        );
        const headerRight = () => (
            <ThemeContext.Provider value={appTheme}>
                <View style={{ flexDirection: "row", alignItems: "center", marginRight: 4 }}>
                    <Pressable
                        onPress={toggleTheme}
                        hitSlop={8}
                        style={({ pressed }) => ({
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                        })}
                    >
                        <Icon
                            source={isDark ? "weather-sunny" : "weather-night"}
                            size={20}
                            color={colors.headerText}
                        />
                    </Pressable>
                </View>
            </ThemeContext.Provider>
        );
        navigation.setOptions({
            headerLeft,
            headerTitle,
            headerRight,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
        });
    }, [appTheme, navigateToHome, toggleTheme, isDark, colors]);

    // Statistics memo
    const stats = useMemo(() => {
        const totalCount = transactions.length;
        const receivable = transactions.filter((t) => t.type === TransactionType.Credit && t.isSettled !== 1).reduce((s, t) => s + t.amount, 0);
        const payable = transactions.filter((t) => t.type === TransactionType.Debit && t.isSettled !== 1).reduce((s, t) => s + t.amount, 0);
        const settledCount = transactions.filter((t) => t.isSettled === 1).length;
        return { totalCount, receivable, payable, settledCount };
    }, [transactions]);

    useEffect(() => {
        if (stats.settledCount === 0 && activeFilter === "settled") {
            setActiveFilter("all");
        }
        if (stats.receivable === 0 && activeFilter === "credit") {
            setActiveFilter("all");
        }
        if (stats.payable === 0 && activeFilter === "debit") {
            setActiveFilter("all");
        }
    }, [stats.settledCount, stats.receivable, stats.payable, activeFilter]);

    // Filter & Search Logic
    const filteredList = useMemo(() => {
        let list = [...transactions];

        if (activeFilter === "credit") {
            list = list.filter((t) => t.type === TransactionType.Credit && t.isSettled !== 1);
        } else if (activeFilter === "debit") {
            list = list.filter((t) => t.type === TransactionType.Debit && t.isSettled !== 1);
        } else if (activeFilter === "settled") {
            list = list.filter((t) => t.isSettled === 1);
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (t) =>
                    (t.userName && t.userName.toLowerCase().includes(q)) ||
                    (t.remark && t.remark.toLowerCase().includes(q)) ||
                    t.amount.toString().includes(q)
            );
        }

        return list;
    }, [transactions, activeFilter, searchQuery]);

    // Grouping by Date Label
    const groupedData = useMemo(() => {
        const groups: { dateLabel: string; data: ITransaction[] }[] = [];
        let currentLabel = "";
        let currentGroup: ITransaction[] = [];

        filteredList.forEach((t) => {
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

        // Flatten for rendering with section headers
        const items: ({ type: "header"; label: string } | { type: "item"; item: ITransaction })[] = [];
        groups.forEach((g) => {
            items.push({ type: "header", label: g.dateLabel });
            g.data.forEach((item) => items.push({ type: "item", item }));
        });
        return items;
    }, [filteredList]);

    const [visibleLimit, setVisibleLimit] = useState(25);

    const visibleGroupedData = useMemo(() => {
        return groupedData.slice(0, visibleLimit);
    }, [groupedData, visibleLimit]);

    const loadMore = () => {
        if (visibleLimit < groupedData.length) {
            setVisibleLimit((prev) => prev + 25);
        }
    };

    function handleEdit(transaction: ITransaction) {
        setSelectedTransaction(transaction);
        setIsDelete(false);
        setIsEdit(true);
        setIsVisible(true);
    }

    function handleDelete(transaction: ITransaction) {
        setSelectedTransaction(transaction);
        setIsEdit(false);
        setIsDelete(true);
        setIsVisible(true);
    }

    function confirmDeleteTransaction() {
        if (selectedTransaction) {
            DatabaseService.deleteTransaction(db, selectedTransaction);
            refreshTimeline();
        }
        setIsVisible(false);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
                <ThemeContext.Provider value={appTheme}>
                    {isEdit && selectedTransaction && (
                        <Modal isVisible={isVisible} setVisibility={setIsVisible}>
                            <TransactionModal
                                refreshTransactionList={refreshTimeline}
                                setVisibility={setIsVisible}
                                userId={selectedTransaction.userId}
                                transaction={selectedTransaction}
                            />
                        </Modal>
                    )}
                    {isDelete && selectedTransaction && (
                        <ConfirmationModal
                            title="Delete Transaction"
                            message="Are you sure you want to delete this transaction entry? This will update the user's ledger balance."
                            setIsVisible={setIsVisible}
                            onSubmit={confirmDeleteTransaction}
                            onCancel={() => setIsVisible(false)}
                            isVisible={isVisible}
                        />
                    )}
                </ThemeContext.Provider>
            </Portal>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, backgroundColor: colors.surface }}>
                <TextInput
                    mode="outlined"
                    placeholder="Search by account name or remark..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    dense
                    left={<TextInput.Icon icon="magnify" color={colors.onSurfaceMuted} />}
                    right={
                        searchQuery ? (
                            <TextInput.Icon icon="close-circle" color={colors.onSurfaceMuted} onPress={() => setSearchQuery("")} />
                        ) : null
                    }
                    outlineStyle={{ borderRadius: 12, borderColor: colors.border }}
                    contentStyle={{ fontSize: 13 }}
                    style={{ backgroundColor: colors.surface }}
                />
            </View>

            {/* Summary & Filter Bar matching Home Screen */}
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
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        gap: 8,
                    }}
                >
                    <SummaryChip
                        icon="swap-horizontal"
                        label="Transactions"
                        value={String(stats.totalCount)}
                        bgColor={colors.chipAccountBg}
                        textColor={colors.primary}
                        borderColor={colors.primary}
                        isSelected={activeFilter === "all"}
                        onPress={() => setActiveFilter("all")}
                    />
                    {stats.receivable > 0 && (
                        <SummaryChip
                            icon="arrow-down-bold-circle-outline"
                            label="Receivable"
                            value={`₹${stats.receivable.toLocaleString("en-IN")}`}
                            bgColor={colors.successBg}
                            textColor={colors.successText}
                            borderColor={colors.success}
                            isSelected={activeFilter === "credit"}
                            onPress={() => setActiveFilter("credit")}
                        />
                    )}
                    {stats.payable > 0 && (
                        <SummaryChip
                            icon="arrow-up-bold-circle-outline"
                            label="Payable"
                            value={`₹${stats.payable.toLocaleString("en-IN")}`}
                            bgColor={colors.dangerBg}
                            textColor={colors.dangerText}
                            borderColor={colors.danger}
                            isSelected={activeFilter === "debit"}
                            onPress={() => setActiveFilter("debit")}
                        />
                    )}
                    {stats.settledCount > 0 && (
                        <SummaryChip
                            icon="check-circle-outline"
                            label="Settled"
                            value={String(stats.settledCount)}
                            bgColor={colors.settledBg}
                            textColor={colors.onSurfaceMuted}
                            borderColor={colors.border}
                            isSelected={activeFilter === "settled"}
                            onPress={() => setActiveFilter("settled")}
                        />
                    )}
                </ScrollView>
            </View>

            {/* List Content */}
            {groupedData.length === 0 ? (
                <EmptyState
                    icon="receipt-text-clock-outline"
                    title="No transactions found"
                    subtitle={searchQuery ? `No transactions match "${searchQuery}"` : "No entries in your global timeline."}
                />
            ) : (
                <FlatList
                    data={visibleGroupedData}
                    keyExtractor={(item, index) => (item.type === "header" ? `header-${item.label}-${index}` : `tx-${item.item.transactionId}`)}
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

                        const t = item.item;
                        const isCredit = t.type === TransactionType.Credit;
                        const isSettled = t.isSettled === 1;

                        const accentColor = isSettled ? colors.settledText : isCredit ? colors.success : colors.danger;
                        const textColor = isSettled ? colors.settledText : isCredit ? colors.successText : colors.dangerText;
                        const bgColor = isSettled ? colors.settledBg : isCredit ? colors.successBg : colors.dangerBg;
                        const borderColor = isSettled ? colors.borderStrong || colors.border : isCredit ? colors.success : colors.danger;

                        return (
                            <Pressable
                                onPress={() => handleEdit(t)}
                                style={({ pressed }) => ({
                                    backgroundColor: colors.surface,
                                    marginHorizontal: 16,
                                    marginVertical: 4,
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    opacity: pressed ? 0.85 : 1,
                                    padding: 12,
                                    gap: 10,
                                })}
                            >
                                {/* Top Header Line: User Badge on Left + Time on Right */}
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <Pressable
                                        onPress={(e) => {
                                            e?.stopPropagation?.();
                                            router.push({ pathname: "/details", params: { userId: t.userId } });
                                        }}
                                        hitSlop={6}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            backgroundColor: pressed ? colors.primary + "30" : colors.primary + "14",
                                            paddingHorizontal: 8,
                                            paddingVertical: 3,
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: colors.primary + "30",
                                            gap: 5,
                                        })}
                                    >
                                        <View
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 8,
                                                backgroundColor: colors.primary,
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Text style={{ fontSize: 9, fontWeight: "900", color: "#FFFFFF" }}>
                                                {(t.userName || "U").charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 11, fontWeight: "800", color: colors.primary }}>
                                            {t.userName || `User #${t.userId}`}
                                        </Text>
                                        <Icon source="chevron-right" size={12} color={colors.primary} />
                                    </Pressable>

                                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.onSurfaceVariant }}>
                                        {formatTime(t.date)}
                                    </Text>
                                </View>

                                {/* Bottom Body Line: Type Icon + Remark on Left, Amount + Delete on Right */}
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
                                            <Text style={{ fontSize: 14, fontWeight: "800", color: textColor }}>
                                                ₹{t.amount.toLocaleString("en-IN")}
                                            </Text>
                                            <Text style={{ fontSize: 10, fontWeight: "700", color: textColor }}>
                                                {isSettled ? "Settled" : isCredit ? "Got" : "Gave"}
                                            </Text>
                                        </View>

                                        <Pressable
                                            onPress={(e) => {
                                                e?.stopPropagation?.();
                                                handleDelete(t);
                                            }}
                                            hitSlop={8}
                                            style={({ pressed }) => ({
                                                padding: 6,
                                                borderRadius: 8,
                                                backgroundColor: pressed ? colors.dangerBg : "transparent",
                                            })}
                                        >
                                            <Icon source="delete-outline" size={18} color={colors.onSurfaceMuted} />
                                        </Pressable>
                                    </View>
                                </View>
                            </Pressable>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 32 }}
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
}
