import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IUser } from "@/types/user.interface";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, Modal as PaperModal, Portal, Text, TextInput } from "react-native-paper";

interface IAccountSettleModalProps {
    isVisible: boolean;
    onClose: () => void;
    user: IUser | null | undefined;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { key: "Cash", label: "Cash", icon: "cash" },
    { key: "UPI", label: "UPI / GPay", icon: "qrcode-scan" },
    { key: "Bank Transfer", label: "Bank Transfer", icon: "bank" },
    { key: "Cheque", label: "Cheque", icon: "checkbook" },
    { key: "Other", label: "Other", icon: "dots-horizontal" },
];

export default function AccountSettleModal({
    isVisible,
    onClose,
    user,
    onSuccess,
}: IAccountSettleModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const [amountText, setAmountText] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [customRemark, setCustomRemark] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const isReceivable = (user?.balance ?? 0) < 0;
    const isPayable = (user?.balance ?? 0) > 0;
    const absBalance = Math.abs(user?.balance ?? 0);

    useEffect(() => {
        if (!isVisible || !user) return;
        setAmountText(String(Math.abs(user.balance || 0)));
        setPaymentMethod("Cash");
        setCustomRemark("");
        setErrorMsg("");
    }, [isVisible, user]);

    const amount = useMemo(() => {
        const val = parseFloat(amountText.replace(/,/g, ""));
        return isNaN(val) ? 0 : Math.round(val);
    }, [amountText]);

    const payerName = isReceivable ? user?.name || "Member" : "You";
    const payeeName = isReceivable ? "You" : user?.name || "Member";

    const finalRemark = useMemo(() => {
        if (customRemark.trim()) {
            return customRemark.trim();
        }
        return `Settled Up (${paymentMethod})`;
    }, [customRemark, paymentMethod]);

    const handleConfirm = () => {
        if (!user) return;

        if (amount <= 0 && absBalance > 0) {
            setErrorMsg("Please enter a valid settlement amount");
            return;
        }

        try {
            DatabaseService.settleAccount(db, user.userId, {
                amount,
                remark: finalRemark,
                date: new Date().toISOString(),
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to settle account:", err);
            setErrorMsg("Failed to settle account. Please try again.");
        }
    };

    if (!user) return null;

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
                                <Text style={[styles.title, { color: colors.onSurface }]}>Settle Up Account</Text>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                    Record balancing settlement transaction
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                            <Icon source="close" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 480 }}
                        contentContainerStyle={{ padding: 18 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Member Direction Card */}
                        <View
                            style={[
                                styles.memberCard,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                                    {(user.name || "U").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.onSurface }} numberOfLines={1}>
                                    {user.name}
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                                    {isReceivable
                                        ? `${user.name} is paying You`
                                        : isPayable
                                        ? `You are paying ${user.name}`
                                        : "Account has zero balance"}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.balanceBadge,
                                    {
                                        backgroundColor: isReceivable
                                            ? colors.success + "15"
                                            : isPayable
                                            ? colors.danger + "15"
                                            : colors.surfaceVariant,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: "800",
                                        color: isReceivable
                                            ? colors.successText
                                            : isPayable
                                            ? colors.dangerText
                                            : colors.onSurfaceVariant,
                                    }}
                                >
                                    {isReceivable ? "Receivable" : isPayable ? "Payable" : "Settled"}
                                </Text>
                            </View>
                        </View>

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
                            style={{ backgroundColor: colors.surface, fontSize: 18, fontWeight: "800", marginBottom: 14 }}
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
                            placeholder={`Settled Up (${paymentMethod})`}
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
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 4 }}>
                                Settlement Summary:
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.onSurface, lineHeight: 18 }}>
                                <Text style={{ fontWeight: "800" }}>{payerName}</Text> pays{" "}
                                <Text style={{ fontWeight: "800", color: colors.successText }}>
                                    ₹{amount.toLocaleString("en-IN")}
                                </Text>{" "}
                                to <Text style={{ fontWeight: "800" }}>{payeeName}</Text> via{" "}
                                <Text style={{ fontWeight: "700" }}>{paymentMethod}</Text>.
                            </Text>

                            <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 16 }}>
                                ✓ Records a balancing {isReceivable ? "Credit (Got)" : "Debit (Gave)"} entry in your ledger and resets net balance to ₹0.
                            </Text>
                        </View>

                        {!!errorMsg && (
                            <Text
                                style={{
                                    color: colors.danger,
                                    fontSize: 11,
                                    fontWeight: "700",
                                    textAlign: "center",
                                    marginBottom: 8,
                                }}
                            >
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
    memberCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
        gap: 10,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
    },
    balanceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
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
