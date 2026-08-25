import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";
import { Icon, Text } from "react-native-paper";

/**
 * Attractive logo mark: rounded square with a book-rupee icon,
 * matching the indigo brand color.
 */
export function LogoBadge({ size = 36 }: { size?: number }) {
    const { isDark } = useAppTheme();
    const outerRadius = size * 0.28;
    const innerRadius = size * 0.22;
    const innerSize = size * 0.78;

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: outerRadius,
                backgroundColor: isDark ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.18)",
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(129,140,248,0.45)" : "rgba(255,255,255,0.38)",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <View
                style={{
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerRadius,
                    backgroundColor: isDark ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.14)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.28)",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon
                    source="book-open-variant"
                    size={size * 0.46}
                    color={isDark ? "#818CF8" : "#ffffff"}
                />
            </View>
        </View>
    );
}

/**
 * Home screen header title — logo badge + "Finance Keeper" with a
 * "PERSONAL FINANCE BOOKS" tagline, matching splash screen.
 */
export function HomeHeaderTitle() {
    const { isDark } = useAppTheme();
    const textColor = isDark ? "#CDD6F4" : "#ffffff";
    const subColor = isDark ? "rgba(205,214,244,0.6)" : "rgba(255,255,255,0.65)";
    const purpleColor = "#C4B5FD";

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <LogoBadge size={36} />
            <View>
                <Text
                    style={{
                        color: textColor,
                        fontSize: 19,
                        fontWeight: "900",
                        letterSpacing: -0.2,
                        lineHeight: 22,
                    }}
                >
                    Finance<Text style={{ color: purpleColor, fontWeight: "900" }}> Keeper</Text>
                </Text>
                <Text style={{ color: subColor, fontSize: 9, letterSpacing: 1.8, lineHeight: 12, fontWeight: "600" }}>
                    PERSONAL FINANCE BOOKS
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

/**
 * Global timeline screen header title — history icon + "Global Timeline" + "All Accounts Transactions" subtext.
 */
export function GlobalTimelineHeaderTitle() {
    const { isDark } = useAppTheme();
    const textColor = isDark ? "#CDD6F4" : "#ffffff";
    const subColor = isDark ? "rgba(205,214,244,0.6)" : "rgba(255,255,255,0.7)";

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
                    source="history"
                    size={18}
                    color={isDark ? "#818CF8" : "#ffffff"}
                />
            </View>

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
                    Global Timeline
                </Text>
                <Text
                    numberOfLines={1}
                    style={{
                        color: subColor,
                        fontSize: 10,
                        letterSpacing: 0.5,
                        lineHeight: 14,
                    }}
                >
                    All Accounts Transactions
                </Text>
            </View>
        </View>
    );
}

