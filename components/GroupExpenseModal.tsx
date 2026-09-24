import DateTimePickerModal from "@/components/DateTimePickerModal";
import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IGroupMember } from "@/types/group.interface";
import { formatDateLabel } from "@/utils/date.util";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Button, Checkbox, Icon, Modal as PaperModal, Portal, Text, TextInput } from "react-native-paper";

interface IGroupExpenseModalProps {
    isVisible: boolean;
    onClose: () => void;
    groupId: number;
    members: IGroupMember[];
    onSuccess: () => void;
}

export default function GroupExpenseModal({
    isVisible,
    onClose,
    groupId,
    members,
    onSuccess,
}: IGroupExpenseModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const [description, setDescription] = useState("");
    const [amountText, setAmountText] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [paidByUserId, setPaidByUserId] = useState<number>(0); // 0 = "You"
    const [splitType, setSplitType] = useState<"equal" | "exact">("equal");

    // Participating member IDs
    const [participatingUserIds, setParticipatingUserIds] = useState<number[]>([]);
    // Custom split amounts map
    const [customAmounts, setCustomAmounts] = useState<{ [userId: number]: string }>({});

    const [errorMsg, setErrorMsg] = useState("");
    const amountInputRef = useRef<any>(null);

    useEffect(() => {
        if (!isVisible) return;
        setDescription("");
        setAmountText("");
        setDate(new Date());
        setPaidByUserId(0); // "You" by default
        setSplitType("equal");
        // All members participate by default
        setParticipatingUserIds(members.map((m) => m.userId));
        setCustomAmounts({});
        setErrorMsg("");

        setTimeout(() => {
            amountInputRef.current?.focus?.();
        }, 150);
    }, [isVisible, members]);

    const totalAmount = useMemo(() => {
        const val = parseFloat(amountText.replace(/,/g, ""));
        return isNaN(val) ? 0 : Math.round(val);
    }, [amountText]);

    // Calculate equal split shares
    const computedSplits = useMemo(() => {
        const pCount = participatingUserIds.length;
        if (pCount === 0 || totalAmount <= 0) return [];

        if (splitType === "equal") {
            const baseShare = Math.floor(totalAmount / pCount);
            let remainder = totalAmount - baseShare * pCount;

            return participatingUserIds.map((userId) => {
                const add = remainder > 0 ? 1 : 0;
                if (remainder > 0) remainder--;
                return { userId, amount: baseShare + add };
            });
        } else {
            // exact
            return participatingUserIds.map((userId) => {
                const val = parseFloat(customAmounts[userId] || "0");
                return { userId, amount: isNaN(val) ? 0 : Math.round(val) };
            });
        }
    }, [splitType, totalAmount, participatingUserIds, customAmounts]);

    const customSum = useMemo(() => {
        if (splitType !== "exact") return totalAmount;
        return computedSplits.reduce((acc, s) => acc + s.amount, 0);
    }, [splitType, totalAmount, computedSplits]);

    const toggleParticipant = (userId: number) => {
        setParticipatingUserIds((prev) => {
            if (prev.includes(userId)) {
                if (prev.length <= 1) return prev; // Keep at least one
                return prev.filter((id) => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
        if (errorMsg) setErrorMsg("");
    };

    const handleSave = () => {
        if (totalAmount <= 0) {
            setErrorMsg("Please enter a valid amount");
            return;
        }
        if (!description.trim()) {
            setErrorMsg("Please enter a description for the expense");
            return;
        }
        if (participatingUserIds.length === 0) {
            setErrorMsg("Select at least 1 person who shares this bill");
            return;
        }

        if (splitType === "exact" && customSum !== totalAmount) {
            const diff = totalAmount - customSum;
            setErrorMsg(
                diff > 0
                    ? `Exact split sum is ₹${customSum} (₹${diff} remaining)`
                    : `Exact split sum exceeds total by ₹${Math.abs(diff)}`
            );
            return;
        }

        try {
            DatabaseService.createGroupExpense(db, {
                groupId,
                description: description.trim(),
                totalAmount,
                paidByUserId,
                splitType,
                date: date.toISOString(),
                splits: computedSplits,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save group expense:", err);
            setErrorMsg("Failed to save group expense. Please try again.");
        }
    };

    return (
        <Portal>
            <PaperModal
                visible={isVisible}
                onDismiss={onClose}
                contentContainerStyle={[
                    styles.modalContainer,
                    { backgroundColor: colors.modalBg, borderColor: colors.border },
                ]}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
                                <Icon source="receipt-text-outline" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.onSurface }]}>Add Group Expense</Text>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                    Split bill among group members
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                            <Icon source="close" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 500 }}
                        contentContainerStyle={{ padding: 18 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Amount & Description Inputs */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>EXPENSE AMOUNT (₹)</Text>
                        <TextInput
                            ref={amountInputRef}
                            mode="outlined"
                            placeholder="0"
                            value={amountText}
                            onChangeText={(t) => {
                                setAmountText(t);
                                if (errorMsg) setErrorMsg("");
                            }}
                            keyboardType="numeric"
                            style={{ backgroundColor: colors.surface, fontSize: 20, fontWeight: "800", marginBottom: 12 }}
                            dense
                            left={<TextInput.Icon icon="currency-inr" color={colors.primary} />}
                        />

                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>DESCRIPTION / REMARK</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. Dinner at Fisherman's Wharf, Groceries"
                            value={description}
                            onChangeText={(t) => {
                                setDescription(t);
                                if (errorMsg) setErrorMsg("");
                            }}
                            style={{ backgroundColor: colors.surface, marginBottom: 12 }}
                            dense
                        />

                        {/* Date Picker Tile */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>DATE</Text>
                        <Pressable
                            onPress={() => setIsDatePickerVisible(true)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: colors.surface,
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginBottom: 16,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Icon source="calendar" size={18} color={colors.primary} />
                                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>
                                    {formatDateLabel(date)}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>Change</Text>
                        </Pressable>

                        {/* Who Paid Section */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>PAID BY</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 16, marginBottom: 16 }}
                        >
                            {members.map((m) => {
                                const isSelected = paidByUserId === m.userId;
                                return (
                                    <Pressable
                                        key={m.userId}
                                        onPress={() => setPaidByUserId(m.userId)}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                            paddingVertical: 7,
                                            paddingHorizontal: 12,
                                            borderRadius: 16,
                                            backgroundColor: isSelected ? colors.primary : colors.surface,
                                            borderWidth: 1,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Icon
                                            source={m.userId === 0 ? "account" : "account-outline"}
                                            size={16}
                                            color={isSelected ? colors.onPrimary : colors.onSurfaceVariant}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                                            }}
                                        >
                                            {m.userName}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {/* Split Type Selector */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginBottom: 0 }]}>
                                SPLIT BETWEEN
                            </Text>
                            <View style={{ flexDirection: "row", gap: 6 }}>
                                <Pressable
                                    onPress={() => setSplitType("equal")}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 12,
                                        backgroundColor: splitType === "equal" ? colors.primary + "20" : "transparent",
                                        borderWidth: 1,
                                        borderColor: splitType === "equal" ? colors.primary : colors.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: splitType === "equal" ? "800" : "600",
                                            color: splitType === "equal" ? colors.primary : colors.onSurfaceVariant,
                                        }}
                                    >
                                        Split Equally
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setSplitType("exact")}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 12,
                                        backgroundColor: splitType === "exact" ? colors.primary + "20" : "transparent",
                                        borderWidth: 1,
                                        borderColor: splitType === "exact" ? colors.primary : colors.border,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: splitType === "exact" ? "800" : "600",
                                            color: splitType === "exact" ? colors.primary : colors.onSurfaceVariant,
                                        }}
                                    >
                                        Exact Amounts
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Member Share List */}
                        <View style={{ gap: 8, marginBottom: 12 }}>
                            {members.map((m) => {
                                const isParticipating = participatingUserIds.includes(m.userId);
                                const split = computedSplits.find((s) => s.userId === m.userId);
                                const shareAmount = split ? split.amount : 0;

                                return (
                                    <View
                                        key={m.userId}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 12,
                                            backgroundColor: isParticipating ? colors.surface : colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: isParticipating ? colors.border : "transparent",
                                        }}
                                    >
                                        <Pressable
                                            onPress={() => toggleParticipant(m.userId)}
                                            style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
                                        >
                                            <Checkbox.Android
                                                status={isParticipating ? "checked" : "unchecked"}
                                                color={colors.primary}
                                                onPress={() => toggleParticipant(m.userId)}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: isParticipating ? "700" : "500",
                                                    color: isParticipating ? colors.onSurface : colors.onSurfaceMuted,
                                                }}
                                            >
                                                {m.userName}
                                            </Text>
                                        </Pressable>

                                        {isParticipating && splitType === "equal" && (
                                            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>
                                                ₹{shareAmount.toLocaleString("en-IN")}
                                            </Text>
                                        )}

                                        {isParticipating && splitType === "exact" && (
                                            <View style={{ width: 100 }}>
                                                <TextInput
                                                    mode="outlined"
                                                    placeholder="0"
                                                    value={customAmounts[m.userId] || ""}
                                                    onChangeText={(t) =>
                                                        setCustomAmounts((prev) => ({ ...prev, [m.userId]: t }))
                                                    }
                                                    keyboardType="numeric"
                                                    dense
                                                    style={{ backgroundColor: colors.surface, height: 34, fontSize: 13 }}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Error Notice */}
                        {!!errorMsg && (
                            <View
                                style={{
                                    padding: 10,
                                    borderRadius: 10,
                                    backgroundColor: colors.dangerBg,
                                    borderWidth: 1,
                                    borderColor: colors.danger + "40",
                                    marginBottom: 10,
                                }}
                            >
                                <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "700", textAlign: "center" }}>
                                    {errorMsg}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <Button
                            mode="outlined"
                            onPress={onClose}
                            textColor={colors.onSurfaceVariant}
                            style={{ borderColor: colors.border, borderRadius: 12, overflow: "hidden" }}
                            contentStyle={{ paddingHorizontal: 16, height: 42 }}
                            labelStyle={{ fontWeight: "700" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            buttonColor={colors.primary}
                            textColor={colors.onPrimary}
                            style={{ borderRadius: 12, overflow: "hidden" }}
                            contentStyle={{ paddingHorizontal: 20, height: 42 }}
                            labelStyle={{ fontWeight: "700" }}
                            icon="check"
                        >
                            Save Expense
                        </Button>
                    </View>
                </KeyboardAvoidingView>

                {/* Date Picker Modal */}
                {isDatePickerVisible && (
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        onClose={() => setIsDatePickerVisible(false)}
                        value={date}
                        onConfirm={(selected) => {
                            setDate(selected);
                            setIsDatePickerVisible(false);
                        }}
                        title="Expense Date"
                    />
                )}
            </PaperModal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "800",
    },
    closeBtn: {
        padding: 6,
        borderRadius: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
    },
});
