import EmptyState from "@/components/EmptyState";
import tableStylesheet from "@/stylesheets/table.stylesheet";
import { IUser } from "@/types/user.interface";
import * as React from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { Chip, DataTable, IconButton, Text } from "react-native-paper";

const Header = ({ title }: { title: string }) => (
    <DataTable.Title style={tableStylesheet.cell}>
        <Text variant="titleMedium">{title}</Text>
    </DataTable.Title>
);

const Cell = ({ content, type }: { content: string; type?: string }) => (
    <DataTable.Cell style={tableStylesheet.cell}>
        <Text
            style={{
                ...(type && { color: type === "amount" && parseFloat(content) < 0 ? "red" : "green" }),
            }}
            variant="titleSmall"
        >
            {type !== "amount" ? content : `₹${content.replace("-", "")}`}
        </Text>
    </DataTable.Cell>
);

const UserTable = ({
    users,
    onDelete,
    onView,
    onEdit,
}: {
    users: IUser[];
    onDelete: (user: IUser) => void;
    onView: (user: IUser) => void;
    onEdit: (user: IUser) => void;
}) => {
    const totals = useMemo(() => {
        const receivable = users?.filter((u) => u.balance < 0).reduce((sum, u) => Math.abs(sum + u.balance), 0) || 0;
        const payable = Math.abs(users?.filter((u) => u.balance > 0).reduce((sum, u) => Math.abs(sum + u.balance), 0) || 0);
        const count = users?.length || 0;
        const settled = users?.filter((u) => u.balance === 0).length || 0;
        return { receivable, payable, count, settled };
    }, [users]);

    return (
        <View style={{ flex: 1 }}>
            {!users || users.length === 0 ? (
                <EmptyState icon="account-off-outline" title="No accounts found" subtitle="Add an account to get started" />
            ) : (
                <DataTable>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10 }}>
                        <Chip compact mode="flat" style={{ backgroundColor: "#87CEEB" }} textStyle={{ color: "#616161" }}>
                            {totals.count === 1 ? "Account" : "Accounts"}: {totals.count}
                        </Chip>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Chip compact style={{ marginRight: 6, backgroundColor: "#e8f5e9" }} textStyle={{ color: "#2e7d32" }}>
                                Receivable: ₹{totals.receivable}
                            </Chip>
                            <Chip compact style={{ marginRight: 6, backgroundColor: "#ffebee" }} textStyle={{ color: "#c62828" }}>
                                Payable: ₹{totals.payable}
                            </Chip>
                            {!!totals.settled && (
                                <Chip compact mode="flat" style={{ backgroundColor: "#eeeeee" }} textStyle={{ color: "#616161" }}>
                                    Settled: {totals.settled}
                                </Chip>
                            )}
                        </View>
                    </View>
                    <DataTable.Header style={tableStylesheet.header}>
                        <Header title="Name" />
                        <Header title="Balance" />
                        <Header title="Action" />
                    </DataTable.Header>

                    {users?.map((user, index) => (
                        <DataTable.Row key={user.userId} style={index % 2 === 0 ? tableStylesheet.rowEven : tableStylesheet.rowOdd}>
                            <Cell content={user.name}></Cell>
                            <Cell content={user.balance.toString()} type="amount" />
                            <DataTable.Cell style={tableStylesheet.cell}>
                                <IconButton icon="eye" size={20} iconColor="skyblue" onPress={() => onView(user)} />
                                <IconButton icon="pencil" size={20} iconColor="blue" onPress={() => onEdit(user)} />
                                <IconButton icon="delete" size={20} iconColor="red" onPress={() => onDelete(user)} />
                            </DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            )}
        </View>
    );
};

export default UserTable;
