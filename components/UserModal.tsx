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

    if (userName) {
        modalTitle = "Edit Account";
    }

    return (
        <View>
            <Text variant="titleMedium" style={modalStylesheet.text}>
                {modalTitle}
            </Text>
            <TextInput mode="outlined" style={modalStylesheet.textInput} label="Account Name" value={name} onChangeText={(text) => setName(text)} />
            <Button
                style={modalStylesheet.button}
                mode="contained"
                onPress={() => {
                    onSubmit(userId!, name);
                    setVisibility(false);
                }}
            >
                Submit
            </Button>
        </View>
    );
}
