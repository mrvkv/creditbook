import { AppColors, darkColors, lightColors } from "@/constants/theme.constant";
import { createContext, useContext, useSyncExternalStore } from "react";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemeMode = "system" | "light" | "dark";

export type AppTheme = {
    colors: AppColors;
    isDark: boolean;
    themeMode: ThemeMode;
    toggleTheme: () => void;
};

// ─── External Theme Store (React 18/19 standard) ───────────────────────────
let manualOverride: "light" | "dark" | null = null;
let systemScheme: ColorSchemeName = Appearance.getColorScheme();
const listeners = new Set<() => void>();

function computeIsDark(): boolean {
    if (manualOverride) {
        return manualOverride === "dark";
    }
    return systemScheme === "dark";
}

let snapshot: AppTheme = {
    colors: computeIsDark() ? darkColors : lightColors,
    isDark: computeIsDark(),
    themeMode: "system",
    toggleTheme: () => {}, // overridden below
};

function updateSnapshot() {
    const isDark = computeIsDark();
    snapshot = {
        colors: isDark ? darkColors : lightColors,
        isDark,
        themeMode: manualOverride || "system",
        toggleTheme,
    };
    listeners.forEach((listener) => listener());
}

function toggleTheme() {
    const currentlyDark = computeIsDark();
    manualOverride = currentlyDark ? "light" : "dark";
    updateSnapshot();
}

// System appearance listener
Appearance.addChangeListener(({ colorScheme }) => {
    systemScheme = colorScheme || Appearance.getColorScheme();
    updateSnapshot();
});

export const themeStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getSnapshot() {
        return snapshot;
    },
    toggleTheme,
};

// Attach toggleTheme to initial snapshot
snapshot.toggleTheme = toggleTheme;

// ─── React Context & Hooks ──────────────────────────────────────────────────
export const ThemeContext = createContext<AppTheme>(snapshot);

/**
 * Universal theme hook: subscribes directly to the theme store.
 * Works seamlessly across native headers, portals, modals, and screens!
 */
export function useAppTheme(): AppTheme {
    return useSyncExternalStore(
        themeStore.subscribe,
        themeStore.getSnapshot,
        themeStore.getSnapshot
    );
}

export function useThemeValue(): AppTheme {
    return useAppTheme();
}
