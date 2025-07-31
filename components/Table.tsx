import { ITransaction } from "@/app";
import * as React from "react";
import { DataTable } from "react-native-paper";

const Table = ({ items }: { items: ITransaction[] }) => {
    return (
        <DataTable>
            <DataTable.Header>
                <DataTable.Title>Amount</DataTable.Title>
                <DataTable.Title>Type</DataTable.Title>
            </DataTable.Header>

            {items?.map((item, index) => (
                <DataTable.Row key={index}>
                    <DataTable.Cell>{item.amount}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.type}</DataTable.Cell>
                </DataTable.Row>
            ))}
        </DataTable>
    );
};

export default Table;
