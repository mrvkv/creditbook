import { useAppTheme } from "@/hooks/useAppTheme";
import { DAYS_OF_WEEK, formatDateTime, MONTH_NAMES } from "@/utils/date.util";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Icon, Modal as PaperModal, Portal, Text } from "react-native-paper";

interface IDateTimePickerModalProps {
    readonly isVisible: boolean;
    readonly onClose: () => void;
    readonly value: Date;
    readonly onConfirm: (date: Date) => void;
    readonly title?: string;
}

export default function DateTimePickerModal({
    isVisible,
    onClose,
    value,
    onConfirm,
    title = "Transaction Date & Time",
}: IDateTimePickerModalProps) {
    const { colors } = useAppTheme();

    // Working date initialized when opened
    const [workingDate, setWorkingDate] = useState<Date>(() => new Date(value));
    const [activeTab, setActiveTab] = useState<"date" | "time">("date");

    // Calendar month/year navigation state
    const [viewYear, setViewYear] = useState(() => value.getFullYear());
    const [viewMonth, setViewMonth] = useState(() => value.getMonth());

    // Sync working date when modal opens
    React.useEffect(() => {
        if (isVisible) {
            const d = new Date(value);
            setWorkingDate(d);
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
            setActiveTab("date");
        }
    }, [isVisible, value]);

    // Calendar calculation
    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth + 1, 0).getDate();
    }, [viewYear, viewMonth]);

    const firstDayOfWeek = useMemo(() => {
        return new Date(viewYear, viewMonth, 1).getDay();
    }, [viewYear, viewMonth]);

    function prevMonth() {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    }

    function nextMonth() {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    }

    function handleSelectDay(day: number) {
        const next = new Date(workingDate);
        next.setFullYear(viewYear, viewMonth, day);
        setWorkingDate(next);
    }

    function handlePresetDay(offsetDays: number) {
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetDays);
        const next = new Date(workingDate);
        next.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());
        setWorkingDate(next);
        setViewYear(target.getFullYear());
        setViewMonth(target.getMonth());
    }

    // Time handling (12-hour clock)
    const hours24 = workingDate.getHours();
    const minutes = workingDate.getMinutes();
    const isPM = hours24 >= 12;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    function setHours12(newHour12: number, pm: boolean = isPM) {
        let h24 = newHour12 % 12;
        if (pm) h24 += 12;
        const next = new Date(workingDate);
        next.setHours(h24);
        setWorkingDate(next);
    }

    function setMinutesVal(newMinutes: number) {
        const normalized = ((newMinutes % 60) + 60) % 60;
        const next = new Date(workingDate);
        next.setMinutes(normalized);
        setWorkingDate(next);
    }

    function toggleAMPM(toPM: boolean) {
        let h24 = hours12 % 12;
        if (toPM) h24 += 12;
        const next = new Date(workingDate);
        next.setHours(h24);
        setWorkingDate(next);
    }

    function handlePresetTime(preset: "now" | "morning" | "noon" | "evening" | "night") {
        const next = new Date(workingDate);
        if (preset === "now") {
            const now = new Date();
            next.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        } else if (preset === "morning") {
            next.setHours(9, 0, 0);
        } else if (preset === "noon") {
            next.setHours(12, 0, 0);
        } else if (preset === "evening") {
            next.setHours(18, 0, 0);
        } else if (preset === "night") {
            next.setHours(21, 0, 0);
        }
        setWorkingDate(next);
    }

    function handleSave() {
        onConfirm(workingDate);
        onClose();
    }

    const todayDate = new Date();
    const isSelectedMonth =
        workingDate.getFullYear() === viewYear && workingDate.getMonth() === viewMonth;
    const isTodayMonth =
        todayDate.getFullYear() === viewYear && todayDate.getMonth() === viewMonth;

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
                    maxHeight: 640,
                }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                    {/* Header Banner */}
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
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Icon source="calendar-clock" size={20} color={colors.primary} />
                                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>
                                    {title}
                                </Text>
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

                        {/* Live Formatted Badge */}
                        <View
                            style={{
                                marginTop: 12,
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                                borderRadius: 12,
                                backgroundColor: colors.chipAccountBg,
                                borderWidth: 1,
                                borderColor: colors.primary + "40",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Icon source="check-decagram-outline" size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: "800", color: colors.primary }}>
                                {formatDateTime(workingDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Mode Switcher Tabs */}
                    <View
                        style={{
                            flexDirection: "row",
                            marginHorizontal: 16,
                            marginTop: 14,
                            marginBottom: 8,
                            borderRadius: 14,
                            backgroundColor: colors.surfaceVariant,
                            padding: 3,
                        }}
                    >
                        <Pressable
                            onPress={() => setActiveTab("date")}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                borderRadius: 12,
                                backgroundColor: activeTab === "date" ? colors.surface : "transparent",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 6,
                                elevation: activeTab === "date" ? 2 : 0,
                            }}
                        >
                            <Icon
                                source="calendar-month-outline"
                                size={16}
                                color={activeTab === "date" ? colors.primary : colors.onSurfaceMuted}
                            />
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: activeTab === "date" ? "800" : "600",
                                    color: activeTab === "date" ? colors.primary : colors.onSurfaceMuted,
                                }}
                            >
                                Date
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setActiveTab("time")}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                borderRadius: 12,
                                backgroundColor: activeTab === "time" ? colors.surface : "transparent",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 6,
                                elevation: activeTab === "time" ? 2 : 0,
                            }}
                        >
                            <Icon
                                source="clock-outline"
                                size={16}
                                color={activeTab === "time" ? colors.primary : colors.onSurfaceMuted}
                            />
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: activeTab === "time" ? "800" : "600",
                                    color: activeTab === "time" ? colors.primary : colors.onSurfaceMuted,
                                }}
                            >
                                Time
                            </Text>
                        </Pressable>
                    </View>

                    {/* ────────────────── DATE PICKER VIEW ────────────────── */}
                    {activeTab === "date" && (
                        <View style={{ paddingHorizontal: 16 }}>
                            {/* Quick Presets */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                            >
                                {[
                                    { label: "Today", offset: 0 },
                                    { label: "Yesterday", offset: 1 },
                                    { label: "2 Days Ago", offset: 2 },
                                    { label: "7 Days Ago", offset: 7 },
                                ].map((preset) => (
                                    <Pressable
                                        key={preset.label}
                                        onPress={() => handlePresetDay(preset.offset)}
                                        style={({ pressed }) => ({
                                            paddingVertical: 5,
                                            paddingHorizontal: 12,
                                            borderRadius: 16,
                                            backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        })}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                                            {preset.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Month & Year Navigation */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginVertical: 10,
                                }}
                            >
                                <Pressable
                                    onPress={prevMonth}
                                    hitSlop={10}
                                    style={({ pressed }) => ({
                                        padding: 8,
                                        borderRadius: 12,
                                        backgroundColor: pressed ? colors.surfaceVariant : "transparent",
                                    })}
                                >
                                    <Icon source="chevron-left" size={24} color={colors.onSurface} />
                                </Pressable>

                                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.onSurface }}>
                                    {MONTH_NAMES[viewMonth]} {viewYear}
                                </Text>

                                <Pressable
                                    onPress={nextMonth}
                                    hitSlop={10}
                                    style={({ pressed }) => ({
                                        padding: 8,
                                        borderRadius: 12,
                                        backgroundColor: pressed ? colors.surfaceVariant : "transparent",
                                    })}
                                >
                                    <Icon source="chevron-right" size={24} color={colors.onSurface} />
                                </Pressable>
                            </View>

                            {/* Weekday Header */}
                            <View style={{ flexDirection: "row", marginBottom: 6 }}>
                                {DAYS_OF_WEEK.map((dayName, idx) => (
                                    <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "800",
                                                color: idx === 0 || idx === 6 ? colors.danger : colors.onSurfaceVariant,
                                            }}
                                        >
                                            {dayName}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Days Grid */}
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {/* Empty offset slots */}
                                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                    <View key={`empty-${i}`} style={{ width: "14.28%", height: 38 }} />
                                ))}

                                {/* Day cells */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = isSelectedMonth && workingDate.getDate() === day;
                                    const isToday = isTodayMonth && todayDate.getDate() === day;

                                    return (
                                        <View
                                            key={`day-${day}`}
                                            style={{ width: "14.28%", height: 38, alignItems: "center", justifyContent: "center" }}
                                        >
                                            <Pressable
                                                onPress={() => handleSelectDay(day)}
                                                style={({ pressed }) => ({
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 17,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: isSelected
                                                        ? colors.primary
                                                        : pressed
                                                        ? colors.primary + "30"
                                                        : "transparent",
                                                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                                                    borderColor: colors.primary,
                                                })}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: isSelected ? "800" : isToday ? "700" : "500",
                                                        color: isSelected
                                                            ? colors.onPrimary
                                                            : isToday
                                                            ? colors.primary
                                                            : colors.onSurface,
                                                    }}
                                                >
                                                    {day}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ────────────────── TIME PICKER VIEW ────────────────── */}
                    {activeTab === "time" && (
                        <View style={{ paddingHorizontal: 16 }}>
                            {/* Quick Presets */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                            >
                                {[
                                    { label: "Current Time", key: "now" as const },
                                    { label: "09:00 AM", key: "morning" as const },
                                    { label: "12:00 PM", key: "noon" as const },
                                    { label: "06:00 PM", key: "evening" as const },
                                    { label: "09:00 PM", key: "night" as const },
                                ].map((preset) => (
                                    <Pressable
                                        key={preset.label}
                                        onPress={() => handlePresetTime(preset.key)}
                                        style={({ pressed }) => ({
                                            paddingVertical: 5,
                                            paddingHorizontal: 12,
                                            borderRadius: 16,
                                            backgroundColor: pressed ? colors.primary + "20" : colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        })}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                                            {preset.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Digital Time Dial / Stepper */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 12,
                                    marginVertical: 18,
                                }}
                            >
                                {/* Hours Column */}
                                <View style={{ alignItems: "center", gap: 6 }}>
                                    <Pressable
                                        onPress={() => setHours12(hours12 === 12 ? 1 : hours12 + 1)}
                                        hitSlop={8}
                                        style={{ padding: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant }}
                                    >
                                        <Icon source="chevron-up" size={20} color={colors.primary} />
                                    </Pressable>
                                    <View
                                        style={{
                                            width: 68,
                                            height: 60,
                                            borderRadius: 16,
                                            backgroundColor: colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: colors.border,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.onSurface }}>
                                            {String(hours12).padStart(2, "0")}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => setHours12(hours12 === 1 ? 12 : hours12 - 1)}
                                        hitSlop={8}
                                        style={{ padding: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant }}
                                    >
                                        <Icon source="chevron-down" size={20} color={colors.primary} />
                                    </Pressable>
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceVariant }}>
                                        HOUR
                                    </Text>
                                </View>

                                {/* Colon Separator */}
                                <Text style={{ fontSize: 32, fontWeight: "900", color: colors.onSurfaceMuted, marginBottom: 18 }}>
                                    :
                                </Text>

                                {/* Minutes Column */}
                                <View style={{ alignItems: "center", gap: 6 }}>
                                    <Pressable
                                        onPress={() => setMinutesVal(minutes + 5)}
                                        hitSlop={8}
                                        style={{ padding: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant }}
                                    >
                                        <Icon source="chevron-up" size={20} color={colors.primary} />
                                    </Pressable>
                                    <View
                                        style={{
                                            width: 68,
                                            height: 60,
                                            borderRadius: 16,
                                            backgroundColor: colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: colors.border,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.onSurface }}>
                                            {String(minutes).padStart(2, "0")}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => setMinutesVal(minutes - 5)}
                                        hitSlop={8}
                                        style={{ padding: 6, borderRadius: 8, backgroundColor: colors.surfaceVariant }}
                                    >
                                        <Icon source="chevron-down" size={20} color={colors.primary} />
                                    </Pressable>
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.onSurfaceVariant }}>
                                        MINUTE
                                    </Text>
                                </View>

                                {/* AM / PM Selector Column */}
                                <View style={{ gap: 8, marginLeft: 8, marginBottom: 18 }}>
                                    <Pressable
                                        onPress={() => toggleAMPM(false)}
                                        style={{
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 12,
                                            backgroundColor: !isPM ? colors.primary : colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: !isPM ? colors.primary : colors.border,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: "800",
                                                color: !isPM ? colors.onPrimary : colors.onSurfaceVariant,
                                            }}
                                        >
                                            AM
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => toggleAMPM(true)}
                                        style={{
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 12,
                                            backgroundColor: isPM ? colors.primary : colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: isPM ? colors.primary : colors.border,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: "800",
                                                color: isPM ? colors.onPrimary : colors.onSurfaceVariant,
                                            }}
                                        >
                                            PM
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Bottom Action Buttons */}
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            gap: 10,
                            paddingHorizontal: 16,
                            marginTop: 12,
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                        }}
                    >
                        <Button
                            mode="outlined"
                            onPress={onClose}
                            textColor={colors.onSurfaceVariant}
                            style={{ borderColor: colors.border, borderRadius: 12 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            buttonColor={colors.primary}
                            textColor={colors.onPrimary}
                            style={{ borderRadius: 12, paddingHorizontal: 8 }}
                            icon="check"
                        >
                            Set Date & Time
                        </Button>
                    </View>
                </ScrollView>
            </PaperModal>
        </Portal>
    );
}
