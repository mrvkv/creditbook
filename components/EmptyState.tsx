import * as React from "react";
import { View } from "react-native";
import { IconButton, Text } from "react-native-paper";

interface EmptyStateProps {
    icon: string;
    title: string;
    subtitle?: string;
    size?: number;
    offsetTop?: number;
}

export default function EmptyState({ icon, title, subtitle, size = 72, offsetTop = -150 }: EmptyStateProps) {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: offsetTop }}>
            <IconButton icon={icon} size={size} disabled onPress={() => {}} />
            <Text variant="titleMedium" style={{ marginTop: 8, color: "#616161" }}>
                {title}
            </Text>
            {subtitle ? (
                <Text variant="bodyMedium" style={{ marginTop: 4, color: "#9e9e9e" }}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}
