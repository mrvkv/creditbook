import modalStylesheet from "@/stylesheets/modal.stylesheet";
import { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

interface IUserModalProps {
    readonly onSubmit: (userId: number, userName: string) => void;
    readonly setVisibility: (isVisible: boolean) => void;
    readonly userName?: string;
    readonly userId?: number;
}

export default function UserModal({ onSubmit, setVisibility, userName, userId }: IUserModalProps) {
    const [name, setName] = useState(userName || "");
    let modalTitle = "Add Account";
    let buttonText = "Add";

    if (userName) {
        modalTitle = "Edit Account";
        buttonText = "Edit";
    }

    return (
        <View>
            <Text variant="titleMedium" style={{ margin: "auto", marginBottom: 10 }}>
                {modalTitle}
            </Text>
            <TextInput mode="outlined" style={{ marginLeft: 10, marginRight: 10 }} label="Account Name" value={name} onChangeText={(text) => setName(text)} />
            <Button
                style={modalStylesheet.button}
                mode="contained"
                onPress={() => {
                    onSubmit(userId!, name);
                    setVisibility(false);
                }}
            >
                {buttonText}
            </Button>
        </View>
    );
}
