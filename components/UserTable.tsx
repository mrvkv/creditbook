import EmptyState from "@/components/EmptyState";
import { useAppTheme } from "@/hooks/useAppTheme";
import { IUser } from "@/types/user.interface";
import * as React from "react";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Text } from "react-native-paper";

// ─── Summary chip ──────────────────────────────────────────────────────────
const SummaryChip = ({
    icon,
    label,
    value,
    bgColor,
    textColor,
    borderColor,
}: {
    icon: string;
    label: string;
    value: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
}) => (
    <View
        style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor: borderColor,
            gap: 6,
        }}
    >
        <Icon source={icon} size={14} color={textColor} />
        <Text style={{ color: textColor, fontSize: 12, fontWeight: "700" }}>
            {label}: {value}
        </Text>
    </View>
);

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
    const [visibleLimit, setVisibleLimit] = useState(25);

    const totals = useMemo(() => {
        const receivable = users?.filter((u) => u.balance < 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const payable = users?.filter((u) => u.balance > 0).reduce((sum, u) => sum + Math.abs(u.balance), 0) || 0;
        const count = users?.length || 0;
        const settled = users?.filter((u) => u.balance === 0).length || 0;
        return { receivable, payable, count, settled };
    }, [users]);

    const visibleUsers = useMemo(() => {
        return (users || []).slice(0, visibleLimit);
    }, [users, visibleLimit]);

    const loadMore = () => {
        if (visibleLimit < (users?.length || 0)) {
            setVisibleLimit((prev) => prev + 25);
        }
    };

    if (!users || users.length === 0) {
        return <EmptyState icon="account-off-outline" title="No accounts found" subtitle="Tap the + button to add your first account" />;
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Summary bar — single-line horizontal scrollable row */}
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
                        label="Accounts"
                        value={totals.count.toString()}
                        bgColor={colors.chipAccountBg}
                        textColor={colors.chipAccountText}
                        borderColor={colors.primary + "30"}
                    />
                    {totals.receivable > 0 && (
                        <SummaryChip
                            icon="arrow-down-circle"
                            label="Receivable"
                            value={`₹${totals.receivable.toLocaleString("en-IN")}`}
                            bgColor={colors.successBg}
                            textColor={colors.successText}
                            borderColor={colors.success + "40"}
                        />
                    )}
                    {totals.payable > 0 && (
                        <SummaryChip
                            icon="arrow-up-circle"
                            label="Payable"
                            value={`₹${totals.payable.toLocaleString("en-IN")}`}
                            bgColor={colors.dangerBg}
                            textColor={colors.dangerText}
                            borderColor={colors.danger + "40"}
                        />
                    )}
                    {totals.settled > 0 && (
                        <SummaryChip
                            icon="check-circle"
                            label="Settled"
                            value={totals.settled.toString()}
                            bgColor={colors.settledBg}
                            textColor={colors.settledText}
                            borderColor={colors.border}
                        />
                    )}
                </ScrollView>
            </View>

            {/* List with 25-item incremental loading */}
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
        </View>
    );
};

export default UserTable;
