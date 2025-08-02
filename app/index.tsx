import CardComponent from "@/components/Card";
import DatabaseService from "@/services/database.service";
import globalStylesheet from "@/stylesheets/global.stylesheet";
import { IUser } from "@/types/user.interface";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { Button, IconButton, Modal, Portal, TextInput } from "react-native-paper";

export default function Index() {
    const [users, setUsers] = useState<IUser[]>();
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

    const HeaderRight = () => (
        <IconButton
            icon="plus"
            mode="contained"
            selected={true}
            onPress={() => {
                showModal();
                console.log("Pressed");
            }}
        />
    );
    const navigation = useNavigation();
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: HeaderRight,
        });
    });

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
        <View>
            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={globalStylesheet.modal}>
                    <View>
                        <TextInput
                            mode="outlined"
                            style={{ marginLeft: 10, marginRight: 10 }}
                            label="Account Name"
                            value={text}
                            onChangeText={(text) => setText(text)}
                        />
                        <Button
                            style={globalStylesheet.button}
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
        </View>
    );
}
