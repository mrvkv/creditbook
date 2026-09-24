import ConfirmationModal from "@/components/ConfirmationModal";
import GroupExpenseModal from "@/components/GroupExpenseModal";
import GroupModal from "@/components/GroupModal";
import GroupSettleModal from "@/components/GroupSettleModal";
import HeaderLeft from "@/components/HeaderLeft";
import { ThemeContext, useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import {
    IGroup,
    IGroupExpense,
    IGroupMember,
    IGroupMemberBalance,
    ISimplifiedDebt,
} from "@/types/group.interface";
import { formatDateLabel, formatTime } from "@/utils/date.util";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BackHandler, FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Portal, Text } from "react-native-paper";

export default function GroupDetails() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const { groupId } = useLocalSearchParams() as unknown as { groupId: string };
    const numGroupId = parseInt(groupId, 10);

    const appTheme = useAppTheme();
    const { colors } = appTheme;

    const [group, setGroup] = useState<IGroup | null>(null);
    const [members, setMembers] = useState<IGroupMember[]>([]);
    const [expenses, setExpenses] = useState<IGroupExpense[]>([]);
    const [balanceData, setBalanceData] = useState<{
        members: IGroupMemberBalance[];
        simplifiedDebts: ISimplifiedDebt[];
        totalSpend: number;
    }>({ members: [], simplifiedDebts: [], totalSpend: 0 });

    const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");

    // Modals
    const [isAddExpenseVisible, setIsAddExpenseVisible] = useState(false);
    const [isSettleModalVisible, setIsSettleModalVisible] = useState(false);
    const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<ISimplifiedDebt | null>(null);
    const [isEditGroupVisible, setIsEditGroupVisible] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<IGroupExpense | null>(null);

    const refreshGroupData = useCallback(() => {
        if (!numGroupId) return;
        const g = DatabaseService.getGroup(db, numGroupId);
        setGroup(g);
        const m = DatabaseService.getGroupMembers(db, numGroupId);
        setMembers(m);
        const e = DatabaseService.getGroupExpenses(db, numGroupId);
        setExpenses(e);
        const b = DatabaseService.calculateGroupBalances(db, numGroupId);
        setBalanceData(b);
    }, [db, numGroupId]);

    useEffect(() => {
        refreshGroupData();
    }, [refreshGroupData]);

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

    useLayoutEffect(() => {
        const headerLeft = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderLeft handler={navigateToHome} />
            </ThemeContext.Provider>
        );

        const headerTitle = () => (
            <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.headerText }} numberOfLines={1}>
                    {group?.name || "Group Details"}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.headerText, opacity: 0.8 }}>
                    {members.length} members
                </Text>
            </View>
        );

        const headerRight = () => (
            <ThemeContext.Provider value={appTheme}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 6 }}>
                    <Pressable
                        onPress={() => setIsEditGroupVisible(true)}
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
                        <Icon source="pencil-outline" size={19} color={colors.headerText} />
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
    }, [appTheme, navigateToHome, group, members, colors]);

    const yourBalance = useMemo(() => {
        const you = balanceData.members.find((m) => m.userId === 0);
        return you ? you.netBalance : 0;
    }, [balanceData]);

    const canSettleGroup = balanceData.simplifiedDebts.length > 0;

    const handleDeleteExpenseConfirm = () => {
        if (expenseToDelete) {
            DatabaseService.deleteGroupExpense(db, expenseToDelete.expenseId);
            setExpenseToDelete(null);
            refreshGroupData();
        }
    };

    const isPositive = yourBalance > 0;
    const isNegative = yourBalance < 0;
    const standingColor = isPositive ? colors.successText : isNegative ? colors.dangerText : colors.onSurfaceMuted;
    const standingBg = isPositive ? colors.successBg : isNegative ? colors.dangerBg : colors.surfaceVariant;
    const standingBorder = isPositive ? colors.success : isNegative ? colors.danger : colors.border;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Top Overview & Balance Card */}
            <View
                style={{
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: 14,
                }}
            >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceMuted, textTransform: "uppercase" }}>
                            TOTAL GROUP SPEND
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.onSurface, marginTop: 2 }}>
                            ₹{balanceData.totalSpend.toLocaleString("en-IN")}
                        </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceMuted, textTransform: "uppercase" }}>
                            YOUR NET BALANCE
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 10,
                                backgroundColor: standingBg,
                                borderWidth: 1,
                                borderColor: standingBorder + "60",
                                gap: 4,
                                marginTop: 2,
                            }}
                        >
                            <Icon
                                source={isPositive ? "arrow-down" : isNegative ? "arrow-up" : "check"}
                                size={14}
                                color={standingColor}
                            />
                            <Text style={{ fontSize: 13, fontWeight: "800", color: standingColor }}>
                                {yourBalance === 0
                                    ? "All Settled Up"
                                    : isPositive
                                    ? `You get ₹${yourBalance.toLocaleString("en-IN")}`
                                    : `You owe ₹${Math.abs(yourBalance).toLocaleString("en-IN")}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Main Action Buttons */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                        onPress={() => setIsAddExpenseVisible(true)}
                        style={({ pressed }) => ({
                            flex: 1.2,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            backgroundColor: colors.primary,
                            paddingVertical: 10,
                            borderRadius: 12,
                            opacity: pressed ? 0.85 : 1,
                            elevation: 1,
                        })}
                    >
                        <Icon source="plus" size={18} color={colors.onPrimary} />
                        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.onPrimary }}>Add Expense</Text>
                    </Pressable>

                    <Pressable
                        disabled={!canSettleGroup}
                        onPress={() => {
                            if (!canSettleGroup) return;
                            setSelectedDebtToSettle(null);
                            setIsSettleModalVisible(true);
                        }}
                        style={({ pressed }) => ({
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            backgroundColor: colors.surfaceVariant,
                            borderWidth: 1,
                            borderColor: canSettleGroup ? colors.success + "60" : colors.border,
                            paddingVertical: 10,
                            borderRadius: 12,
                            opacity: canSettleGroup ? (pressed ? 0.85 : 1) : 0.45,
                        })}
                    >
                        <Icon
                            source="check-all"
                            size={18}
                            color={canSettleGroup ? colors.successText : colors.onSurfaceMuted}
                        />
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: "800",
                                color: canSettleGroup ? colors.successText : colors.onSurfaceMuted,
                            }}
                        >
                            {canSettleGroup ? "Settle Up" : "Settled Up"}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Segmented Switcher Tabs */}
            <View
                style={{
                    flexDirection: "row",
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    gap: 8,
                }}
            >
                <Pressable
                    onPress={() => setActiveTab("expenses")}
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: activeTab === "expenses" ? colors.primary + "16" : "transparent",
                        borderWidth: 1,
                        borderColor: activeTab === "expenses" ? colors.primary : "transparent",
                    }}
                >
                    <Icon
                        source="receipt"
                        size={16}
                        color={activeTab === "expenses" ? colors.primary : colors.onSurfaceMuted}
                    />
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: activeTab === "expenses" ? "800" : "600",
                            color: activeTab === "expenses" ? colors.primary : colors.onSurfaceVariant,
                        }}
                    >
                        Expenses ({expenses.length})
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setActiveTab("balances")}
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: activeTab === "balances" ? colors.primary + "16" : "transparent",
                        borderWidth: 1,
                        borderColor: activeTab === "balances" ? colors.primary : "transparent",
                    }}
                >
                    <Icon
                        source="scale-balance"
                        size={16}
                        color={activeTab === "balances" ? colors.primary : colors.onSurfaceMuted}
                    />
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: activeTab === "balances" ? "800" : "600",
                            color: activeTab === "balances" ? colors.primary : colors.onSurfaceVariant,
                        }}
                    >
                        Balances & Settle ({balanceData.simplifiedDebts.length})
                    </Text>
                </Pressable>
            </View>

            {/* TAB CONTENT */}
            {activeTab === "expenses" ? (
                /* EXPENSES LIST */
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => String(item.expenseId)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
                    ListEmptyComponent={
                        <View style={{ padding: 40, alignItems: "center" }}>
                            <Icon source="receipt-text-outline" size={36} color={colors.onSurfaceMuted} />
                            <Text style={{ marginTop: 10, fontSize: 14, fontWeight: "700", color: colors.onSurface }}>
                                No expenses recorded yet
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, textAlign: "center", marginTop: 4 }}>
                                Tap "Add Expense" above to record a bill and split it among members.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const isSettlement = item.isSettlement === 1;
                        const userSplit = item.splits?.find((s) => s.userId === 0);
                        const yourShare = userSplit ? userSplit.amount : 0;
                        const youPaid = item.paidByUserId === 0;

                        return (
                            <View
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: 14,
                                    padding: 12,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: isSettlement ? colors.success + "40" : colors.border,
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <View style={{ flexDirection: "row", gap: 10, flex: 1, marginRight: 8 }}>
                                        <View
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                backgroundColor: isSettlement ? colors.successBg : colors.chipAccountBg,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 1,
                                                borderColor: isSettlement ? colors.success + "50" : colors.primary + "40",
                                            }}
                                        >
                                            <Icon
                                                source={isSettlement ? "check-all" : "receipt-outline"}
                                                size={18}
                                                color={isSettlement ? colors.successText : colors.primary}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "800", color: colors.onSurface }} numberOfLines={1}>
                                                {item.description}
                                            </Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                                                    {item.paidByName} paid ₹{item.totalAmount.toLocaleString("en-IN")}
                                                </Text>
                                                <Text style={{ fontSize: 10, color: colors.onSurfaceMuted }}>•</Text>
                                                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>
                                                    {formatDateLabel(item.date)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Delete Action */}
                                    <Pressable
                                        onPress={() => setExpenseToDelete(item)}
                                        hitSlop={8}
                                        style={({ pressed }) => ({
                                            padding: 6,
                                            borderRadius: 8,
                                            backgroundColor: pressed ? colors.dangerBg : "transparent",
                                        })}
                                    >
                                        <Icon source="trash-can-outline" size={17} color={colors.onSurfaceMuted} />
                                    </Pressable>
                                </View>

                                {/* Your share notice */}
                                {!isSettlement && (
                                    <View
                                        style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTopWidth: 1,
                                            borderTopColor: colors.border,
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                            {youPaid
                                                ? `You lent ₹${(item.totalAmount - yourShare).toLocaleString("en-IN")}`
                                                : yourShare > 0
                                                ? "You borrowed"
                                                : "You were not involved"}
                                        </Text>

                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "800",
                                                color: youPaid
                                                    ? colors.successText
                                                    : yourShare > 0
                                                    ? colors.dangerText
                                                    : colors.onSurfaceMuted,
                                            }}
                                        >
                                            {youPaid
                                                ? `+₹${(item.totalAmount - yourShare).toLocaleString("en-IN")}`
                                                : yourShare > 0
                                                ? `-₹${yourShare.toLocaleString("en-IN")}`
                                                : "₹0"}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            ) : (
                /* BALANCES & SIMPLIFIED SETTLEMENTS TAB */
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}
                >
                    {/* Suggested Settlements Section */}
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: colors.onSurfaceVariant,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        SUGGESTED SETTLEMENTS (SIMPLIFY DEBTS)
                    </Text>

                    {balanceData.simplifiedDebts.length === 0 ? (
                        <View
                            style={{
                                padding: 18,
                                borderRadius: 14,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Icon source="check-circle-outline" size={28} color={colors.successText} />
                            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.successText, marginTop: 6 }}>
                                Everyone is all settled up!
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                                No outstanding debts remaining in this group.
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 8, marginBottom: 20 }}>
                            {balanceData.simplifiedDebts.map((debt, index) => {
                                const isYouPaying = debt.fromUserId === 0;
                                const isYouReceiving = debt.toUserId === 0;

                                return (
                                    <View
                                        key={index}
                                        style={{
                                            backgroundColor: colors.surface,
                                            borderRadius: 14,
                                            padding: 12,
                                            borderWidth: 1,
                                            borderColor: isYouPaying || isYouReceiving ? colors.primary + "60" : colors.border,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.onSurface }}>
                                                    {debt.fromUserName}
                                                </Text>
                                                <Icon source="arrow-right-thin" size={16} color={colors.onSurfaceMuted} />
                                                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.onSurface }}>
                                                    {debt.toUserName}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, marginTop: 2 }}>
                                                ₹{debt.amount.toLocaleString("en-IN")}
                                            </Text>
                                        </View>

                                        <Pressable
                                            onPress={() => {
                                                setSelectedDebtToSettle(debt);
                                                setIsSettleModalVisible(true);
                                            }}
                                            style={({ pressed }) => ({
                                                paddingHorizontal: 12,
                                                paddingVertical: 7,
                                                borderRadius: 10,
                                                backgroundColor: colors.success,
                                                opacity: pressed ? 0.85 : 1,
                                            })}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Settle</Text>
                                        </Pressable>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Member Net Balances List */}
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: colors.onSurfaceVariant,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        MEMBER BALANCES
                    </Text>

                    <View style={{ gap: 8 }}>
                        {balanceData.members.map((mb) => {
                            const isPos = mb.netBalance > 0.01;
                            const isNeg = mb.netBalance < -0.01;
                            const statusCol = isPos ? colors.successText : isNeg ? colors.dangerText : colors.onSurfaceMuted;

                            return (
                                <View
                                    key={mb.userId}
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderRadius: 12,
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.onSurface }}>
                                            {mb.userName}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                                            Paid: ₹{mb.totalPaid.toLocaleString("en-IN")} • Share: ₹{mb.totalShare.toLocaleString("en-IN")}
                                        </Text>
                                    </View>

                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: statusCol }}>
                                            {mb.netBalance === 0
                                                ? "Settled (₹0)"
                                                : isPos
                                                ? `+₹${Math.round(mb.netBalance).toLocaleString("en-IN")}`
                                                : `-₹${Math.round(Math.abs(mb.netBalance)).toLocaleString("en-IN")}`}
                                        </Text>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: statusCol }}>
                                            {isPos ? "Gets back" : isNeg ? "Owes" : "Balanced"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {/* PORTAL MODALS */}
            <Portal>
                <ThemeContext.Provider value={appTheme}>
                    {/* Add Expense Modal */}
                    <GroupExpenseModal
                        isVisible={isAddExpenseVisible}
                        onClose={() => setIsAddExpenseVisible(false)}
                        groupId={numGroupId}
                        members={members}
                        onSuccess={refreshGroupData}
                    />

                    {/* Settle Up Modal */}
                    <GroupSettleModal
                        isVisible={isSettleModalVisible}
                        onClose={() => {
                            setIsSettleModalVisible(false);
                            setSelectedDebtToSettle(null);
                        }}
                        groupId={numGroupId}
                        members={members}
                        prefillDebt={selectedDebtToSettle}
                        onSuccess={refreshGroupData}
                    />

                    {/* Edit Group Modal */}
                    {group && (
                        <GroupModal
                            isVisible={isEditGroupVisible}
                            onClose={() => setIsEditGroupVisible(false)}
                            group={group}
                            onSaveSuccess={refreshGroupData}
                        />
                    )}

                    {/* Delete Expense Confirmation */}
                    <ConfirmationModal
                        title="Delete Group Expense"
                        message="Are you sure you want to delete this expense? Any linked individual ledger entries will also be reverted."
                        isVisible={!!expenseToDelete}
                        setIsVisible={(v) => {
                            if (!v) setExpenseToDelete(null);
                        }}
                        onSubmit={handleDeleteExpenseConfirm}
                        onCancel={() => setExpenseToDelete(null)}
                    />
                </ThemeContext.Provider>
            </Portal>
        </View>
    );
}
