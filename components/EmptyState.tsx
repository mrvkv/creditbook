import { useAppTheme } from "@/hooks/useAppTheme";
import * as React from "react";
import { View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";

interface EmptyStateProps {
    icon: string;
    title: string;
    subtitle?: string;
    size?: number;
    actionLabel?: string;
    actionIcon?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon,
    title,
    subtitle,
    size = 64,
    actionLabel,
    actionIcon,
    onAction,
}: EmptyStateProps) {
    const { colors } = useAppTheme();

    return (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 32,
            }}
        >
            {/* Icon container with subtle tinted background */}
            <View
                style={{
                    width: size * 1.75,
                    height: size * 1.75,
                    borderRadius: (size * 1.75) / 2,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                }}
            >
                <Icon source={icon} size={size} color={colors.onSurfaceMuted} />
            </View>

            <Text
                variant="titleMedium"
                style={{
                    color: colors.onSurface,
                    fontWeight: "700",
                    marginBottom: 6,
                    textAlign: "center",
                }}
            >
                {title}
            </Text>

            {subtitle ? (
                <Text
                    variant="bodyMedium"
                    style={{
                        color: colors.onSurfaceMuted,
                        textAlign: "center",
                        lineHeight: 20,
                    }}
                >
                    {subtitle}
                </Text>
            ) : null}

            {actionLabel && onAction ? (
                <Button
                    mode="outlined"
                    icon={actionIcon || "cloud-sync-outline"}
                    onPress={onAction}
                    textColor={colors.primary}
                    style={{
                        marginTop: 18,
                        borderRadius: 10,
                        borderColor: colors.primary,
                    }}
                >
                    {actionLabel}
                </Button>
            ) : null}
        </View>
    );
}
