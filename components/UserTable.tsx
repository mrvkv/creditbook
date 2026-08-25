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
    onSettle,
    isSelectMode,
    isSelected,
    onToggleSelect,
}: {
    user: IUser;
    onView: (u: IUser) => void;
    onEdit: (u: IUser) => void;
    onDelete: (u: IUser) => void;
    onSettle?: (u: IUser) => void;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (userId: number) => void;
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
            onPress={() => (isSelectMode && !isSettled ? onToggleSelect?.(user.userId) : onView(user))}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                marginHorizontal: 16,
                marginVertical: 5,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.success : colors.border,
                shadowColor: isDark ? "#000" : "#6366F1",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.25 : 0.07,
                shadowRadius: 6,
                elevation: 2,
            })}
        >
            {/* Multi-select Checkbox */}
            {isSelectMode && !isSettled && (
                <Pressable
                    onPress={() => onToggleSelect?.(user.userId)}
                    style={{
                        marginRight: 10,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.success : colors.border,
                        backgroundColor: isSelected ? colors.success : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {isSelected && <Icon source="check" size={14} color="#FFF" />}
                </Pressable>
            )}

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
                {!isSettled && onSettle && !isSelectMode && (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onSettle(user);
                        }}
                        style={({ pressed }) => ({
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: pressed ? colors.successBg : "transparent",
                        })}
                        hitSlop={6}
                    >
                        <Icon source="check-all" size={17} color={colors.successText} />
                    </Pressable>
                )}
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
    hideSettled = false,
    onToggleHideSettled,
    onDelete,
    onView,
    onEdit,
    onSettleUser,
    onSettleMultipleUsers,
    isSelectMode = false,
    setIsSelectMode,
    currentFilterTab,
    onFilterTabChange,
    onRestoreBackup,
}: {
    users: IUser[];
    hideSettled?: boolean;
    onToggleHideSettled?: () => void;
    onDelete: (user: IUser) => void;
    onView: (user: IUser) => void;
    onEdit: (user: IUser) => void;
    onSettleUser?: (user: IUser) => void;
    onSettleMultipleUsers?: (userIds: number[]) => void;
    isSelectMode?: boolean;
    setIsSelectMode?: (val: boolean) => void;
    currentFilterTab?: UserFilterTab;
    onFilterTabChange?: (tab: UserFilterTab) => void;
    onRestoreBackup?: () => void;
}) => {
    const { colors } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [internalFilterTab, setInternalFilterTab] = useState<UserFilterTab>("all");
    const filterTab = currentFilterTab !== undefined ? currentFilterTab : internalFilterTab;
    const setFilterTab = (tabOrFn: UserFilterTab | ((prev: UserFilterTab) => UserFilterTab)) => {
        const nextTab = typeof tabOrFn === "function" ? tabOrFn(filterTab) : tabOrFn;
        setInternalFilterTab(nextTab);
        onFilterTabChange?.(nextTab);
    };
    const [visibleLimit, setVisibleLimit] = useState(25);

    // Multi-settle selection state
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const totals = useMemo(() => {
        const receivable = users?.filter((u) => u.balance < 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const payable = users?.filter((u) => u.balance > 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const count = users?.length || 0;
        const settled = users?.filter((u) => u.balance === 0).length || 0;
        const unsettledUsers = users?.filter((u) => u.balance !== 0) || [];
        return { receivable, payable, count, settled, unsettledUsers };
    }, [users]);

    // Apply filter tab and search query
    const filteredUsers = useMemo(() => {
        let list = [...(users || [])];

        if (hideSettled) {
            list = list.filter((u) => u.balance !== 0);
        }

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
    }, [users, hideSettled, filterTab, searchQuery]);

    const eligibleUsers = useMemo(() => {
        return filteredUsers.filter((u) => u.balance !== 0);
    }, [filteredUsers]);

    const eligibleCount = eligibleUsers.length;
    const selectedCount = selectedUserIds.length;

    const selectAllState: "none" | "partial" | "all" = useMemo(() => {
        if (selectedCount === 0) return "none";
        if (eligibleCount > 0 && selectedCount >= eligibleCount) return "all";
        return "partial";
    }, [selectedCount, eligibleCount]);

    const selectAllIcon =
        selectAllState === "all"
            ? "checkbox-marked"
            : selectAllState === "partial"
            ? "minus-box"
            : "checkbox-blank-outline";

    const selectAllIconColor =
        selectAllState === "none" ? colors.onSurfaceMuted : colors.primary;

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

    const toggleSelectUser = (userId: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectAllState === "all") {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(eligibleUsers.map((u) => u.userId));
        }
    };

    const handleBatchSettleSubmit = () => {
        if (selectedUserIds.length > 0 && onSettleMultipleUsers) {
            onSettleMultipleUsers(selectedUserIds);
        }
    };

    React.useEffect(() => {
        if ((hideSettled || totals.settled === 0) && filterTab === "settled") {
            setFilterTab("all");
        }
        if (totals.receivable === 0 && filterTab === "receivable") {
            setFilterTab("all");
        }
        if (totals.payable === 0 && filterTab === "payable") {
            setFilterTab("all");
        }
    }, [hideSettled, totals.settled, totals.receivable, totals.payable, filterTab]);

    React.useEffect(() => {
        if (!isSelectMode || eligibleCount === 0) {
            setSelectedUserIds([]);
            if (eligibleCount === 0 && isSelectMode && setIsSelectMode) {
                setIsSelectMode(false);
            }
        }
    }, [isSelectMode, eligibleCount, setIsSelectMode]);

    if (!users || users.length === 0) {
        return (
            <EmptyState
                icon="account-off-outline"
                title="No accounts found"
                subtitle="Tap the + button to add an account or restore from a backup file."
                actionLabel={onRestoreBackup ? "Restore from Backup File" : undefined}
                actionIcon="cloud-sync-outline"
                onAction={onRestoreBackup}
            />
        );
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
                            setFilterTab("all");
                        }
                        setSearchQuery(text);
                        setVisibleLimit(25);
                    }}
                    dense
                    left={<TextInput.Icon icon="magnify" color={colors.onSurfaceMuted} />}
                    right={
                        searchQuery ? (
                            <TextInput.Icon
                                icon="close-circle"
                                color={colors.onSurfaceMuted}
                                onPress={() => {
                                    setSearchQuery("");
                                    setVisibleLimit(25);
                                }}
                            />
                        ) : null
                    }
                    outlineStyle={{ borderRadius: 12, borderColor: colors.border }}
                    contentStyle={{ fontSize: 14 }}
                    style={{ backgroundColor: colors.surface }}
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
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        gap: 8,
                    }}
                >
                    <SummaryChip
                        icon="account-group-outline"
                        label="Accounts"
                        value={String(hideSettled ? totals.count - totals.settled : totals.count)}
                        bgColor={colors.chipAccountBg}
                        textColor={colors.primary}
                        borderColor={colors.primary}
                        isSelected={filterTab === "all"}
                        onPress={() => handleTabChange("all")}
                    />
                    {totals.receivable > 0 && (
                        <SummaryChip
                            icon="arrow-down-bold-circle-outline"
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
                            icon="arrow-up-bold-circle-outline"
                            label="Payable"
                            value={`₹${totals.payable.toLocaleString("en-IN")}`}
                            bgColor={colors.dangerBg}
                            textColor={colors.dangerText}
                            borderColor={colors.danger}
                            isSelected={filterTab === "payable"}
                            onPress={() => handleTabChange("payable")}
                        />
                    )}
                    {!hideSettled && totals.settled > 0 && (
                        <SummaryChip
                            icon="check-circle-outline"
                            label="Settled"
                            value={String(totals.settled)}
                            bgColor={colors.settledBg}
                            textColor={colors.onSurfaceMuted}
                            borderColor={colors.border}
                            isSelected={filterTab === "settled"}
                            onPress={() => handleTabChange("settled")}
                        />
                    )}
                </ScrollView>
            </View>

            {/* Multi Settle Selection Header Bar when active */}
            {isSelectMode && (
                <View
                    style={{
                        backgroundColor: colors.surfaceVariant,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        minHeight: 46,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Pressable
                            onPress={toggleSelectAll}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 12,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Icon source={selectAllIcon} size={16} color={selectAllIconColor} />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                                Select All ({eligibleCount})
                            </Text>
                        </Pressable>

                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.onSurfaceVariant }}>
                            {selectedCount} selected
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Pressable
                            onPress={() => {
                                if (setIsSelectMode) setIsSelectMode(false);
                                setSelectedUserIds([]);
                            }}
                            style={({ pressed }) => ({
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                            })}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                                Cancel
                            </Text>
                        </Pressable>

                        {selectedCount > 0 && (
                            <Pressable
                                onPress={handleBatchSettleSubmit}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    backgroundColor: colors.success,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Icon source="check-all" size={14} color="#FFF" />
                                <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFF" }}>
                                    Settle ({selectedCount})
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            )}

            {/* Account List */}
            {filteredUsers.length === 0 ? (
                hideSettled && totals.count > 0 && totals.settled === totals.count ? (
                    <EmptyState
                        icon="check-all"
                        title="All Accounts Settled! 🎉"
                        subtitle="All your accounts currently have a net balance of ₹0. Settled accounts are hidden."
                        actionLabel={onToggleHideSettled ? "Show Settled Accounts" : undefined}
                        actionIcon="eye-outline"
                        onAction={onToggleHideSettled}
                    />
                ) : (
                    <EmptyState
                        icon="account-search-outline"
                        title="No matching accounts"
                        subtitle={searchQuery ? `No accounts match "${searchQuery}"` : "No accounts under this filter"}
                    />
                )
            ) : (
                <FlatList
                    data={visibleUsers}
                    keyExtractor={(u) => u.userId.toString()}
                    renderItem={({ item: user }) => (
                        <UserRow
                            user={user}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSettle={onSettleUser}
                            isSelectMode={isSelectMode}
                            isSelected={selectedUserIds.includes(user.userId)}
                            onToggleSelect={toggleSelectUser}
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
