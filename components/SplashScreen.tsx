import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const screenOpacity  = useRef(new Animated.Value(1)).current;
    const logoScale      = useRef(new Animated.Value(0.6)).current;
    const logoOpacity    = useRef(new Animated.Value(0)).current;
    const textOpacity    = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(18)).current;
    const subOpacity     = useRef(new Animated.Value(0)).current;
    const footerOpacity  = useRef(new Animated.Value(0)).current;

    const [interactive, setInteractive] = useState(true);

    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            setInteractive(false);
            onFinish();
        }, 5000);

        Animated.sequence([
            // 1. Logo springs in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 65,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Title slides up
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]),
            // 3. Subtitle
            Animated.timing(subOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            // 4. Footer
            Animated.timing(footerOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            // 5. Hold
            Animated.delay(1500),
            // 6. Fade out all elements together
            Animated.parallel([
                Animated.timing(screenOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(subOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(footerOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(({ finished }) => {
            clearTimeout(safetyTimer);
            setInteractive(false);
            if (finished) onFinish();
        });

        return () => clearTimeout(safetyTimer);
    }, []);

    return (
        <Animated.View
            pointerEvents={interactive ? "auto" : "none"}
            style={[styles.root, { opacity: screenOpacity }]}
        >
            {/* Solid background — same indigo as the app header */}
            <View style={styles.bg} />

            {/* ── Main content ── */}
            <View style={styles.center}>

                {/* Logo badge */}
                <Animated.View
                    style={[
                        styles.logoBadge,
                        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                    ]}
                >
                    <View style={styles.logoInner}>
                        <Icon source="book-open-variant" size={80} color="#ffffff" />
                    </View>
                </Animated.View>

                {/* App name */}
                <Animated.View
                    style={{
                        opacity: textOpacity,
                        transform: [{ translateY: textTranslateY }],
                        marginTop: 36,
                        alignItems: "center",
                    }}
                >
                    <Text style={styles.title}>
                        <Text style={styles.titleWhite}>Credit</Text>
                        <Text style={styles.titlePurple}>Book</Text>
                    </Text>
                </Animated.View>

                {/* Subtitle */}
                <Animated.View style={{ opacity: subOpacity, marginTop: 8 }}>
                    <Text style={styles.subtitle}>PERSONAL LEDGER</Text>
                </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
                <Text style={styles.footerText}>Made with  ♥</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        alignItems: "center",
        justifyContent: "center",
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#4F46E5",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        paddingHorizontal: 32,
    },
    logoBadge: {
        width: 148,
        height: 148,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    logoInner: {
        width: 118,
        height: 118,
        borderRadius: 30,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 46,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    titleWhite: {
        color: "#ffffff",
        fontSize: 46,
        fontWeight: "900",
    },
    titlePurple: {
        color: "#C4B5FD",
        fontSize: 46,
        fontWeight: "900",
    },
    subtitle: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
        letterSpacing: 4,
        fontWeight: "600",
    },
    footer: {
        position: "absolute",
        bottom: 52,
        zIndex: 1,
    },
    footerText: {
        color: "rgba(255,255,255,0.38)",
        fontSize: 13,
        letterSpacing: 0.5,
    },
});
