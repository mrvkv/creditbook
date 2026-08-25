import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";

type ConfirmationModalProps = {
    readonly onSubmit: () => void;
    readonly onCancel?: () => void;
    readonly setIsVisible: (visible: boolean) => void;
    readonly isVisible: boolean;
    readonly message: string | React.ReactNode;
    readonly title?: string;
    readonly submitLabel?: string;
    readonly icon?: string;
    readonly variant?: "danger" | "success" | "primary";
};

export default function ConfirmationModal({
    onSubmit,
    onCancel,
    setIsVisible,
    isVisible,
    message,
    title,
    submitLabel,
    icon,
    variant = "danger",
}: ConfirmationModalProps) {
    const { colors } = useAppTheme();

    if (!isVisible) return null;

    let iconBg = colors.danger;
    let defaultIcon = "alert";
    let defaultTitle = "Confirm Delete";
    let defaultSubmitLabel = "Delete";
    let btnColor = colors.danger;
    let onAccentColor = colors.onDanger;

    if (variant === "success") {
        iconBg = colors.success;
        defaultIcon = "check-circle-outline";
        defaultTitle = "Confirm Settlement";
        defaultSubmitLabel = "Settle Up";
        btnColor = colors.success;
        onAccentColor = colors.onSuccess;
    } else if (variant === "primary") {
        iconBg = colors.primary;
        defaultIcon = "information-outline";
        defaultTitle = "Confirm Action";
        defaultSubmitLabel = "Confirm";
        btnColor = colors.primary;
        onAccentColor = colors.onPrimary;
    }

    const modalTitle = title || defaultTitle;
    const modalIcon = icon || defaultIcon;
    const modalSubmitLabel = submitLabel || defaultSubmitLabel;

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
                    elevation: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                }}
            >
                {/* Icon header */}
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
                            backgroundColor: iconBg,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                        }}
                    >
                        <Icon source={modalIcon} size={28} color={onAccentColor} />
                    </View>
                    <Text
                        variant="titleMedium"
                        style={{
                            color: colors.onSurface,
                            fontWeight: "800",
                            textAlign: "center",
                            marginBottom: 6,
                        }}
                    >
                        {modalTitle}
                    </Text>
                    {typeof message === "string" ? (
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
                    ) : (
                        <View style={{ alignItems: "center" }}>{message}</View>
                    )}
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
                            borderColor: colors.borderStrong || colors.border,
                        }}
                        labelStyle={{ color: colors.onSurfaceVariant, fontWeight: "700" }}
                        onPress={() => {
                            if (onCancel) onCancel();
                            setIsVisible(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        buttonColor={btnColor}
                        style={{ flex: 1, borderRadius: 12 }}
                        labelStyle={{ color: onAccentColor, fontWeight: "700" }}
                        onPress={() => {
                            onSubmit();
                            setIsVisible(false);
                        }}
                    >
                        {modalSubmitLabel}
                    </Button>
                </View>
            </View>
        </View>
    );
}
