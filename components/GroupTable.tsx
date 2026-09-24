import EmptyState from "@/components/EmptyState";
import { useAppTheme } from "@/hooks/useAppTheme";
import { GroupCategory, IGroup } from "@/types/group.interface";
import { formatDateLabel } from "@/utils/date.util";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";

interface IGroupTableProps {
    readonly groups: IGroup[];
    readonly onViewGroup: (group: IGroup) => void;
    readonly onEditGroup: (group: IGroup) => void;
    readonly onDeleteGroup: (group: IGroup) => void;
    readonly onCreateGroup: () => void;
}

const CATEGORY_ICONS: Record<GroupCategory, { icon: string; color: string; bg: string }> = {
    trip: { icon: "airplane", color: "#2563EB", bg: "#EFF6FF" },
    home: { icon: "home-outline", color: "#059669", bg: "#ECFDF5" },
    couple: { icon: "heart-outline", color: "#DB2777", bg: "#FDF2F8" },
    other: { icon: "folder-outline", color: "#D97706", bg: "#FFFBEB" },
};

// ─── Summary Chip Component (Exact match with UserTable and Transactions) ────
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

export default function GroupTable({
    groups,
    onViewGroup,
    onEditGroup,
    onDeleteGroup,
    onCreateGroup,
}: IGroupTableProps) {
    const { colors, isDark } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Summary calculations
    const summary = useMemo(() => {
        const count = groups.length;
        const totalSpend = groups.reduce((acc, g) => acc + (g.totalSpend || 0), 0);
        const receivable = groups.filter((g) => (g.userNetBalance || 0) > 0).reduce((acc, g) => acc + (g.userNetBalance || 0), 0);
        const payable = groups.filter((g) => (g.userNetBalance || 0) < 0).reduce((acc, g) => acc + Math.abs(g.userNetBalance || 0), 0);
        const tripCount = groups.filter((g) => g.category === "trip").length;
        const homeCount = groups.filter((g) => g.category === "home").length;
        const coupleCount = groups.filter((g) => g.category === "couple").length;
        const otherCount = groups.filter((g) => g.category === "other").length;
        return { count, totalSpend, receivable, payable, tripCount, homeCount, coupleCount, otherCount };
    }, [groups]);

    const filteredGroups = useMemo(() => {
        let list = [...groups];

        if (selectedCategory === "receivable") {
            list = list.filter((g) => (g.userNetBalance || 0) > 0);
        } else if (selectedCategory === "payable") {
            list = list.filter((g) => (g.userNetBalance || 0) < 0);
        } else if (selectedCategory !== "all") {
            list = list.filter((g) => g.category === selectedCategory);
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter((g) => g.name.toLowerCase().includes(q));
        }

        return list;
    }, [groups, selectedCategory, searchQuery]);

    if (!groups || groups.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <EmptyState
                    icon="account-group-outline"
                    title="No groups yet"
                    subtitle="Create a group to split trip expenses, house rent, or shared bills with friends."
                    actionLabel="Create First Group"
                    actionIcon="plus"
                    onAction={onCreateGroup}
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Search Input Bar (Identical to Accounts Screen and Global Timeline) */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, backgroundColor: colors.surface }}>
                <TextInput
                    mode="outlined"
                    placeholder="Search groups by name..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    dense
                    left={<TextInput.Icon icon="magnify" color={colors.onSurfaceMuted} />}
                    right={
                        searchQuery ? (
                            <TextInput.Icon
                                icon="close-circle"
                                color={colors.onSurfaceMuted}
                                onPress={() => setSearchQuery("")}
                            />
                        ) : null
                    }
                    outlineStyle={{ borderRadius: 12, borderColor: colors.border }}
                    contentStyle={{ fontSize: 14 }}
                    style={{ backgroundColor: colors.surface }}
                />
            </View>

            {/* Summary & Filter Bar (Identical design tokens to Home Screen) */}
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
                        label="Groups"
                        value={String(summary.count)}
                        bgColor={colors.chipAccountBg}
                        textColor={colors.primary}
                        borderColor={colors.primary}
                        isSelected={selectedCategory === "all"}
                        onPress={() => setSelectedCategory("all")}
                    />
                    {summary.receivable > 0 && (
                        <SummaryChip
                            icon="arrow-down-bold-circle-outline"
                            label="Receivable"
                            value={`₹${summary.receivable.toLocaleString("en-IN")}`}
                            bgColor={colors.successBg}
                            textColor={colors.successText}
                            borderColor={colors.success}
                            isSelected={selectedCategory === "receivable"}
                            onPress={() => setSelectedCategory((prev) => (prev === "receivable" ? "all" : "receivable"))}
                        />
                    )}
                    {summary.payable > 0 && (
                        <SummaryChip
                            icon="arrow-up-bold-circle-outline"
                            label="Payable"
                            value={`₹${summary.payable.toLocaleString("en-IN")}`}
                            bgColor={colors.dangerBg}
                            textColor={colors.dangerText}
                            borderColor={colors.danger}
                            isSelected={selectedCategory === "payable"}
                            onPress={() => setSelectedCategory((prev) => (prev === "payable" ? "all" : "payable"))}
                        />
                    )}
                    <SummaryChip
                        icon="airplane"
                        label="Trips"
                        value={String(summary.tripCount)}
                        bgColor={colors.surface}
                        textColor={colors.onSurface}
                        borderColor={colors.border}
                        isSelected={selectedCategory === "trip"}
                        onPress={() => setSelectedCategory((prev) => (prev === "trip" ? "all" : "trip"))}
                    />
                    <SummaryChip
                        icon="home-outline"
                        label="Home"
                        value={String(summary.homeCount)}
                        bgColor={colors.surface}
                        textColor={colors.onSurface}
                        borderColor={colors.border}
                        isSelected={selectedCategory === "home"}
                        onPress={() => setSelectedCategory((prev) => (prev === "home" ? "all" : "home"))}
                    />
                    <SummaryChip
                        icon="heart-outline"
                        label="Couple"
                        value={String(summary.coupleCount)}
                        bgColor={colors.surface}
                        textColor={colors.onSurface}
                        borderColor={colors.border}
                        isSelected={selectedCategory === "couple"}
                        onPress={() => setSelectedCategory((prev) => (prev === "couple" ? "all" : "couple"))}
                    />
                    <SummaryChip
                        icon="folder-outline"
                        label="Other"
                        value={String(summary.otherCount)}
                        bgColor={colors.surface}
                        textColor={colors.onSurface}
                        borderColor={colors.border}
                        isSelected={selectedCategory === "other"}
                        onPress={() => setSelectedCategory((prev) => (prev === "other" ? "all" : "other"))}
                    />
                </ScrollView>
            </View>

            {/* List of Groups */}
            <FlatList
                data={filteredGroups}
                keyExtractor={(item) => String(item.groupId)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8, paddingBottom: 80 }}
                ListEmptyComponent={
                    <EmptyState
                        icon="account-search-outline"
                        title="No groups found"
                        subtitle={searchQuery ? `No groups match "${searchQuery}"` : "No groups found in this category."}
                    />
                }
                renderItem={({ item }) => {
                    const catMeta = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.trip;
                    const balance = item.userNetBalance || 0;
                    const isSettled = balance === 0;
                    const isReceivable = balance > 0;

                    const balanceColor = isSettled ? colors.onSurfaceMuted : isReceivable ? colors.successText : colors.dangerText;
                    const balanceBg = isSettled ? colors.settledBg : isReceivable ? colors.successBg : colors.dangerBg;
                    const balanceBorder = isSettled ? colors.border : isReceivable ? colors.success : colors.danger;
                    const balanceLabel = isSettled ? "Settled" : isReceivable ? "Receivable" : "Payable";
                    const displayAmount = `₹${Math.abs(balance).toLocaleString("en-IN")}`;

                    return (
                        <Pressable
                            onPress={() => onViewGroup(item)}
                            style={({ pressed }) => ({
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
                                marginHorizontal: 16,
                                marginVertical: 5,
                                borderRadius: 14,
                                padding: 14,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                shadowColor: isDark ? "#000" : "#6366F1",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isDark ? 0.25 : 0.07,
                                shadowRadius: 6,
                                elevation: 2,
                            })}
                        >
                            {/* Category Icon Avatar */}
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: isDark ? catMeta.color + "22" : catMeta.bg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1.5,
                                    borderColor: catMeta.color + "40",
                                    marginRight: 12,
                                }}
                            >
                                <Icon source={catMeta.icon} size={22} color={catMeta.color} />
                            </View>

                            {/* Group Name & Subtitle */}
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text
                                    style={{
                                        color: colors.onSurface,
                                        fontWeight: "700",
                                        fontSize: 15,
                                        marginBottom: 2,
                                    }}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                    <Icon source="account-multiple-outline" size={13} color={colors.onSurfaceMuted} />
                                    <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, fontWeight: "600" }}>
                                        {item.memberCount || 1} {item.memberCount === 1 ? "member" : "members"}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: colors.onSurfaceMuted }}>•</Text>
                                    <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>
                                        ₹{(item.totalSpend || 0).toLocaleString("en-IN")} spent
                                    </Text>
                                </View>
                            </View>

                            {/* Right Side: Balance Badge Pill (Identical to UserRow) */}
                            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                                <View
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        backgroundColor: balanceBg,
                                        borderWidth: 1,
                                        borderColor: balanceBorder + "60",
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: balanceColor,
                                            fontWeight: "800",
                                            fontSize: 14,
                                        }}
                                    >
                                        {displayAmount}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }}>
                                    <View
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: balanceColor,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: balanceColor,
                                            fontSize: 11,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {balanceLabel}
                                    </Text>
                                </View>
                            </View>

                            {/* Action buttons (Identical to UserTable) */}
                            <View style={{ flexDirection: "row", gap: 2, marginLeft: 6 }}>
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onEditGroup(item);
                                    }}
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
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onDeleteGroup(item);
                                    }}
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
                }}
            />
        </View>
    );
}
