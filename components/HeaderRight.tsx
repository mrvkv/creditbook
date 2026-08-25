import { useAppTheme } from "@/hooks/useAppTheme";
import { Pressable, View } from "react-native";
import { Icon } from "react-native-paper";

interface HeaderRightProps {
    readonly handler: Function;
    readonly onBackupPress?: () => void;
}

export default function HeaderRight({ handler, onBackupPress }: HeaderRightProps) {
    const { colors, isDark, toggleTheme } = useAppTheme();

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 4 }}>
            {/* Backup & Restore Button */}
            {onBackupPress ? (
                <Pressable
                    onPress={onBackupPress}
                    hitSlop={8}
                    style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                    })}
                >
                    <Icon source="cloud-sync-outline" size={20} color={colors.headerText} />
                </Pressable>
            ) : null}

            {/* Theme Toggle Button — ☀️ Sun for dark mode, 🌙 Moon for light mode */}
            <Pressable
                onPress={toggleTheme}
                hitSlop={8}
                style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                })}
            >
                <Icon
                    source={isDark ? "weather-sunny" : "weather-night"}
                    size={20}
                    color={colors.headerText}
                />
            </Pressable>

            {/* Add Action Button */}
            <Pressable
                onPress={() => handler()}
                hitSlop={8}
                style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                })}
            >
                <Icon source="plus" size={22} color={colors.headerText} />
            </Pressable>
        </View>
    );
}
