import EmptyState from "@/components/EmptyState";
import { useAppTheme } from "@/hooks/useAppTheme";
import { IUser } from "@/types/user.interface";
import * as React from "react";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";

export type UserFilterTab = "all" | "receivable" | "payable" | "settled";

// ─── Summary chip ──────────────────────────────────────────────────────────
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

// ─── User row card ─────────────────────────────────────────────────────────
const UserRow = ({
    user,
    onView,
    onEdit,
    onDelete,
}: {
    user: IUser;
    onView: (u: IUser) => void;
    onEdit: (u: IUser) => void;
    onDelete: (u: IUser) => void;
}) => {
    const { colors, isDark } = useAppTheme();
    const isSettled = user.balance === 0;
    const isReceivable = user.balance < 0;

    const balanceColor = isSettled ? colors.onSurfaceMuted : isReceivable ? colors.successText : colors.dangerText;
    const balanceBg = isSettled ? colors.settledBg : isReceivable ? colors.successBg : colors.dangerBg;
    const balanceBorder = isSettled ? colors.border : isReceivable ? colors.success : colors.danger;
    const balanceLabel = isSettled ? "Settled" : isReceivable ? "Receivable" : "Payable";
    const displayAmount = `₹${Math.abs(user.balance).toLocaleString("en-IN")}`;

    // Avatar initials
    const initials =
        user.name
            .trim()
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .join("")
            .substring(0, 2)
            .toUpperCase() || "?";

    return (
        <Pressable
            onPress={() => onView(user)}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                marginHorizontal: 16,
                marginVertical: 5,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: isDark ? "#000" : "#6366F1",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.07,
                shadowRadius: 6,
                elevation: 2,
            })}
        >
            {/* Avatar */}
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.chipAccountBg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: colors.primary + "40",
                    marginRight: 12,
                }}
            >
                <Text
                    style={{
                        color: colors.primary,
                        fontWeight: "800",
                        fontSize: 16,
                    }}
                >
                    {initials}
                </Text>
            </View>

            {/* Name + label */}
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.onSurface,
                        fontWeight: "700",
                        fontSize: 15,
                        marginBottom: 2,
                    }}
                    numberOfLines={1}
                >
                    {user.name}
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isSettled ? colors.onSurfaceMuted : isReceivable ? colors.success : colors.danger,
                        }}
                    />
                    <Text style={{ color: colors.onSurfaceMuted, fontSize: 12 }}>{balanceLabel}</Text>
                </View>
            </View>

            {/* Balance badge */}
            <View
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                    backgroundColor: balanceBg,
                    borderWidth: 1,
                    borderColor: balanceBorder,
                    marginRight: 8,
                }}
            >
                <Text style={{ color: balanceColor, fontWeight: "700", fontSize: 13 }}>
                    {isSettled ? "Settled" : displayAmount}
                </Text>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 2 }}>
                <Pressable
                    onPress={() => onEdit(user)}
                    style={({ pressed }) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: pressed ? colors.surfaceVariant : "transparent",
                    })}
                    hitSlop={6}
                >
                    <Icon source="pencil-outline" size={17} color={colors.primary} />
                </Pressable>
                <Pressable
                    onPress={() => onDelete(user)}
                    style={({ pressed }) => ({
                        width: 32,
                        height: 32,
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
        </Pressable>
    );
};

// ─── Main component ─────────────────────────────────────────────────────────
const UserTable = ({
    users,
    onDelete,
    onView,
    onEdit,
}: {
    users: IUser[];
    onDelete: (user: IUser) => void;
    onView: (user: IUser) => void;
    onEdit: (user: IUser) => void;
}) => {
    const { colors } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<UserFilterTab>("all");
    const [visibleLimit, setVisibleLimit] = useState(25);

    const totals = useMemo(() => {
        const receivable = users?.filter((u) => u.balance < 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const payable = users?.filter((u) => u.balance > 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const count = users?.length || 0;
        const settled = users?.filter((u) => u.balance === 0).length || 0;
        return { receivable, payable, count, settled };
    }, [users]);

    // Apply filter tab and search query
    const filteredUsers = useMemo(() => {
        let list = [...(users || [])];

        // Filter tab
        if (filterTab === "receivable") {
            list = list.filter((u) => u.balance < 0);
        } else if (filterTab === "payable") {
            list = list.filter((u) => u.balance > 0);
        } else if (filterTab === "settled") {
            list = list.filter((u) => u.balance === 0);
        }

        // Search query
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter((u) => u.name.toLowerCase().includes(q));
        }

        return list;
    }, [users, filterTab, searchQuery]);

    const visibleUsers = useMemo(() => {
        return filteredUsers.slice(0, visibleLimit);
    }, [filteredUsers, visibleLimit]);

    const loadMore = () => {
        if (visibleLimit < filteredUsers.length) {
            setVisibleLimit((prev) => prev + 25);
        }
    };

    const handleTabChange = (tab: UserFilterTab) => {
        setFilterTab((prev) => (prev === tab && tab !== "all" ? "all" : tab));
        setVisibleLimit(25);
    };

    React.useEffect(() => {
        if (totals.settled === 0 && filterTab === "settled") {
            setFilterTab("all");
        }
    }, [totals.settled, filterTab]);

    if (!users || users.length === 0) {
        return <EmptyState icon="account-off-outline" title="No accounts found" subtitle="Tap the + button to add your first account" />;
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Search Input Bar */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, backgroundColor: colors.surface }}>
                <TextInput
                    mode="outlined"
                    placeholder="Search accounts by name..."
                    value={searchQuery}
                    onChangeText={(text) => {
                        if (text.trim() && !searchQuery.trim()) {
                            // Auto-switch to "All" tab when user starts typing a search query
                            setFilterTab("all");
                        }
                        setSearchQuery(text);
                        setVisibleLimit(25);
                    }}
                    dense
                    style={{
                        backgroundColor: colors.background,
                        fontSize: 14,
                    }}
                    left={<TextInput.Icon icon="magnify" color={colors.onSurfaceMuted} />}
                    right={
                        searchQuery ? (
                            <TextInput.Icon
                                icon="close"
                                color={colors.onSurfaceMuted}
                                onPress={() => {
                                    setSearchQuery("");
                                    setVisibleLimit(25);
                                }}
                            />
                        ) : null
                    }
                    outlineStyle={{ borderRadius: 12, borderColor: colors.border }}
                    activeOutlineColor={colors.primary}
                />
            </View>

            {/* Summary & Filter Bar */}
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
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        gap: 8,
                        alignItems: "center",
                    }}
                >
                    <SummaryChip
                        icon="account-group"
                        label="All"
                        value={totals.count.toString()}
                        bgColor={colors.chipAccountBg}
                        textColor={colors.chipAccountText}
                        borderColor={colors.primary}
                        isSelected={filterTab === "all"}
                        onPress={() => handleTabChange("all")}
                    />
                    {totals.receivable > 0 && (
                        <SummaryChip
                            icon="arrow-down-circle"
                            label="Receivable"
                            value={`₹${totals.receivable.toLocaleString("en-IN")}`}
                            bgColor={colors.successBg}
                            textColor={colors.successText}
                            borderColor={colors.success}
                            isSelected={filterTab === "receivable"}
                            onPress={() => handleTabChange("receivable")}
                        />
                    )}
                    {totals.payable > 0 && (
                        <SummaryChip
                            icon="arrow-up-circle"
                            label="Payable"
                            value={`₹${totals.payable.toLocaleString("en-IN")}`}
                            bgColor={colors.dangerBg}
                            textColor={colors.dangerText}
                            borderColor={colors.danger}
                            isSelected={filterTab === "payable"}
                            onPress={() => handleTabChange("payable")}
                        />
                    )}
                    {totals.settled > 0 && (
                        <SummaryChip
                            icon="check-circle"
                            label="Settled"
                            value={totals.settled.toString()}
                            bgColor={colors.settledBg}
                            textColor={colors.settledText}
                            borderColor={colors.onSurfaceMuted}
                            isSelected={filterTab === "settled"}
                            onPress={() => handleTabChange("settled")}
                        />
                    )}
                </ScrollView>
            </View>

            {/* List with 25-item incremental loading or EmptyState if no search/filter matches */}
            {filteredUsers.length === 0 ? (
                <EmptyState
                    icon="account-search-outline"
                    title="No matching accounts"
                    subtitle={searchQuery ? `No account matches "${searchQuery}"` : "No accounts match the selected filter"}
                />
            ) : (
                <FlatList
                    data={visibleUsers}
                    keyExtractor={(user) => user.userId.toString()}
                    renderItem={({ item: user }) => (
                        <UserRow
                            user={user}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
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

export default UserTable;
