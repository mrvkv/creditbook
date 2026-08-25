import BackupModal from "@/components/BackupModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import HeaderRight from "@/components/HeaderRight";
import { HomeHeaderTitle } from "@/components/HeaderTitle";
import Modal from "@/components/Modal";
import QuickAddModal from "@/components/QuickAddModal";
import UserModal from "@/components/UserModal";
import UserTable, { UserFilterTab } from "@/components/UserTable";
import { ThemeContext, useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IUser } from "@/types/user.interface";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Icon, Portal, Text } from "react-native-paper";

export default function Index() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const appTheme = useAppTheme();
    const { colors } = appTheme;

    const [users, setUsers] = useState<IUser[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isAdd, setIsAdd] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [isSettleSingle, setIsSettleSingle] = useState(false);
    const [isSettleBatch, setIsSettleBatch] = useState(false);
    const [isBackupVisible, setIsBackupVisible] = useState(false);
    const [backupInitialMode, setBackupInitialMode] = useState<"export" | "import">("export");
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser>();
    const [batchUserIds, setBatchUserIds] = useState<number[]>([]);

    const [filterTab, setFilterTab] = useState<UserFilterTab>("all");
    const isSettledTab = filterTab === "settled";

    const [hideSettled, setHideSettled] = useState<boolean>(() => {
        try {
            return DatabaseService.getPreference(db, "hideSettled", "false") === "true";
        } catch {
            return false;
        }
    });

    const toggleHideSettled = useCallback(() => {
        setHideSettled((prev) => {
            const next = !prev;
            DatabaseService.setPreference(db, "hideSettled", String(next));
            return next;
        });
    }, [db]);

    const refreshUserList = useCallback(() => {
        if (__DEV__) {
            DatabaseService.seedSampleData(db);
        }
        setUsers(DatabaseService.getUsers(db));
    }, [db]);

    const closeModals = useCallback(() => {
        setIsVisible(false);
        setIsAdd(false);
        setIsEdit(false);
        setIsDelete(false);
        setIsSettleSingle(false);
        setIsSettleBatch(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshUserList();
        }, [refreshUserList])
    );

    const openBackupModal = useCallback((initialMode: "export" | "import" = "export") => {
        setBackupInitialMode(initialMode);
        setIsBackupVisible(true);
    }, []);

    useLayoutEffect(() => {
        const headerRight = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderRight handler={addUserHandler} onBackupPress={() => openBackupModal("export")} />
            </ThemeContext.Provider>
        );
        const headerTitle = () => (
            <ThemeContext.Provider value={appTheme}>
                <HomeHeaderTitle />
            </ThemeContext.Provider>
        );
        navigation.setOptions({
            headerRight,
            headerTitle,
            headerTitleAlign: "left",
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
        });
    }, [appTheme, openBackupModal]);

    function viewUserHandler(user: IUser): void {
        router.push({ pathname: "/details", params: { userId: user.userId } });
    }

    function addUserHandler(): void {
        setIsAdd(true);
        setIsEdit(false);
        setIsDelete(false);
        setIsSettleSingle(false);
        setIsSettleBatch(false);
        setIsVisible(true);
    }

    function deleteUserHandler(user: IUser): void {
        setIsAdd(false);
        setIsEdit(false);
        setIsSettleSingle(false);
        setIsSettleBatch(false);
        setIsDelete(true);
        setSelectedUser(user);
        setIsVisible(true);
    }

    function editUserHandler(user: IUser): void {
        setIsAdd(false);
        setIsDelete(false);
        setIsSettleSingle(false);
        setIsSettleBatch(false);
        setSelectedUser(user);
        setIsEdit(true);
        setIsVisible(true);
    }

    function settleUserHandler(user: IUser): void {
        setIsAdd(false);
        setIsEdit(false);
        setIsDelete(false);
        setIsSettleBatch(false);
        setSelectedUser(user);
        setIsSettleSingle(true);
        setIsVisible(true);
    }

    function settleMultipleUsersHandler(userIds: number[]): void {
        setIsAdd(false);
        setIsEdit(false);
        setIsDelete(false);
        setIsSettleSingle(false);
        setBatchUserIds(userIds);
        setIsSettleBatch(true);
        setIsVisible(true);
    }

    function userHandler(id: number | undefined, name: string): void {
        if (name && !id) {
            DatabaseService.createUser(db, name);
        } else if (id && name) {
            DatabaseService.updateUser(db, id, name);
        } else if (id && !name) {
            DatabaseService.deleteUser(db, id);
        }
        refreshUserList();
        closeModals();
    }

    function confirmSingleSettle(): void {
        if (selectedUser) {
            DatabaseService.settleAccount(db, selectedUser.userId);
            refreshUserList();
        }
        closeModals();
    }

    function confirmBatchSettle(): void {
        if (batchUserIds.length > 0) {
            DatabaseService.settleMultipleAccounts(db, batchUserIds);
            refreshUserList();
        }
        setIsSelectMode(false);
        closeModals();
    }

    const hasSettled = !!users.filter((u) => u.balance === 0).length;
    const hasBoth = hasSettled && !!users.filter((u) => u.balance !== 0).length;
    const unsettledCount = users.filter((u) => u.balance !== 0).length;

    const eligibleCountInCurrentFilter = useMemo(() => {
        const list = hideSettled ? users.filter((u) => u.balance !== 0) : users;
        if (filterTab === "receivable") {
            return list.filter((u) => u.balance < 0).length;
        }
        if (filterTab === "payable") {
            return list.filter((u) => u.balance > 0).length;
        }
        if (filterTab === "settled") {
            return 0;
        }
        return list.filter((u) => u.balance !== 0).length;
    }, [users, hideSettled, filterTab]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
                <ThemeContext.Provider value={appTheme}>
                    {(isAdd || isEdit) && (
                        <Modal isVisible={isVisible} setVisibility={closeModals}>
                            {isAdd && <QuickAddModal users={users} setVisibility={closeModals} onSuccess={refreshUserList} onAddUserSubmit={userHandler} />}
                            {isEdit && selectedUser && (
                                <UserModal onSubmit={userHandler} setVisibility={closeModals} userName={selectedUser.name} userId={selectedUser.userId} />
                            )}
                        </Modal>
                    )}
                    {isDelete && (
                        <ConfirmationModal
                            message="Are you sure you want to delete this account? All associated transactions will also be removed."
                            setIsVisible={closeModals}
                            onSubmit={() => userHandler(selectedUser?.userId, "")}
                            onCancel={closeModals}
                            isVisible={isVisible}
                        />
                    )}
                    {isSettleSingle && selectedUser && (
                        <ConfirmationModal
                            title="Settle Up Account"
                            submitLabel="Settle Up"
                            icon="check-all"
                            variant="success"
                            message={
                                <Text style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
                                    Are you sure you want to mark all open transactions for{" "}
                                    <Text style={{ fontWeight: "800", color: colors.onSurface }}>{selectedUser.name}</Text> as settled?{" "}
                                    <Text style={{ fontWeight: "800", color: colors.successText }}>Net balance will reset to ₹0</Text>.
                                </Text>
                            }
                            setIsVisible={closeModals}
                            onSubmit={confirmSingleSettle}
                            onCancel={closeModals}
                            isVisible={isVisible}
                        />
                    )}
                    {isSettleBatch && (
                        <ConfirmationModal
                            title="Settle Selected Accounts"
                            submitLabel={`Settle (${batchUserIds.length})`}
                            icon="check-all"
                            variant="success"
                            message={
                                <Text style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
                                    Are you sure you want to mark all open transactions for{" "}
                                    <Text style={{ fontWeight: "800", color: colors.onSurface }}>{batchUserIds.length} selected accounts</Text> as settled?{" "}
                                    <Text style={{ fontWeight: "800", color: colors.successText }}>Net balance for all selected accounts will reset to ₹0</Text>
                                    .
                                </Text>
                            }
                            setIsVisible={closeModals}
                            onSubmit={confirmBatchSettle}
                            onCancel={closeModals}
                            isVisible={isVisible}
                        />
                    )}
                    {isBackupVisible && (
                        <Modal isVisible={isBackupVisible} setVisibility={() => setIsBackupVisible(false)}>
                            <BackupModal initialMode={backupInitialMode} setVisibility={setIsBackupVisible} onRestoreSuccess={refreshUserList} />
                        </Modal>
                    )}
                </ThemeContext.Provider>
            </Portal>

            {/* Top Viewport Toolbar: Multi Settle & Hide Settled Toggle */}
            {!!users.length && (unsettledCount > 0 || hasSettled) && (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: colors.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        width: "100%",
                        minHeight: 44,
                    }}
                >
                    {/* Multi Settle Button on the left side of top bar */}
                    <View style={{ minHeight: 28, justifyContent: "center" }}>
                        {eligibleCountInCurrentFilter > 0 ? (
                            <Pressable
                                onPress={() => setIsSelectMode((prev) => !prev)}
                                style={({ pressed }) => ({
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 14,
                                    backgroundColor: isSelectMode ? colors.successBg : pressed ? colors.surfaceVariant : colors.surface,
                                    borderWidth: 1,
                                    borderColor: isSelectMode ? colors.success : colors.border,
                                    gap: 6,
                                })}
                            >
                                <Icon source="checkbox-multiple-marked-outline" size={15} color={isSelectMode ? colors.successText : colors.primary} />
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "700",
                                        color: isSelectMode ? colors.successText : colors.primary,
                                    }}
                                >
                                    {isSelectMode ? "Cancel Selection" : "Multi Settle"}
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>

                    {/* Hide settled toggle on the right side of top bar */}
                    <View style={{ minHeight: 28, justifyContent: "center" }}>
                        {hasSettled ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Icon source="eye-check-outline" size={15} color={colors.onSurfaceVariant} />
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{hideSettled ? "Show" : "Hide"} Settled</Text>
                                <Pressable
                                    onPress={toggleHideSettled}
                                    style={{
                                        width: 44,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: hideSettled ? colors.primary : colors.toggleTrackInactive,
                                        justifyContent: "center",
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            backgroundColor: "#fff",
                                            alignSelf: hideSettled ? "flex-end" : "flex-start",
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                    />
                                </Pressable>
                            </View>
                        ) : null}
                    </View>
                </View>
            )}

            <UserTable
                users={users}
                hideSettled={hideSettled}
                onToggleHideSettled={toggleHideSettled}
                onDelete={deleteUserHandler}
                onView={viewUserHandler}
                onEdit={editUserHandler}
                onSettleUser={settleUserHandler}
                onSettleMultipleUsers={settleMultipleUsersHandler}
                isSelectMode={isSelectMode}
                setIsSelectMode={setIsSelectMode}
                currentFilterTab={filterTab}
                onFilterTabChange={setFilterTab}
                onRestoreBackup={() => openBackupModal("import")}
            />
        </View>
    );
}
