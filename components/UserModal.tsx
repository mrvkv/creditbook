import { useAppTheme } from "@/hooks/useAppTheme";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

interface IUserModalProps {
    readonly onSubmit: (userId: number | undefined, userName: string) => void;
    readonly setVisibility: (isVisible: boolean) => void;
    readonly userName?: string;
    readonly userId?: number;
}

export default function UserModal({ onSubmit, setVisibility, userName, userId }: IUserModalProps) {
    const { colors } = useAppTheme();
    const [name, setName] = useState(userName || "");
    const inputRef = useRef<any>(null);
    const isEdit = !!userName;
    const isFormValid = !!name.trim();
    const modalTitle = isEdit ? "Edit Account" : "Add Account";
    const modalSubtitle = isEdit ? "Update the account name below." : "Enter a name for the new account.";

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            {/* Header */}
            <View
                style={{
                    paddingTop: 24,
                    paddingBottom: 16,
                    paddingHorizontal: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    marginBottom: 20,
                }}
            >
                <Text
                    variant="titleLarge"
                    style={{
                        color: colors.onSurface,
                        fontWeight: "800",
                        marginBottom: 4,
                    }}
                >
                    {modalTitle}
                </Text>
                <Text
                    variant="bodySmall"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {modalSubtitle}
                </Text>
            </View>

            {/* Input */}
            <TextInput
                ref={inputRef}
                autoFocus
                mode="outlined"
                textColor={colors.onSurface}
                style={{
                    marginHorizontal: 20,
                    marginBottom: 20,
                    backgroundColor: colors.surface,
                }}
                label="Account Name"
                value={name}
                onChangeText={(text) => setName(text)}
                left={<TextInput.Icon icon="account" color={colors.onSurfaceVariant} />}
                outlineStyle={{ borderRadius: 12, borderColor: colors.borderStrong || colors.border }}
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8 }}>
                <Button
                    mode="outlined"
                    style={{ flex: 1, borderRadius: 12, borderColor: colors.borderStrong || colors.border }}
                    labelStyle={{ color: colors.onSurfaceVariant, fontWeight: "700" }}
                    onPress={() => setVisibility(false)}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    buttonColor={isFormValid ? colors.primary : undefined}
                    disabled={!isFormValid}
                    style={{ flex: 1, borderRadius: 12 }}
                    labelStyle={{
                        color: isFormValid ? colors.onPrimary : colors.onSurfaceMuted,
                        fontWeight: "700",
                    }}
                    onPress={() => {
                        if (isFormValid) {
                            onSubmit(userId, name.trim());
                            setVisibility(false);
                        }
                    }}
                >
                    {isEdit ? "Update" : "Add Account"}
                </Button>
            </View>
        </ScrollView>
    );
}
