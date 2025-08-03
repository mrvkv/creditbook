import tableStylesheet from "@/stylesheets/table.stylesheet";
import { ITransaction } from "@/types/transaction.interface";
import * as React from "react";
import { View } from "react-native";
import { DataTable, IconButton, Text } from "react-native-paper";

const Header = ({ title }: { title: string }) => (
    <DataTable.Title style={tableStylesheet.cell}>
        <Text variant="titleSmall">{title}</Text>
    </DataTable.Title>
);

const Cell = ({ content, type }: { content: string; type?: string }) => (
    <DataTable.Cell style={tableStylesheet.cell}>
        <Text style={{ ...(type && { color: type === "Debit" ? "red" : "green" }) }}>{content}</Text>
    </DataTable.Cell>
);

const TransactionTable = ({ items }: { items: ITransaction[] }) => {
    return (
        <View>
            <DataTable>
                <DataTable.Header>
                    <Header title="Amount (₹)" />
                    <Header title="Type" />
                    <Header title="Remark" />
                    <Header title="Action" />
                </DataTable.Header>

                {items?.map((item, index) => (
                    <DataTable.Row key={index}>
                        <Cell content={item.amount.toString()} type={item.type} />
                        <Cell content={item.type} type={item.type} />
                        <Cell content={item.remark || "None"} />
                        <DataTable.Cell style={tableStylesheet.cell}>
                            <IconButton icon="pencil" size={20} iconColor="blue" />
                            <IconButton icon="delete" size={20} iconColor="red" />
                        </DataTable.Cell>
                    </DataTable.Row>
                ))}
            </DataTable>
        </View>
    );
};

export default TransactionTable;
