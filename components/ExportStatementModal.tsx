import DateTimePickerModal from "@/components/DateTimePickerModal";
import { useAppTheme } from "@/hooks/useAppTheme";
import PdfService, { IStatementFilterOptions } from "@/services/pdf.service";
import { ITransaction } from "@/types/transaction.interface";
import { formatDateLabel } from "@/utils/date.util";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button, Checkbox, Icon, Modal as PaperModal, Portal, Text } from "react-native-paper";

interface IExportStatementModalProps {
    readonly isVisible: boolean;
    readonly onClose: () => void;
    readonly userName?: string;
    readonly transactions: ITransaction[];
}

export default function ExportStatementModal({ isVisible, onClose, userName, transactions }: IExportStatementModalProps) {
    const { colors } = useAppTheme();

    const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
    const [includeSettled, setIncludeSettled] = useState(true);
    const [dateRangePreset, setDateRangePreset] = useState<"all" | "this_month" | "last_month" | "last_30_days" | "last_90_days" | "custom">("all");

    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(1); // 1st of current month
        return d;
    });
    const [endDate, setEndDate] = useState<Date>(() => new Date());

    // Custom date picker sub-modal state
    const [pickingDateType, setPickingDateType] = useState<"start" | "end" | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Current filter options
    const currentOptions: IStatementFilterOptions = useMemo(() => {
        return {
            userName,
            typeFilter,
            includeSettled,
            dateRangePreset,
            startDate,
            endDate,
        };
    }, [userName, typeFilter, includeSettled, dateRangePreset, startDate, endDate]);

    // Live preview filtered data
    const matchedTransactions = useMemo(() => {
        return PdfService.filterTransactions(transactions, currentOptions);
    }, [transactions, currentOptions]);

    const summary = useMemo(() => {
        return PdfService.calculateSummary(matchedTransactions);
    }, [matchedTransactions]);

    async function handleGeneratePdf() {
        if (matchedTransactions.length === 0) {
            Alert.alert("No Entries", "There are no transactions matching your selected filters.");
            return;
        }

        setIsGenerating(true);
        try {
            await PdfService.exportAndShareStatement(transactions, currentOptions);
            setIsGenerating(false);
            onClose();
        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert("Export Error", error?.message || "Failed to generate PDF statement.");
        }
    }

    return (
        <Portal>
            <PaperModal
                visible={isVisible}
                onDismiss={onClose}
                contentContainerStyle={{
                    backgroundColor: colors.modalBg,
                    marginHorizontal: 16,
                    borderRadius: 22,
                    padding: 0,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                    elevation: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    maxHeight: 660,
                }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                    {/* Header */}
                    <View
                        style={{
                            paddingTop: 18,
                            paddingBottom: 14,
                            paddingHorizontal: 20,
                            backgroundColor: colors.surfaceVariant,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        backgroundColor: colors.dangerBg,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: colors.danger + "40",
                                    }}
                                >
                                    <Icon source="file-pdf-box" size={22} color={colors.danger} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>Export Statement</Text>
                                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.onSurfaceVariant }}>
                                        {userName ? `${userName}'s Ledger Statement` : "Universal Ledger Statement"}
                                    </Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={onClose}
                                hitSlop={8}
                                style={({ pressed }) => ({
                                    padding: 4,
                                    borderRadius: 12,
                                    backgroundColor: pressed ? colors.border : "transparent",
                                })}
                            >
                                <Icon source="close" size={20} color={colors.onSurfaceMuted} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                        {/* 1. Transaction Type Section */}
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "800",
                                color: colors.onSurfaceVariant,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginBottom: 8,
                            }}
                        >
                            Transaction Type
                        </Text>
                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                            {[
                                { key: "all" as const, label: "All Types", icon: "swap-horizontal", activeColor: colors.primary },
                                { key: "debit" as const, label: "Gave (Debit)", icon: "arrow-up", activeColor: colors.danger },
                                { key: "credit" as const, label: "Got (Credit)", icon: "arrow-down", activeColor: colors.success },
                            ].map((opt) => {
                                const isSelected = typeFilter === opt.key;
                                return (
                                    <Pressable
                                        key={opt.key}
                                        onPress={() => setTypeFilter(opt.key)}
                                        style={({ pressed }) => ({
                                            flex: 1,
                                            paddingVertical: 8,
                                            paddingHorizontal: 8,
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? opt.activeColor + "18" : colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? opt.activeColor : colors.border,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexDirection: "row",
                                            gap: 4,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Icon source={opt.icon} size={14} color={isSelected ? opt.activeColor : colors.onSurfaceMuted} />
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected ? opt.activeColor : colors.onSurfaceVariant,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* 2. Settled Entries Toggle */}
                        <Pressable
                            onPress={() => setIncludeSettled((prev) => !prev)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: colors.surface,
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginBottom: 16,
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>Include Settled History</Text>
                                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>Include entries that have been settled up</Text>
                            </View>
                            <Checkbox.Android
                                status={includeSettled ? "checked" : "unchecked"}
                                color={colors.primary}
                                onPress={() => setIncludeSettled((prev) => !prev)}
                            />
                        </Pressable>

                        {/* 3. Date Range Presets */}
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "800",
                                color: colors.onSurfaceVariant,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                marginBottom: 8,
                            }}
                        >
                            Time Range
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {[
                                { key: "all" as const, label: "All Time" },
                                { key: "this_month" as const, label: "This Month" },
                                { key: "last_month" as const, label: "Last Month" },
                                { key: "last_30_days" as const, label: "Last 30 Days" },
                                { key: "last_90_days" as const, label: "Last 90 Days" },
                                { key: "custom" as const, label: "Custom Range" },
                            ].map((preset) => {
                                const isSelected = dateRangePreset === preset.key;
                                return (
                                    <Pressable
                                        key={preset.key}
                                        onPress={() => setDateRangePreset(preset.key)}
                                        style={({ pressed }) => ({
                                            paddingVertical: 6,
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
                                                fontSize: 11,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                                            }}
                                        >
                                            {preset.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Custom Date Pickers (Shown only when Custom Range is active) */}
                        {dateRangePreset === "custom" && (
                            <View
                                style={{
                                    backgroundColor: colors.surfaceVariant,
                                    padding: 12,
                                    borderRadius: 12,
                                    marginBottom: 16,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            >
                                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                                    {/* Start Date */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant, marginBottom: 4 }}>FROM DATE</Text>
                                        <Pressable
                                            onPress={() => setPickingDateType("start")}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingVertical: 8,
                                                paddingHorizontal: 10,
                                                borderRadius: 10,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                            }}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>{formatDateLabel(startDate)}</Text>
                                            <Icon source="calendar" size={16} color={colors.primary} />
                                        </Pressable>
                                    </View>

                                    {/* Arrow Separator */}
                                    <View style={{ paddingTop: 14 }}>
                                        <Icon source="arrow-right" size={16} color={colors.onSurfaceMuted} />
                                    </View>

                                    {/* End Date */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant, marginBottom: 4 }}>TO DATE</Text>
                                        <Pressable
                                            onPress={() => setPickingDateType("end")}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingVertical: 8,
                                                paddingHorizontal: 10,
                                                borderRadius: 10,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                            }}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>{formatDateLabel(endDate)}</Text>
                                            <Icon source="calendar" size={16} color={colors.primary} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* 4. Live Summary Matching Card */}
                        <View
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: 14,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginBottom: 14,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceVariant }}>Matching Entries:</Text>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>{summary.totalCount} transactions</Text>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>Total Gave (Dr):</Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.danger }}>₹{summary.totalDebit.toLocaleString("en-IN")}</Text>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>Total Got (Cr):</Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.successText }}>
                                    ₹{summary.totalCredit.toLocaleString("en-IN")}
                                </Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 12, fontWeight: "800", color: colors.onSurface }}>Net Balance:</Text>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "800",
                                        color: summary.netBalance > 0 ? colors.successText : summary.netBalance < 0 ? colors.danger : colors.onSurfaceVariant,
                                    }}
                                >
                                    {summary.netBalance > 0 ? "+" : ""}₹{summary.netBalance.toLocaleString("en-IN")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions Footer */}
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            gap: 10,
                            paddingHorizontal: 20,
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                        }}
                    >
                        <Button
                            mode="outlined"
                            onPress={onClose}
                            textColor={colors.onSurfaceVariant}
                            style={{ borderColor: colors.border, borderRadius: 12, overflow: "hidden" }}
                            contentStyle={{ paddingHorizontal: 16, height: 42 }}
                            labelStyle={{ fontWeight: "700" }}
                            disabled={isGenerating}
                        >
                            Cancel
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleGeneratePdf}
                            buttonColor={colors.primary}
                            textColor={colors.onPrimary}
                            style={{ borderRadius: 12, overflow: "hidden" }}
                            contentStyle={{ paddingHorizontal: 18, height: 42 }}
                            labelStyle={{ fontWeight: "700" }}
                            icon="file-download-outline"
                            loading={isGenerating}
                            disabled={isGenerating || matchedTransactions.length === 0}
                        >
                            {isGenerating ? "Generating..." : "Generate PDF"}
                        </Button>
                    </View>
                </ScrollView>

                {/* Sub-modal for Custom Date Selection */}
                {pickingDateType !== null && (
                    <DateTimePickerModal
                        isVisible={true}
                        onClose={() => setPickingDateType(null)}
                        value={pickingDateType === "start" ? startDate : endDate}
                        onConfirm={(selected) => {
                            if (pickingDateType === "start") {
                                setStartDate(selected);
                            } else {
                                setEndDate(selected);
                            }
                            setPickingDateType(null);
                        }}
                        title={pickingDateType === "start" ? "Select Start Date" : "Select End Date"}
                    />
                )}
            </PaperModal>
        </Portal>
    );
}
