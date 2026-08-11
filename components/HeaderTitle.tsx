import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";
import { Icon, Text } from "react-native-paper";

/**
 * Attractive logo mark: rounded square with a book-rupee icon,
 * matching the indigo brand color.
 */
export function LogoBadge({ size = 30 }: { size?: number }) {
    const { colors, isDark } = useAppTheme();
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.26,
                backgroundColor: isDark ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.22)",
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.45)",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Icon
                source="book-open-variant"
                size={size * 0.58}
                color={isDark ? "#818CF8" : "#ffffff"}
            />
        </View>
    );
}

/**
 * Home screen header title — logo badge + "Credit Book" with a
 * subtle "by you" tagline.
 */
export function HomeHeaderTitle() {
    const { isDark } = useAppTheme();
    const textColor = isDark ? "#CDD6F4" : "#ffffff";
    const subColor = isDark ? "rgba(205,214,244,0.6)" : "rgba(255,255,255,0.7)";

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <LogoBadge size={32} />
            <View>
                <Text
                    style={{
                        color: textColor,
                        fontSize: 18,
                        fontWeight: "800",
                        letterSpacing: 0.2,
                        lineHeight: 20,
                    }}
                >
                    Credit<Text style={{ color: isDark ? "#A78BFA" : "rgba(255,255,255,0.85)", fontWeight: "800" }}>Book</Text>
                </Text>
                <Text style={{ color: subColor, fontSize: 10, letterSpacing: 0.5, lineHeight: 12 }}>
                    Personal Ledger
                </Text>
            </View>
        </View>
    );
}

/**
 * Transactions screen header title — transfer icon + "Transactions" + user name centered below.
 */
export function TransactionsHeaderTitle({ userName }: { userName?: string }) {
    const { isDark } = useAppTheme();
    const textColor = isDark ? "#CDD6F4" : "#ffffff";
    const subColor = isDark ? "rgba(205,214,244,0.6)" : "rgba(255,255,255,0.7)";

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Icon badge */}
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: isDark ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.22)",
                    borderWidth: 1.5,
                    borderColor: isDark ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon
                    source="swap-horizontal"
                    size={18}
                    color={isDark ? "#818CF8" : "#ffffff"}
                />
            </View>

            {/* Title + name left-aligned */}
            <View style={{ alignItems: "flex-start", flexShrink: 1 }}>
                <Text
                    numberOfLines={1}
                    style={{
                        color: textColor,
                        fontSize: 18,
                        fontWeight: "800",
                        letterSpacing: 0.2,
                        lineHeight: 22,
                    }}
                >
                    Transactions
                </Text>
                {userName ? (
                    <Text
                        numberOfLines={1}
                        style={{
                            color: subColor,
                            fontSize: 10,
                            letterSpacing: 0.5,
                            lineHeight: 14,
                        }}
                    >
                        {userName}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

