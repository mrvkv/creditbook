import { useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { GroupCategory, IGroup } from "@/types/group.interface";
import { IUser } from "@/types/user.interface";
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

interface IGroupModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSaveSuccess: (groupId: number) => void;
    group?: IGroup;
}

const CATEGORIES: { key: GroupCategory; label: string; icon: string; color: string }[] = [
    { key: "trip", label: "Trip", icon: "airplane", color: "#3B82F6" },
    { key: "home", label: "Home", icon: "home-outline", color: "#10B981" },
    { key: "couple", label: "Couple", icon: "heart-outline", color: "#EC4899" },
    { key: "other", label: "Other", icon: "folder-outline", color: "#F59E0B" },
];

export default function GroupModal({ isVisible, onClose, onSaveSuccess, group }: IGroupModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const isEdit = !!group;
    const [name, setName] = useState("");
    const [category, setCategory] = useState<GroupCategory>("trip");
    const [allUsers, setAllUsers] = useState<IUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const nameInputRef = useRef<any>(null);

    useEffect(() => {
        if (!isVisible) return;

        const users = DatabaseService.getUsers(db);
        setAllUsers(users);

        if (group) {
            setName(group.name);
            setCategory(group.category || "trip");
            const members = DatabaseService.getGroupMembers(db, group.groupId);
            setSelectedUserIds(members.filter((m) => m.userId > 0).map((m) => m.userId));
        } else {
            setName("");
            setCategory("trip");
            setSelectedUserIds([]);
        }
        setErrorMsg("");
        setSearchQuery("");

        setTimeout(() => {
            nameInputRef.current?.focus?.();
        }, 150);
    }, [isVisible, group, db]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allUsers;
        return allUsers.filter((u) => u.name.toLowerCase().includes(q));
    }, [allUsers, searchQuery]);

    const toggleMember = (userId: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
        if (errorMsg) setErrorMsg("");
    };

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setErrorMsg("Please enter a group name");
            return;
        }

        if (isEdit && group) {
            DatabaseService.updateGroup(db, group.groupId, trimmedName, category);
            // Sync members
            const currentMembers = DatabaseService.getGroupMembers(db, group.groupId);
            const currentIds = currentMembers.filter((m) => m.userId > 0).map((m) => m.userId);

            // Added
            for (const id of selectedUserIds) {
                if (!currentIds.includes(id)) {
                    DatabaseService.addMemberToGroup(db, group.groupId, id);
                }
            }
            // Removed
            for (const id of currentIds) {
                if (!selectedUserIds.includes(id)) {
                    DatabaseService.removeMemberFromGroup(db, group.groupId, id);
                }
            }
            onSaveSuccess(group.groupId);
        } else {
            const newGroupId = DatabaseService.createGroup(db, trimmedName, category, selectedUserIds);
            onSaveSuccess(newGroupId);
        }
        onClose();
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
                            <View
                                style={[
                                    styles.iconBox,
                                    { backgroundColor: colors.primary + "18" },
                                ]}
                            >
                                <Icon source="account-group" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.onSurface }]}>
                                    {isEdit ? "Edit Group" : "Create New Group"}
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                                    Split bills and track shared group expenses
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                            <Icon source="close" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 460 }}
                        contentContainerStyle={{ padding: 18 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Group Name Input */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            GROUP NAME
                        </Text>
                        <TextInput
                            ref={nameInputRef}
                            mode="outlined"
                            placeholder="e.g. Goa Trip, Flat 304, Office Lunch"
                            value={name}
                            onChangeText={(t) => {
                                setName(t);
                                if (errorMsg) setErrorMsg("");
                            }}
                            style={{ backgroundColor: colors.surface, marginBottom: 6 }}
                            dense
                            error={!!errorMsg && !name.trim()}
                        />
                        {!!errorMsg && (
                            <Text style={{ color: colors.danger, fontSize: 11, marginBottom: 10, fontWeight: "600" }}>
                                {errorMsg}
                            </Text>
                        )}

                        {/* Category Selector */}
                        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
                            CATEGORY
                        </Text>
                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                            {CATEGORIES.map((cat) => {
                                const isSelected = category === cat.key;
                                return (
                                    <Pressable
                                        key={cat.key}
                                        onPress={() => setCategory(cat.key)}
                                        style={({ pressed }) => ({
                                            flex: 1,
                                            paddingVertical: 8,
                                            paddingHorizontal: 6,
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? cat.color + "18" : colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? cat.color : colors.border,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 4,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Icon source={cat.icon} size={18} color={isSelected ? cat.color : colors.onSurfaceMuted} />
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected ? cat.color : colors.onSurfaceVariant,
                                            }}
                                        >
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Member Selection */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginBottom: 0 }]}>
                                GROUP MEMBERS
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                                {selectedUserIds.length + 1} members (You + {selectedUserIds.length})
                            </Text>
                        </View>

                        {/* "You" is always included note */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 10,
                                borderRadius: 10,
                                backgroundColor: colors.chipAccountBg,
                                borderWidth: 1,
                                borderColor: colors.primary + "30",
                                marginBottom: 10,
                                gap: 8,
                            }}
                        >
                            <Icon source="account-check" size={18} color={colors.primary} />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary, flex: 1 }}>
                                You (Owner) is automatically included
                            </Text>
                        </View>

                        {/* Search existing accounts */}
                        {allUsers.length > 5 && (
                            <TextInput
                                mode="outlined"
                                placeholder="Search accounts to add..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                dense
                                left={<TextInput.Icon icon="magnify" color={colors.onSurfaceMuted} />}
                                style={{ backgroundColor: colors.surface, marginBottom: 10 }}
                            />
                        )}

                        {/* List of members to toggle */}
                        {filteredUsers.length === 0 ? (
                            <View style={{ padding: 16, alignItems: "center" }}>
                                <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, textAlign: "center" }}>
                                    {allUsers.length === 0
                                        ? "No accounts found in your ledger. You can create the group now and add members later."
                                        : "No accounts match your search."}
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 6 }}>
                                {filteredUsers.map((u) => {
                                    const isSelected = selectedUserIds.includes(u.userId);
                                    return (
                                        <Pressable
                                            key={u.userId}
                                            onPress={() => toggleMember(u.userId)}
                                            style={({ pressed }) => ({
                                                flexDirection: "row",
                                                alignItems: "center",
                                                paddingVertical: 8,
                                                paddingHorizontal: 12,
                                                borderRadius: 10,
                                                backgroundColor: isSelected ? colors.primary + "12" : colors.surface,
                                                borderWidth: 1,
                                                borderColor: isSelected ? colors.primary + "60" : colors.border,
                                                opacity: pressed ? 0.8 : 1,
                                                justifyContent: "space-between",
                                            })}
                                        >
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                <View
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 14,
                                                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: "800",
                                                            color: isSelected ? "#FFFFFF" : colors.onSurfaceVariant,
                                                        }}
                                                    >
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>
                                                    {u.name}
                                                </Text>
                                            </View>
                                            <Checkbox.Android
                                                status={isSelected ? "checked" : "unchecked"}
                                                color={colors.primary}
                                                onPress={() => toggleMember(u.userId)}
                                            />
                                        </Pressable>
                                    );
                                })}
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
                            {isEdit ? "Save Changes" : "Create Group"}
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
