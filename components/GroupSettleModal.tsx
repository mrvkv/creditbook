import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IGroupMember, ISimplifiedDebt } from "@/types/group.interface";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, Modal as PaperModal, Portal, Text, TextInput } from "react-native-paper";

interface IGroupSettleModalProps {
    isVisible: boolean;
    onClose: () => void;
    groupId: number;
    members: IGroupMember[];
    prefillDebt?: ISimplifiedDebt | null;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { key: "Cash", label: "Cash", icon: "cash" },
    { key: "UPI", label: "UPI / GPay", icon: "qrcode-scan" },
    { key: "Bank Transfer", label: "Bank Transfer", icon: "bank" },
    { key: "Cheque", label: "Cheque", icon: "checkbook" },
    { key: "Other", label: "Other", icon: "dots-horizontal" },
];

export default function GroupSettleModal({
    isVisible,
    onClose,
    groupId,
    members,
    prefillDebt,
    onSuccess,
}: IGroupSettleModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const [payerUserId, setPayerUserId] = useState<number>(0);
    const [payeeUserId, setPayeeUserId] = useState<number>(0);
    const [amountText, setAmountText] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [customRemark, setCustomRemark] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!isVisible) return;

        if (prefillDebt) {
            setPayerUserId(prefillDebt.fromUserId);
            setPayeeUserId(prefillDebt.toUserId);
            setAmountText(String(prefillDebt.amount));
        } else {
            setPayerUserId(0); // "You" by default
            const other = members.find((m) => m.userId !== 0);
            setPayeeUserId(other ? other.userId : 0);
            setAmountText("");
        }
        setPaymentMethod("Cash");
        setCustomRemark("");
        setErrorMsg("");
    }, [isVisible, prefillDebt, members]);

    const payerName = useMemo(() => {
        const m = members.find((x) => x.userId === payerUserId);
        return m ? m.userName : (payerUserId === 0 ? "You" : `User #${payerUserId}`);
    }, [members, payerUserId]);

    const payeeName = useMemo(() => {
        const m = members.find((x) => x.userId === payeeUserId);
        return m ? m.userName : (payeeUserId === 0 ? "You" : `User #${payeeUserId}`);
    }, [members, payeeUserId]);

    const amount = useMemo(() => {
        const val = parseFloat(amountText.replace(/,/g, ""));
        return isNaN(val) ? 0 : Math.round(val);
    }, [amountText]);

    const isYouInvolved = payerUserId === 0 || payeeUserId === 0;

    const handleConfirm = () => {
        if (amount <= 0) {
            setErrorMsg("Please enter a valid settlement amount");
            return;
        }
        if (payerUserId === payeeUserId) {
            setErrorMsg("Payer and payee cannot be the same person");
            return;
        }

        const description = customRemark.trim()
            ? customRemark.trim()
            : `${payerName} paid ${payeeName} (${paymentMethod})`;

        try {
            DatabaseService.createGroupExpense(db, {
                groupId,
                description,
                totalAmount: amount,
                paidByUserId: payerUserId,
                splitType: "exact",
                splits: [{ userId: payeeUserId, amount }],
                isSettlement: true,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to record settlement:", err);
            setErrorMsg("Failed to record settlement");
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
                            <View style={[styles.iconBox, { backgroundColor: colors.success + "18" }]}>
                                <Icon source="check-all" size={22} color={colors.successText} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.onSurface }]}>Record Settle Up</Text>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                    Record cash or UPI payment between members
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                            <Icon source="close" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 520 }}
                        contentContainerStyle={{ padding: 18 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Who Paid */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>WHO PAID?</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 16, marginBottom: 16 }}
                        >
                            {members.map((m) => {
                                const isSelected = payerUserId === m.userId;
                                return (
                                    <Pressable
                                        key={m.userId}
                                        onPress={() => {
                                            setPayerUserId(m.userId);
                                            if (errorMsg) setErrorMsg("");
                                        }}
                                        style={({ pressed }) => ({
                                            paddingVertical: 7,
                                            paddingHorizontal: 12,
                                            borderRadius: 16,
                                            backgroundColor: isSelected ? colors.primary : colors.surface,
                                            borderWidth: 1,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
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

                        {/* Who Received */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>WHO RECEIVED?</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 16, marginBottom: 16 }}
                        >
                            {members
                                .filter((m) => m.userId !== payerUserId)
                                .map((m) => {
                                    const isSelected = payeeUserId === m.userId;
                                    return (
                                        <Pressable
                                            key={m.userId}
                                            onPress={() => {
                                                setPayeeUserId(m.userId);
                                                if (errorMsg) setErrorMsg("");
                                            }}
                                            style={({ pressed }) => ({
                                                paddingVertical: 7,
                                                paddingHorizontal: 12,
                                                borderRadius: 16,
                                                backgroundColor: isSelected ? colors.success : colors.surface,
                                                borderWidth: 1,
                                                borderColor: isSelected ? colors.success : colors.border,
                                                opacity: pressed ? 0.8 : 1,
                                            })}
                                        >
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

                        {/* Amount */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>SETTLED AMOUNT (₹)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="0"
                            value={amountText}
                            onChangeText={(t) => {
                                setAmountText(t);
                                if (errorMsg) setErrorMsg("");
                            }}
                            keyboardType="numeric"
                            style={{ backgroundColor: colors.surface, fontSize: 18, fontWeight: "800", marginBottom: 12 }}
                            dense
                            left={<TextInput.Icon icon="currency-inr" color={colors.successText} />}
                        />

                        {/* Payment Method Quick Chips */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>PAYMENT METHOD</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 8, marginBottom: 14 }}
                        >
                            {PAYMENT_METHODS.map((m) => {
                                const isSelected = paymentMethod === m.key;
                                return (
                                    <Pressable
                                        key={m.key}
                                        onPress={() => setPaymentMethod(m.key)}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                            paddingVertical: 7,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            backgroundColor: isSelected ? colors.primary : colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Icon
                                            source={m.icon}
                                            size={14}
                                            color={isSelected ? colors.onPrimary : colors.onSurfaceVariant}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected ? colors.onPrimary : colors.onSurface,
                                            }}
                                        >
                                            {m.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {/* Custom Remark / Note */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>NOTE / REMARK (OPTIONAL)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder={`${payerName} paid ${payeeName} (${paymentMethod})`}
                            value={customRemark}
                            onChangeText={(t) => setCustomRemark(t)}
                            style={{ backgroundColor: colors.surface, fontSize: 13, marginBottom: 14 }}
                            dense
                            left={<TextInput.Icon icon="note-text-outline" color={colors.onSurfaceMuted} />}
                        />

                        {/* Summary / Impact Pill */}
                        <View
                            style={{
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: colors.chipAccountBg,
                                borderWidth: 1,
                                borderColor: colors.primary + "30",
                                marginBottom: 10,
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 4 }}>
                                Settlement Summary:
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.onSurface, lineHeight: 18 }}>
                                <Text style={{ fontWeight: "800" }}>{payerName}</Text> paid{" "}
                                <Text style={{ fontWeight: "800", color: colors.successText }}>
                                    ₹{amount.toLocaleString("en-IN")}
                                </Text>{" "}
                                to <Text style={{ fontWeight: "800" }}>{payeeName}</Text> via{" "}
                                <Text style={{ fontWeight: "700" }}>{paymentMethod}</Text>.
                            </Text>

                            {isYouInvolved && (
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 6 }}>
                                    ✓ This will automatically update your personal ledger balance with {payerUserId === 0 ? payeeName : payerName}.
                                </Text>
                            )}
                        </View>

                        {!!errorMsg && (
                            <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
                                {errorMsg}
                            </Text>
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
                            onPress={handleConfirm}
                            buttonColor={colors.success}
                            textColor="#FFFFFF"
                            style={{ borderRadius: 12, overflow: "hidden" }}
                            contentStyle={{ paddingHorizontal: 20, height: 42 }}
                            labelStyle={{ fontWeight: "700" }}
                            icon="check-all"
                        >
                            Confirm Settlement
                        </Button>
                    </View>
                </KeyboardAvoidingView>
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
