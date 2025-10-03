import EmptyState from "@/components/EmptyState";
import { TransactionType } from "@/enums/transaction.enum";
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
        <Text style={{ ...(type && { color: type === TransactionType.Debit ? "red" : "green" }) }} variant="titleSmall">
            {content}
        </Text>
    </DataTable.Cell>
);

const TransactionTable = ({ transactions, onDelete }: { transactions: ITransaction[]; onDelete: (transaction: ITransaction) => void }) => {
    function formatDate(date: string): string {
        const monthMap = {
            "01": "Jan.",
            "02": "Feb.",
            "03": "Mar.",
            "04": "Apr.",
            "05": "May",
            "06": "Jun.",
            "07": "Jul.",
            "08": "Aug.",
            "09": "Sep.",
            "10": "Oct.",
            "11": "Nov.",
            "12": "Dec.",
        };
        const today = new Date(date);
        const dateArray = today.toLocaleDateString("en-GB").replace(/\//g, " ").split(" ");
        dateArray[1] = monthMap[dateArray[1] as keyof typeof monthMap];
        return dateArray.join(" ");
    }

    return (
        <View style={{ flex: 1 }}>
            {!transactions || transactions.length === 0 ? (
                <EmptyState icon="file-document-outline" title="No transactions found" subtitle="Add a transaction to get started" />
            ) : (
                <DataTable>
                    <DataTable.Header style={tableStylesheet.header}>
                        <Header title="Amount" />
                        <Header title="Date" />
                        <Header title="Remark" />
                        <Header title="Action" />
                    </DataTable.Header>

                    {transactions?.map((transaction, index) => (
                        <DataTable.Row key={transaction.transactionId} style={index % 2 === 0 ? tableStylesheet.rowEven : tableStylesheet.rowOdd}>
                            <Cell content={`₹${transaction.amount.toString()}`} type={transaction.type} />
                            <Cell content={formatDate(transaction.date)} />
                            <Cell content={transaction.remark} />
                            <DataTable.Cell style={tableStylesheet.cell}>
                                <IconButton icon="delete" size={20} iconColor="red" onPress={() => onDelete(transaction)} />
                            </DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            )}
        </View>
    );
};

export default TransactionTable;
