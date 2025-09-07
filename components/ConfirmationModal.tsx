import { Button, Dialog, Text } from "react-native-paper";

type ConfirmationModalProps = {
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
    readonly setIsVisible: (visible: boolean) => void;
    readonly isVisible: boolean;
    readonly message: string;
};

export default function ConfirmationModal({ onSubmit, onCancel, setIsVisible, isVisible, message }: ConfirmationModalProps) {
    return (
        <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
            <Dialog.Title>Confirmation</Dialog.Title>
            <Dialog.Content>
                <Text variant="bodyMedium">{message}</Text>
            </Dialog.Content>
            <Dialog.Actions>
                <Button
                    onPress={() => {
                        onSubmit();
                        setIsVisible(false);
                    }}
                >
                    Yes
                </Button>
                <Button
                    onPress={() => {
                        onCancel();
                        setIsVisible(false);
                    }}
                >
                    No
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
}
