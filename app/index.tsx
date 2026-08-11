import ConfirmationModal from "@/components/ConfirmationModal";
import HeaderRight from "@/components/HeaderRight";
import Modal from "@/components/Modal";
import UserModal from "@/components/UserModal";
import UserTable from "@/components/UserTable";
import { HomeHeaderTitle } from "@/components/HeaderTitle";
import { ThemeContext, useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { IUser } from "@/types/user.interface";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useLayoutEffect, useState } from "react";
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
    const [selectedUser, setSelectedUser] = useState<IUser>();
    const [hideSettled, setHideSettled] = useState(false);

    const refreshUserList = useCallback(() => {
        setUsers(DatabaseService.getUsers(db));
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            refreshUserList();
        }, [refreshUserList])
    );

    useLayoutEffect(() => {
        const headerRight = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderRight handler={addUserHandler} />
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
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
        });
    }, [appTheme]);

    function viewUserHandler(user: IUser): void {
        router.push({ pathname: "/details", params: { userId: user.userId } });
    }

    function addUserHandler(): void {
        setIsVisible(true);
        setIsAdd(true);
        setIsEdit(false);
        setIsDelete(false);
    }

    function deleteUserHandler(user: IUser): void {
        setIsAdd(false);
        setIsEdit(false);
        setIsDelete(true);
        setSelectedUser(user);
        setIsVisible(true);
    }

    function editUserHandler(user: IUser): void {
        setIsAdd(false);
        setIsDelete(false);
        setSelectedUser(user);
        setIsVisible(true);
        setIsEdit(true);
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
    }

    const hasSettled = !!users.filter((u) => u.balance === 0).length;
    const hasBoth = hasSettled && !!users.filter((u) => u.balance !== 0).length;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
                <ThemeContext.Provider value={appTheme}>
                    {(isAdd || isEdit) && (
                        <Modal isVisible={isVisible} setVisibility={setIsVisible}>
                            {isAdd && <UserModal onSubmit={userHandler} setVisibility={setIsVisible} />}
                            {isEdit && selectedUser && (
                                <UserModal
                                    onSubmit={userHandler}
                                    setVisibility={setIsVisible}
                                    userName={selectedUser.name}
                                    userId={selectedUser.userId}
                                />
                            )}
                        </Modal>
                    )}
                    {isDelete && (
                        <ConfirmationModal
                            message="Are you sure you want to delete this account? All associated transactions will also be removed."
                            setIsVisible={setIsVisible}
                            onSubmit={() => userHandler(selectedUser?.userId, "")}
                            onCancel={() => {}}
                            isVisible={isVisible}
                        />
                    )}
                </ThemeContext.Provider>
            </Portal>

            {/* Hide settled toggle bar */}
            {!!users.length && hasBoth && (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: colors.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        gap: 8,
                    }}
                >
                    <Icon source="eye-check-outline" size={15} color={colors.onSurfaceVariant} />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                        {hideSettled ? "Show" : "Hide"} Settled
                    </Text>
                    <Pressable
                        onPress={() => setHideSettled((prev) => !prev)}
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
            )}

            <UserTable
                users={hideSettled ? users.filter((user) => user.balance !== 0) : users}
                onDelete={deleteUserHandler}
                onView={viewUserHandler}
                onEdit={editUserHandler}
            />
        </View>
    );
}
