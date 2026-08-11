import { AppColors } from "@/constants/theme.constant";
import { radius, spacing } from "@/constants/theme.constant";
import { StyleSheet } from "react-native";

export function createTableStylesheet(colors: AppColors) {
    return StyleSheet.create({
        cell: {
            flex: 1,
            justifyContent: "center",
        },
        header: {
            backgroundColor: colors.surfaceVariant,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            borderTopWidth: 0,
        },
        headerText: {
            color: colors.onSurfaceVariant,
            fontWeight: "700",
            fontSize: 12,
            letterSpacing: 0.8,
            textTransform: "uppercase",
        },
        rowEven: {
            backgroundColor: colors.rowEven,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        rowOdd: {
            backgroundColor: colors.rowOdd,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        cardRow: {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            marginHorizontal: spacing.lg,
            marginVertical: spacing.xs,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
        },
        summaryBar: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
    });
}

// Static fallback
export default StyleSheet.create({
    cell: {
        flex: 1,
        justifyContent: "center",
    },
    rowEven: {
        backgroundColor: "#ffffff",
    },
    rowOdd: {
        backgroundColor: "#f8f9ff",
    },
    header: {
        backgroundColor: "#F1F5F9",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        borderTopWidth: 0,
    },
});
