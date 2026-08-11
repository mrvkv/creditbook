import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// ─── Palette ────────────────────────────────────────────────────────────────
export const palette = {
    // Primary — Indigo
    primary50: "#EEF2FF",
    primary100: "#E0E7FF",
    primary400: "#818CF8",
    primary500: "#6366F1",
    primary600: "#4F46E5",
    primary700: "#4338CA",

    // Secondary — Violet
    secondary400: "#A78BFA",
    secondary600: "#7C3AED",

    // Success — Emerald
    success400: "#34D399",
    success500: "#10B981",
    success600: "#059669",
    successBg_light: "#ECFDF5",
    successBg_dark: "#064E3B",
    successText_light: "#065F46",
    successText_dark: "#6EE7B7",

    // Danger — Rose
    danger400: "#F87171",
    danger500: "#EF4444",
    danger600: "#DC2626",
    dangerBg_light: "#FFF1F2",
    dangerBg_dark: "#4C0519",
    dangerText_light: "#9F1239",
    dangerText_dark: "#FCA5A5",

    // Neutral
    neutral50: "#F8FAFC",
    neutral100: "#F1F5F9",
    neutral200: "#E2E8F0",
    neutral300: "#CBD5E1",
    neutral400: "#94A3B8",
    neutral500: "#64748B",
    neutral600: "#475569",
    neutral700: "#334155",
    neutral800: "#1E293B",
    neutral900: "#0F172A",

    // Dark Surface (Catppuccin-inspired)
    dark_base: "#1E1E2E",
    dark_mantle: "#181825",
    dark_crust: "#11111B",
    dark_surface0: "#313244",
    dark_surface1: "#45475A",
    dark_surface2: "#585B70",
    dark_text: "#CDD6F4",
    dark_subtext: "#BAC2DE",
    dark_overlay: "#6C7086",

    white: "#FFFFFF",
    black: "#000000",
    transparent: "transparent",
};

// ─── Spacing & Radius ───────────────────────────────────────────────────────
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
};

// ─── Shadows ────────────────────────────────────────────────────────────────
export const lightShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
};

export const darkShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
};

// ─── Semantic colors ────────────────────────────────────────────────────────
export const lightColors = {
    primary: palette.primary600,
    primaryLight: palette.primary400,
    secondary: palette.secondary600,

    background: palette.neutral50,
    surface: palette.white,
    surfaceVariant: palette.neutral100,
    surfaceElevated: palette.white,

    onBackground: palette.neutral900,
    onSurface: palette.neutral800,
    onSurfaceVariant: palette.neutral600,
    onSurfaceMuted: palette.neutral400,

    border: palette.neutral200,
    borderStrong: palette.neutral300,

    headerBg: palette.primary600,
    headerText: palette.white,

    success: palette.success600,
    successBg: palette.successBg_light,
    successText: palette.successText_light,

    danger: palette.danger600,
    dangerBg: palette.dangerBg_light,
    dangerText: palette.dangerText_light,

    settledBg: palette.neutral100,
    settledText: palette.neutral600,

    rowEven: palette.white,
    rowOdd: "#F8F9FF",

    modalBg: palette.white,
    overlay: "rgba(0,0,0,0.5)",

    toggleTrackActive: palette.primary600,
    toggleTrackInactive: palette.neutral300,

    chipAccountBg: palette.primary50,
    chipAccountText: palette.primary700,
};

export const darkColors = {
    primary: palette.primary400,
    primaryLight: palette.primary500,
    secondary: palette.secondary400,

    background: palette.dark_mantle,
    surface: palette.dark_base,
    surfaceVariant: palette.dark_surface0,
    surfaceElevated: palette.dark_surface0,

    onBackground: palette.dark_text,
    onSurface: palette.dark_text,
    onSurfaceVariant: palette.dark_subtext,
    onSurfaceMuted: palette.dark_overlay,

    border: palette.dark_surface1,
    borderStrong: palette.dark_surface2,

    headerBg: palette.dark_crust,
    headerText: palette.dark_text,

    success: palette.success400,
    successBg: palette.successBg_dark,
    successText: palette.successText_dark,

    danger: palette.danger400,
    dangerBg: palette.dangerBg_dark,
    dangerText: palette.dangerText_dark,

    settledBg: palette.dark_surface1,
    settledText: palette.dark_subtext,

    rowEven: palette.dark_base,
    rowOdd: palette.dark_surface0,

    modalBg: palette.dark_surface0,
    overlay: "rgba(0,0,0,0.7)",

    toggleTrackActive: palette.primary400,
    toggleTrackInactive: palette.dark_surface2,

    chipAccountBg: "rgba(129,140,248,0.15)",
    chipAccountText: palette.primary400,
};

export type AppColors = typeof lightColors;

// ─── react-native-paper MD3 themes ─────────────────────────────────────────
export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: lightColors.primary,
        onPrimary: palette.white,
        primaryContainer: palette.primary50,
        onPrimaryContainer: palette.primary700,
        secondary: lightColors.secondary,
        onSecondary: palette.white,
        background: lightColors.background,
        onBackground: lightColors.onBackground,
        surface: lightColors.surface,
        onSurface: lightColors.onSurface,
        surfaceVariant: lightColors.surfaceVariant,
        onSurfaceVariant: lightColors.onSurfaceVariant,
        outline: lightColors.border,
        error: lightColors.danger,
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: darkColors.primary,
        onPrimary: palette.dark_crust,
        primaryContainer: "rgba(129,140,248,0.2)",
        onPrimaryContainer: palette.primary400,
        secondary: darkColors.secondary,
        onSecondary: palette.dark_crust,
        background: darkColors.background,
        onBackground: darkColors.onBackground,
        surface: darkColors.surface,
        onSurface: darkColors.onSurface,
        surfaceVariant: darkColors.surfaceVariant,
        onSurfaceVariant: darkColors.onSurfaceVariant,
        outline: darkColors.border,
        error: darkColors.danger,
    },
};
