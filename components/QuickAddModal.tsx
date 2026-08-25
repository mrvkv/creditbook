import { TransactionType } from "@/enums/transaction.enum";
import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IUser } from "@/types/user.interface";
import { useSQLiteContext } from "expo-sqlite";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Checkbox, Chip, Divider, Icon, IconButton, Text, TextInput } from "react-native-paper";
import UserModal from "./UserModal";

interface QuickAddModalProps {
    readonly users: IUser[];
    readonly setVisibility: (visible: boolean) => void;
    readonly onSuccess: () => void;
    readonly onAddUserSubmit: (id: number | undefined, name: string) => void;
}

export default function QuickAddModal({ users, setVisibility, onSuccess, onAddUserSubmit }: QuickAddModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const [activeTab, setActiveTab] = useState<"choice" | "addUser" | "addTransaction">("choice");

    // Add Transaction Form State
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [amountStr, setAmountStr] = useState("");
    const [type, setType] = useState<TransactionType>(TransactionType.Debit);
    const [remark, setRemark] = useState("");

    // Loader & Confirmation state
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Processing...");
    const [successSummary, setSuccessSummary] = useState<{
        amount: number;
        type: TransactionType;
        count: number;
        userNames: string[];
    } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Accounts array passed from props
    const allDbUsers = users || [];

    // Filter accounts by search query across ALL users
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return allDbUsers;
        const q = searchQuery.toLowerCase().trim();
        return allDbUsers.filter((u) => u.name.toLowerCase().includes(q));
    }, [allDbUsers, searchQuery]);

    const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.userId));

    function toggleUserSelection(userId: number) {
        setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    }

    function toggleSelectAllFiltered() {
        const filteredIds = filteredUsers.map((u) => u.userId);
        if (allFilteredSelected) {
            setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
        }
    }

    async function handleSaveTransaction() {
        if (selectedUserIds.length === 0) {
            setErrorMsg("Please select at least one account.");
            return;
        }
        const numAmount = parseFloat(amountStr);
        if (isNaN(numAmount) || numAmount <= 0) {
            setErrorMsg("Please enter a valid amount greater than ₹0.");
            return;
        }

        setErrorMsg(null);
        setLoadingMessage(`Adding ₹${numAmount} transaction across ${selectedUserIds.length} accounts...`);
        setIsLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            DatabaseService.createBatchTransactions(db, selectedUserIds, numAmount, type, remark);
            setIsLoading(false);

            const selectedNames = allDbUsers.filter((u) => selectedUserIds.includes(u.userId)).map((u) => u.name);

            setSuccessSummary({
                amount: numAmount,
                type,
                count: selectedUserIds.length,
                userNames: selectedNames,
            });
        } catch (err: any) {
            setIsLoading(false);
            setErrorMsg(err.message || "Failed to create transaction.");
        }
    }

    function handleFinishSuccess() {
        onSuccess();
        setVisibility(false);
    }

    const selectedUsersList = useMemo(() => {
        return allDbUsers.filter((u) => selectedUserIds.includes(u.userId));
    }, [allDbUsers, selectedUserIds]);

    return (
        <View style={{ width: "100%", maxHeight: 580, position: "relative" }}>
            {/* OPAQUE SOLID LOADER OVERLAY */}
            {isLoading && (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.modalBg,
                        zIndex: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 16,
                        padding: 24,
                        gap: 16,
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface, textAlign: "center" }}>
                        {loadingMessage}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}>
                        Updating account ledgers and recalculating net balances...
                    </Text>
                </View>
            )}

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 18, paddingBottom: 16 }} style={{ width: "100%" }}>
                {/* SUCCESS CONFIRMATION CARD */}
                {successSummary ? (
                    <View style={{ gap: 16, alignItems: "center", paddingVertical: 10 }}>
                        <View
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: colors.success + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon source="cash-check" size={34} color={colors.success} />
                        </View>

                        <View style={{ alignItems: "center" }}>
                            <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface, marginBottom: 4, textAlign: "center" }}>
                                Transaction Recorded Successfully
                            </Text>
                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}>
                                Added {successSummary.type === TransactionType.Debit ? "Gave" : "Got"} transaction of ₹{successSummary.amount} across{" "}
                                {successSummary.count} accounts.
                            </Text>
                        </View>

                        <View
                            style={{
                                width: "100%",
                                backgroundColor: colors.surfaceVariant + "80",
                                borderRadius: 12,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: colors.border,
                                gap: 10,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Transaction Amount:</Text>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: successSummary.type === TransactionType.Debit ? colors.dangerText : colors.successText,
                                        fontWeight: "800",
                                    }}
                                >
                                    {successSummary.type === TransactionType.Debit
                                        ? "₹" + successSummary.amount + " (Gave)"
                                        : "₹" + successSummary.amount + " (Got)"}
                                </Text>
                            </View>
                            <Divider />
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Applied To:</Text>
                                <Text style={{ fontSize: 13, color: colors.onSurface, fontWeight: "700" }}>{successSummary.count} accounts</Text>
                            </View>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                {successSummary.userNames.map((name, i) => (
                                    <Chip
                                        key={i}
                                        compact
                                        style={{
                                            height: 30,
                                            borderRadius: 15,
                                            backgroundColor: colors.primary + "20",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        textStyle={{
                                            fontSize: 12,
                                            fontWeight: "700",
                                            color: colors.primary,
                                            marginVertical: 0,
                                            marginHorizontal: 4,
                                        }}
                                    >
                                        {name}
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleFinishSuccess}
                            icon="check"
                            buttonColor={colors.primary}
                            style={{ width: "100%", borderRadius: 10, marginTop: 6 }}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            Done & View Ledgers
                        </Button>
                    </View>
                ) : activeTab === "choice" ? (
                    /* STEP 1: CHOICE MENU */
                    <View style={{ gap: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <View
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    backgroundColor: colors.primary + "20",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon source="plus-circle" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface }}>
                                    Quick Action
                                </Text>
                                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                    Choose what you would like to add
                                </Text>
                            </View>
                        </View>

                        {/* Option 1: Add User Card */}
                        <Pressable
                            onPress={() => setActiveTab("addUser")}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.surfaceVariant : colors.surfaceVariant + "60",
                                borderRadius: 14,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.border,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 14,
                            })}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    backgroundColor: colors.primary + "20",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon source="account-plus" size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleSmall" style={{ fontWeight: "800", color: colors.onSurface, marginBottom: 2 }}>
                                    Add New Account
                                </Text>
                                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                    Create a new customer or personal ledger
                                </Text>
                            </View>
                            <Icon source="chevron-right" size={22} color={colors.onSurfaceVariant} />
                        </Pressable>

                        {/* Option 2: Add Transaction Card */}
                        <Pressable
                            onPress={() => setActiveTab("addTransaction")}
                            style={({ pressed }) => ({
                                backgroundColor: pressed ? colors.surfaceVariant : colors.surfaceVariant + "60",
                                borderRadius: 14,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.border,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 14,
                            })}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    backgroundColor: colors.success + "20",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon source="cash-plus" size={24} color={colors.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleSmall" style={{ fontWeight: "800", color: colors.onSurface, marginBottom: 2 }}>
                                    Add Transaction
                                </Text>
                                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                    Record a transaction against one or multiple accounts
                                </Text>
                            </View>
                            <Icon source="chevron-right" size={22} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>
                ) : activeTab === "addUser" ? (
                    /* STEP 2A: ADD USER FORM */
                    <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <IconButton
                                icon="arrow-left"
                                size={20}
                                iconColor={colors.onSurface}
                                style={{
                                    margin: 0,
                                    borderRadius: 10,
                                    backgroundColor: colors.surfaceVariant,
                                }}
                                onPress={() => setActiveTab("choice")}
                            />
                            <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface }}>
                                Add New Account
                            </Text>
                        </View>
                        <UserModal
                            onSubmit={(id, name) => {
                                onAddUserSubmit(id, name);
                                setVisibility(false);
                            }}
                            setVisibility={setVisibility}
                        />
                    </View>
                ) : (
                    /* STEP 2B: ADD MULTI-SELECT TRANSACTION FORM */
                    <View style={{ gap: 12 }}>
                        {/* Header & Back Button */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <IconButton
                                    icon="arrow-left"
                                    size={20}
                                    iconColor={colors.onSurface}
                                    style={{
                                        margin: 0,
                                        borderRadius: 10,
                                        backgroundColor: colors.surfaceVariant,
                                    }}
                                    onPress={() => setActiveTab("choice")}
                                />
                                <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface }}>
                                    Add Transaction
                                </Text>
                            </View>

                            <Chip
                                compact
                                style={{
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: selectedUserIds.length > 0 ? colors.primary + "20" : colors.surfaceVariant,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                textStyle={{
                                    fontSize: 12,
                                    fontWeight: "800",
                                    color: selectedUserIds.length > 0 ? colors.primary : colors.onSurfaceVariant,
                                    marginVertical: 0,
                                    marginHorizontal: 4,
                                }}
                            >
                                {selectedUserIds.length} Selected
                            </Chip>
                        </View>

                        {/* Transaction Type Segmented Toggle */}
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
                            <Pressable
                                onPress={() => setType(TransactionType.Debit)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 9,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: type === TransactionType.Debit ? colors.danger : "transparent",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: type === TransactionType.Debit ? "800" : "600",
                                        color: type === TransactionType.Debit ? colors.onDanger : colors.onSurfaceVariant,
                                    }}
                                >
                                    You Gave ₹
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setType(TransactionType.Credit)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 9,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: type === TransactionType.Credit ? colors.success : "transparent",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: type === TransactionType.Credit ? "800" : "600",
                                        color: type === TransactionType.Credit ? colors.onSuccess : colors.onSurfaceVariant,
                                    }}
                                >
                                    You Got ₹
                                </Text>
                            </Pressable>
                        </View>

                        {/* Amount Input */}
                        <TextInput
                            mode="outlined"
                            label="Amount (₹)"
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            autoFocus={true}
                            value={amountStr}
                            onChangeText={setAmountStr}
                            textColor={colors.onSurface}
                            outlineColor={colors.border}
                            activeOutlineColor={type === TransactionType.Debit ? colors.danger : colors.success}
                        />

                        {/* Search Accounts Input */}
                        <TextInput
                            mode="outlined"
                            label="Search Accounts"
                            placeholder="Type account name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            textColor={colors.onSurface}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            left={<TextInput.Icon icon="magnify" />}
                            right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery("")} /> : null}
                        />

                        {/* Selected User Removable Chips */}
                        {selectedUsersList.length > 0 && (
                            <View style={{ minHeight: 36, justifyContent: "center" }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={{ overflow: "visible" }}
                                    contentContainerStyle={{ gap: 8, paddingRight: 16, paddingVertical: 2, alignItems: "center" }}
                                >
                                    {selectedUsersList.map((user) => (
                                        <Chip
                                            key={user.userId}
                                            compact
                                            onClose={() => toggleUserSelection(user.userId)}
                                            style={{
                                                height: 32,
                                                borderRadius: 14,
                                                backgroundColor: colors.primary + "20",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            textStyle={{
                                                fontSize: 12,
                                                fontWeight: "700",
                                                color: colors.primary,
                                                marginVertical: 0,
                                                marginHorizontal: 2,
                                            }}
                                        >
                                            {user.name}
                                        </Chip>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Select All Toggle Button & Accounts List Header */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurfaceVariant }}>Accounts ({filteredUsers.length})</Text>
                            {filteredUsers.length > 0 && (
                                <Button
                                    mode={allFilteredSelected ? "contained-tonal" : "outlined"}
                                    compact
                                    icon={allFilteredSelected ? "checkbox-marked-circle-outline" : "checkbox-blank-circle-outline"}
                                    onPress={toggleSelectAllFiltered}
                                    style={{ borderRadius: 8, borderColor: colors.border }}
                                    labelStyle={{ fontSize: 11, fontWeight: "700" }}
                                >
                                    {allFilteredSelected ? "Deselect All" : "Select All Filtered"}
                                </Button>
                            )}
                        </View>

                        {/* Account Suggestions Scroll Container (Dynamic height for 1-5 items, scrolling for 6+ items) */}
                        <View
                            style={{
                                maxHeight: 280,
                                backgroundColor: colors.surfaceVariant + "40",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: colors.border,
                                overflow: "hidden",
                            }}
                        >
                            {filteredUsers.length === 0 ? (
                                <View style={{ padding: 16, alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>No accounts match search query</Text>
                                </View>
                            ) : (
                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={true}
                                    style={{ flexGrow: 0 }}
                                >
                                    {filteredUsers.map((user) => {
                                        const isSelected = selectedUserIds.includes(user.userId);
                                        return (
                                            <Pressable
                                                key={user.userId}
                                                onPress={() => toggleUserSelection(user.userId)}
                                                style={({ pressed }) => ({
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    minHeight: 44,
                                                    backgroundColor: isSelected ? colors.primary + "12" : pressed ? colors.surfaceVariant : "transparent",
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: colors.border + "40",
                                                })}
                                            >
                                                <Checkbox.Android
                                                    status={isSelected ? "checked" : "unchecked"}
                                                    color={colors.primary}
                                                    onPress={() => toggleUserSelection(user.userId)}
                                                />
                                                <View style={{ flex: 1, marginLeft: 6 }}>
                                                    <Text style={{ fontWeight: "700", color: colors.onSurface, fontSize: 13 }}>{user.name}</Text>
                                                    <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                                        Current Net: ₹{Math.abs(user.balance)}{" "}
                                                        {user.balance < 0 ? "(Receivable)" : user.balance > 0 ? "(Payable)" : "(Settled)"}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Remark Input */}
                        <TextInput
                            mode="outlined"
                            label="Remark / Description (Optional)"
                            placeholder="e.g. Tea & snacks, Rent, UPI"
                            value={remark}
                            onChangeText={setRemark}
                            textColor={colors.onSurface}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                        />

                        {/* Error Message if any */}
                        {errorMsg && (
                            <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: 8 }}>
                                <Text style={{ color: colors.dangerText, fontSize: 12, fontWeight: "600" }}>{errorMsg}</Text>
                            </View>
                        )}

                        {/* Save Button */}
                        <Button
                            mode="contained"
                            onPress={handleSaveTransaction}
                            buttonColor={type === TransactionType.Debit ? colors.danger : colors.success}
                            style={{ borderRadius: 10, marginTop: 4 }}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            Save Transaction ({selectedUserIds.length} Accounts)
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
