import { TransactionType } from "@/enums/transaction.enum";
import DatabaseService from "@/services/database.service";
import modalStylesheet from "@/stylesheets/modal.stylesheet";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";

interface ITransactionModalProps {
    readonly userId: string;
    readonly setVisibility: (isVisible: boolean) => void;
    readonly refreshTransactionList: () => void;
}

export default function TransactionModal({ userId, setVisibility, refreshTransactionList }: ITransactionModalProps) {
    const db = useSQLiteContext();
    const [type, setType] = useState(TransactionType.Debit);
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");

    return (
        <View>
            <Text variant="titleMedium" style={modalStylesheet.text}>
                Add Transaction
            </Text>
            <View style={modalStylesheet.radioButtonView}>
                <RadioButton
                    value={TransactionType.Debit}
                    status={type === TransactionType.Debit ? "checked" : "unchecked"}
                    onPress={() => setType(TransactionType.Debit)}
                />
                <Text>Debit</Text>
                <RadioButton
                    value={TransactionType.Credit}
                    status={type === TransactionType.Credit ? "checked" : "unchecked"}
                    onPress={() => setType(TransactionType.Credit)}
                />
                <Text>Credit</Text>
            </View>
            <TextInput
                mode="outlined"
                style={modalStylesheet.textInput}
                label="Amount"
                value={amount}
                onChangeText={(text) => {
                    if (/^(\d*)\.?(\d){0,2}$/.exec(text)) setAmount(text);
                }}
                keyboardType="numeric"
            />
            <TextInput
                mode="outlined"
                style={modalStylesheet.textInput}
                label="Remark"
                value={remark}
                onChangeText={(text) => {
                    setRemark(text);
                }}
            />
            <Button
                style={modalStylesheet.button}
                mode="contained"
                onPress={() => {
                    DatabaseService.createTransaction(db, parseInt(userId), parseFloat(amount), type, remark);
                    setAmount("");
                    setRemark("");
                    setType(TransactionType.Debit);
                    setVisibility(false);
                    refreshTransactionList();
                }}
            >
                Submit
            </Button>
        </View>
    );
}
