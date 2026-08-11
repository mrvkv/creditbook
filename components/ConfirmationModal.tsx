import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";

type ConfirmationModalProps = {
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
    readonly setIsVisible: (visible: boolean) => void;
    readonly isVisible: boolean;
    readonly message: string;
};

export default function ConfirmationModal({ onSubmit, onCancel, setIsVisible, isVisible, message }: ConfirmationModalProps) {
    const { colors } = useAppTheme();

    if (!isVisible) return null;

    return (
        <View
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.overlay,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 999,
            }}
        >
            <View
                style={{
                    backgroundColor: colors.modalBg,
                    borderRadius: 20,
                    marginHorizontal: 32,
                    width: "85%",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                }}
            >
                {/* Warning icon header */}
                <View
                    style={{
                        alignItems: "center",
                        paddingTop: 28,
                        paddingBottom: 16,
                        paddingHorizontal: 24,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: colors.dangerBg,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                            borderWidth: 1.5,
                            borderColor: colors.danger,
                        }}
                    >
                        <Icon source="alert" size={28} color={colors.dangerText} />
                    </View>
                    <Text
                        variant="titleMedium"
                        style={{
                            color: colors.onSurface,
                            fontWeight: "700",
                            textAlign: "center",
                            marginBottom: 6,
                        }}
                    >
                        Confirm Delete
                    </Text>
                    <Text
                        variant="bodyMedium"
                        style={{
                            color: colors.onSurfaceVariant,
                            textAlign: "center",
                            lineHeight: 20,
                        }}
                    >
                        {message}
                    </Text>
                </View>

                {/* Actions */}
                <View
                    style={{
                        flexDirection: "row",
                        padding: 16,
                        gap: 10,
                    }}
                >
                    <Button
                        mode="outlined"
                        style={{
                            flex: 1,
                            borderRadius: 12,
                            borderColor: colors.border,
                        }}
                        labelStyle={{ color: colors.onSurfaceVariant }}
                        onPress={() => {
                            onCancel();
                            setIsVisible(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        buttonColor={colors.danger}
                        style={{ flex: 1, borderRadius: 12 }}
                        onPress={() => {
                            onSubmit();
                            setIsVisible(false);
                        }}
                    >
                        Delete
                    </Button>
                </View>
            </View>
        </View>
    );
}
