import { AppColors } from "@/constants/theme.constant";
import { radius, spacing } from "@/constants/theme.constant";
import { StyleSheet } from "react-native";

export function createModalStylesheet(colors: AppColors) {
    return StyleSheet.create({
        modal: {
            backgroundColor: colors.modalBg,
            marginHorizontal: spacing.xl,
            borderRadius: radius.xl,
            paddingBottom: spacing.lg,
            overflow: "hidden",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: spacing.xl,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: spacing.lg,
        },
        title: {
            color: colors.onSurface,
            fontWeight: "700",
            fontSize: 17,
            letterSpacing: 0.3,
        },
        textInput: {
            marginHorizontal: spacing.xl,
            marginBottom: spacing.md,
            backgroundColor: colors.surface,
        },
        button: {
            marginHorizontal: spacing.xl,
            marginTop: spacing.sm,
            borderRadius: radius.md,
        },
        radioButtonView: {
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: spacing.xl,
            marginBottom: spacing.md,
        },
    });
}

// Fallback static version (used by components that don't yet have theme)
export default StyleSheet.create({
    modal: {
        backgroundColor: "white",
        marginHorizontal: 20,
        borderRadius: 20,
        paddingBottom: 16,
        overflow: "hidden",
    },
    textInput: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    button: {
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 12,
    },
    text: {
        textAlign: "center",
        marginVertical: 10,
    },
    radioButtonView: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginBottom: 12,
    },
});
