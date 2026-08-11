import { radius, spacing } from "@/constants/theme.constant";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    card: {
        borderRadius: radius.md,
        overflow: "hidden",
    },
    section: {
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
    },
});
