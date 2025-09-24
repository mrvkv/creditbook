import tableStylesheet from "@/stylesheets/table.stylesheet";
import { IUser } from "@/types/user.interface";
import * as React from "react";
import { View } from "react-native";
import { DataTable, IconButton, Text } from "react-native-paper";

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
    return (
        <View>
            <DataTable>
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
        </View>
    );
};

export default UserTable;
