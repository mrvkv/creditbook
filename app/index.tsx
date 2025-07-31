import CardComponent from "@/components/Card";
import DatabaseService from "@/services/database";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, MD3LightTheme, Modal, PaperProvider, Portal, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export interface IUser {
    name: string;
    userId: number;
    balance: number;
}

export interface ITransaction {
    amount: number;
    type: string;
}

export default function Index() {
    const [users, setUsers] = useState<IUser[]>();
    const theme = {
        ...MD3LightTheme,
    };

    const [visible, setVisible] = useState(false);
    const [text, setText] = useState("");
    const router = useRouter();

    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);

    useEffect(() => {
        DatabaseService.connect();
        console.log(DatabaseService.getUsers());
        setUsers(DatabaseService.getUsers());
    }, []);

    function onPressHandler(userId: number) {
        router.replace({
            pathname: "/details",
            params: {
                userId,
            },
        });
    }

    function onDeleteHandler(userId: number) {
        DatabaseService.deleteUser(userId);
        setUsers(DatabaseService.getUsers());
    }

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={{ backgroundColor: theme.colors.background, ...styles.container }}>
                <Portal>
                    <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modal}>
                        <View>
                            <TextInput
                                mode="outlined"
                                style={{ marginLeft: 10, marginRight: 10 }}
                                label="Account Name"
                                value={text}
                                onChangeText={(text) => setText(text)}
                            />
                            <Button
                                style={styles.button}
                                mode="contained"
                                onPress={() => {
                                    DatabaseService.createUser(text);
                                    setUsers(DatabaseService.getUsers());
                                    hideModal();
                                    setText("");
                                }}
                            >
                                Submit
                            </Button>
                        </View>
                    </Modal>
                </Portal>
                {users?.map(({ userId, name, balance }) => {
                    return (
                        <CardComponent
                            key={userId}
                            userId={userId}
                            name={name}
                            balance={balance}
                            onPressHandler={onPressHandler}
                            onDeleteHandler={onDeleteHandler}
                        />
                    );
                })}
                <Button icon="plus" style={styles.button} mode="contained" onPress={() => showModal()}>
                    Add New Account
                </Button>
            </SafeAreaView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50,
    },
    button: {
        marginTop: 20,
        marginLeft: 50,
        marginRight: 50,
    },
    modal: {
        backgroundColor: "white",
        marginLeft: 50,
        marginRight: 50,
        minHeight: 300,
    },
});
