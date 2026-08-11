import SplashScreen from "@/components/SplashScreen";
import { HomeHeaderTitle } from "@/components/HeaderTitle";
import { darkTheme, lightTheme } from "@/constants/theme.constant";
import { ThemeContext, useThemeValue } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { Stack } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";

// Prevent the native splash from auto-hiding — we control it manually
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const appTheme = useThemeValue();
    const { colors, isDark } = appTheme;
    const paperTheme = isDark ? darkTheme : lightTheme;

    const [showSplash, setShowSplash] = useState(true);

    // Hide native splash immediately — our custom one takes over
    useEffect(() => {
        ExpoSplashScreen.hideAsync();
    }, []);

    function handleSplashFinish() {
        setShowSplash(false);
    }

    return (
        <SQLiteProvider databaseName="creditbook" onInit={DatabaseService.migrate}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <ThemeContext.Provider value={appTheme}>
                <PaperProvider theme={paperTheme}>
                    <Stack
                        screenOptions={{
                            headerTitleAlign: "center",
                            headerStyle: {
                                backgroundColor: colors.headerBg,
                            },
                            headerTintColor: colors.headerText,
                            headerTitleStyle: {
                                fontWeight: "700",
                                fontSize: 18,
                                letterSpacing: 0.3,
                            },
                            headerShadowVisible: true,
                            contentStyle: {
                                backgroundColor: colors.background,
                            },
                        }}
                    >
                        <Stack.Screen
                            name="index"
                            options={{
                                title: "Credit Book",
                                headerTitleAlign: "left",
                                headerTitle: () => (
                                    <ThemeContext.Provider value={appTheme}>
                                        <HomeHeaderTitle />
                                    </ThemeContext.Provider>
                                ),
                            }}
                        />
                        <Stack.Screen name="details" options={{ title: "Transactions" }} />
                    </Stack>

                    {/* Custom animated splash — renders on top of everything */}
                    {showSplash && (
                        <SplashScreen onFinish={handleSplashFinish} />
                    )}
                </PaperProvider>
            </ThemeContext.Provider>
        </SQLiteProvider>
    );
}
