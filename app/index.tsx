import ConfirmationModal from "@/components/ConfirmationModal";
import HeaderRight from "@/components/HeaderRight";
import Modal from "@/components/Modal";
import UserModal from "@/components/UserModal";
import UserTable from "@/components/UserTable";
import DatabaseService from "@/services/database.service";
import { IUser } from "@/types/user.interface";
import { useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { Portal, Switch, Text } from "react-native-paper";

export default function Index() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const headerRight = () => <HeaderRight handler={addUserHandler} />;

    const [users, setUsers] = useState<IUser[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isAdd, setIsAdd] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser>();
    const [hideSettled, setHideSettled] = useState(false);

    useEffect(() => {
        refreshUserList();
    }, []);
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight,
        });
    }, []);

    function refreshUserList(): void {
        setUsers(DatabaseService.getUsers(db));
    }

    function viewUserHandler(user: IUser): void {
        router.replace({
            pathname: "/details",
            params: {
                userId: user.userId,
            },
        });
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

    function userHandler(id: number, name: string): void {
        if (name && !id) {
            DatabaseService.createUser(db, name);
        } else if (id && name) {
            DatabaseService.updateUser(db, id, name);
        } else if (id && !name) {
            DatabaseService.deleteUser(db, id);
        }

        refreshUserList();
    }

    return (
        <View>
            <Portal>
                {(isAdd || isEdit) && (
                    <Modal isVisible={isVisible} setVisibility={setIsVisible}>
                        {isAdd && <UserModal onSubmit={userHandler} setVisibility={setIsVisible} />}
                        {isEdit && selectedUser && (
                            <UserModal onSubmit={userHandler} setVisibility={setIsVisible} userName={selectedUser.name} userId={selectedUser.userId} />
                        )}
                    </Modal>
                )}
                {isDelete && (
                    <ConfirmationModal
                        message="Are you sure, you want to delete the user?"
                        setIsVisible={setIsVisible}
                        onSubmit={() => userHandler(selectedUser!.userId, "")}
                        onCancel={() => {}}
                        isVisible={isVisible}
                    ></ConfirmationModal>
                )}
            </Portal>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 10 }}>
                <Switch value={hideSettled} onValueChange={() => setHideSettled((prev) => !prev)} />
                <Text variant="titleSmall">{`${hideSettled ? "Show" : "Hide"} Settled Accounts`}</Text>
            </View>
            <UserTable
                users={hideSettled ? users.filter((user) => user.balance !== 0) : users}
                onDelete={deleteUserHandler}
                onView={viewUserHandler}
                onEdit={editUserHandler}
            ></UserTable>
        </View>
    );
}
