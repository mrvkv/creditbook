import { Stack } from "expo-router";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

export default function RootLayout() {
    const theme = {
        ...MD3LightTheme,
    };

    return (
        <PaperProvider theme={theme}>
            <Stack screenOptions={{ headerTitleAlign: "center" }}>
                <Stack.Screen name="index" options={{ title: "Credit Book" }} />
                <Stack.Screen name="details" options={{ title: "Transactions" }} />
            </Stack>
        </PaperProvider>
    );
}
