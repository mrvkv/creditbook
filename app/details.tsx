import Table from "@/components/Table";
import DatabaseService from "@/services/database.service";
import globalStylesheet from "@/stylesheets/global.stylesheet";
import { ITransaction } from "@/types/transaction.interface";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Modal, Portal, RadioButton, Text, TextInput } from "react-native-paper";

export default function Details() {
    const { userId } = useLocalSearchParams() as unknown as { userId: string };
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const router = useRouter();
    const [type, setType] = useState("Debit");

    const [visible, setVisible] = useState(false);
    const [text, setText] = useState("");

    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);

    useEffect(() => {
        DatabaseService.connect();
        console.log(DatabaseService.getTransactions(parseInt(userId)));
        setTransactions(DatabaseService.getTransactions(parseInt(userId)));
    }, []);

    function navigateToHome() {
        router.replace({
            pathname: "/",
        });
    }

    return (
        <View>
            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={globalStylesheet.modal}>
                    <View>
                        <TextInput
                            mode="outlined"
                            style={{ marginLeft: 10, marginRight: 10 }}
                            label="Amount"
                            value={text}
                            onChangeText={(text) => setText(text)}
                        />
                        <View style={{ flexDirection: "row", alignItems: "center", margin: "auto" }}>
                            <RadioButton
                                value="Debit"
                                status={type === "Debit" ? "checked" : "unchecked"}
                                onPress={() => setType("Debit")}
                            />
                            <Text>Debit</Text>
                            <RadioButton
                                value="Credit"
                                status={type === "Credit" ? "checked" : "unchecked"}
                                onPress={() => setType("Credit")}
                            />
                            <Text>Credit</Text>
                        </View>
                        <Button
                            style={globalStylesheet.button}
                            mode="contained"
                            onPress={() => {
                                DatabaseService.createTransaction(parseInt(userId), parseInt(text), type);
                                setTransactions(DatabaseService.getTransactions(parseInt(userId)));
                                hideModal();
                                setText("");
                                setType("Debit");
                            }}
                        >
                            Submit
                        </Button>
                    </View>
                </Modal>
            </Portal>
            <Table items={transactions}></Table>;
            <Button style={globalStylesheet.button} mode="contained" onPress={() => showModal()}>
                Add a Transaction
            </Button>
            <Button style={globalStylesheet.button} mode="contained" onPress={() => navigateToHome()}>
                Back
            </Button>
        </View>
    );
}
