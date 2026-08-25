import { useAppTheme } from "@/hooks/useAppTheme";
import BackupService, { IBackupPreview } from "@/services/backup.service";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Divider, Icon, Text, TextInput } from "react-native-paper";

interface BackupModalProps {
    readonly setVisibility: (visible: boolean) => void;
    readonly onRestoreSuccess: () => void;
    readonly initialMode?: "export" | "import";
}

export default function BackupModal({ setVisibility, onRestoreSuccess, initialMode = "export" }: BackupModalProps) {
    const db = useSQLiteContext();
    const { colors } = useAppTheme();

    const [mode, setMode] = useState<"export" | "import">(initialMode);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Processing...");

    // Export success state
    const [exportSuccessData, setExportSuccessData] = useState<{ uri: string; fileName: string } | null>(null);

    // Restore success state
    const [restoreSuccessData, setRestoreSuccessData] = useState<IBackupPreview | null>(null);

    // Import state
    const [importPreview, setImportPreview] = useState<IBackupPreview | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    async function handleExport() {
        try {
            setLoadingMessage("Encrypting & Downloading Backup...");
            setIsLoading(true);
            setImportError(null);
            await new Promise((resolve) => setTimeout(resolve, 150));
            const res = await BackupService.exportBackup(db, password);
            setIsLoading(false);
            setExportSuccessData({ uri: res.uri, fileName: res.fileName });
        } catch (error: any) {
            setIsLoading(false);
            setImportError(error.message || "Failed to generate backup file.");
        }
    }

    async function handleShareExportedFile() {
        if (!exportSuccessData) return;
        try {
            await BackupService.shareBackupFile(exportSuccessData.uri, exportSuccessData.fileName);
        } catch (error) {
            console.error("Error sharing backup file:", error);
        }
    }

    async function handlePickFile() {
        try {
            setImportError(null);

            // 1. Open system file picker without showing loader during browsing
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            // 2. File selected! Now show loader while reading and decrypting
            setLoadingMessage("Reading & Decrypting Backup File...");
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const pickedFile = result.assets[0];
            let fileContent = "";

            if (Platform.OS === "web") {
                if (pickedFile.file) {
                    fileContent = await pickedFile.file.text();
                } else if (pickedFile.uri) {
                    const response = await fetch(pickedFile.uri);
                    fileContent = await response.text();
                }
            } else {
                fileContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
                    encoding: FileSystem.EncodingType.UTF8,
                });
            }

            const preview = BackupService.parseBackupContent(fileContent, password);
            setIsLoading(false);
            if (preview) {
                setImportPreview(preview);
            }
        } catch (error: any) {
            setIsLoading(false);
            console.error("Error reading/decrypting backup file:", error);
            setImportError(error.message || "Could not read backup file. Check password if encrypted.");
        }
    }

    async function handleConfirmRestore() {
        if (!importPreview) return;
        try {
            setLoadingMessage("Restoring Database & Recalculating Balances...");
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 200));
            BackupService.restoreBackup(db, importPreview.rawPayload);
            setIsLoading(false);
            setRestoreSuccessData(importPreview);
        } catch (error: any) {
            setIsLoading(false);
            setImportError(error.message || "Unable to restore database.");
        }
    }

    function handleFinishRestore() {
        onRestoreSuccess();
        setVisibility(false);
    }

    return (
        <View style={{ width: "100%", maxHeight: 520, position: "relative" }}>
            {/* Loader Overlay */}
            {isLoading && (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.modalBg,
                        zIndex: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 16,
                        padding: 24,
                        gap: 16,
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface, textAlign: "center" }}>
                        {loadingMessage}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}>
                        Please wait while your financial records are processed safely.
                    </Text>
                </View>
            )}

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 20 }} style={{ width: "100%" }}>
                {/* EXPORT SUCCESS CONFIRMATION MODAL CARD */}
                {exportSuccessData && (
                    <View style={{ gap: 16, alignItems: "center", paddingVertical: 10 }}>
                        <View
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: colors.success + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon source="check-decagram-outline" size={34} color={colors.success} />
                        </View>

                        <View style={{ alignItems: "center" }}>
                            <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface, marginBottom: 4, textAlign: "center" }}>
                                Backup Downloaded Successfully
                            </Text>
                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}>
                                Your encrypted backup file has been generated and saved to your device storage.
                            </Text>
                        </View>

                        <View
                            style={{
                                width: "100%",
                                backgroundColor: colors.surfaceVariant + "80",
                                borderRadius: 12,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: colors.border,
                                gap: 10,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontWeight: "600" }}>File Name:</Text>
                                <Text style={{ fontSize: 12, color: colors.onSurface, fontWeight: "700" }}>{exportSuccessData.fileName}</Text>
                            </View>
                            <Divider />
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontWeight: "600" }}>Security:</Text>
                                <Text style={{ fontSize: 12, color: colors.successText || colors.primary, fontWeight: "700" }}>AES-256 Encrypted ✓</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, width: "100%", marginTop: 4 }}>
                            <Button
                                mode="outlined"
                                onPress={handleShareExportedFile}
                                icon="share-variant-outline"
                                textColor={colors.primary}
                                style={{ flex: 1, borderRadius: 10, borderColor: colors.primary }}
                                contentStyle={{ paddingVertical: 4 }}
                            >
                                Share File
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => setVisibility(false)}
                                icon="check"
                                buttonColor={colors.primary}
                                style={{ flex: 1, borderRadius: 10 }}
                                contentStyle={{ paddingVertical: 4 }}
                            >
                                Done
                            </Button>
                        </View>
                    </View>
                )}

                {/* RESTORE SUCCESS CONFIRMATION MODAL CARD */}
                {restoreSuccessData && (
                    <View style={{ gap: 16, alignItems: "center", paddingVertical: 10 }}>
                        <View
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: colors.success + "20",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Icon source="database-check-outline" size={34} color={colors.success} />
                        </View>

                        <View style={{ alignItems: "center" }}>
                            <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface, marginBottom: 4, textAlign: "center" }}>
                                Database Restored!
                            </Text>
                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 18 }}>
                                All financial records have been successfully imported into your app database.
                            </Text>
                        </View>

                        <View
                            style={{
                                width: "100%",
                                backgroundColor: colors.surfaceVariant + "80",
                                borderRadius: 12,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: colors.border,
                                gap: 10,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Accounts Restored:</Text>
                                <Text style={{ fontSize: 13, color: colors.onSurface, fontWeight: "700" }}>{restoreSuccessData.userCount} users</Text>
                            </View>
                            <Divider />
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Transactions Restored:</Text>
                                <Text style={{ fontSize: 13, color: colors.onSurface, fontWeight: "700" }}>{restoreSuccessData.transactionCount} entries</Text>
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleFinishRestore}
                            icon="check"
                            buttonColor={colors.success}
                            style={{ width: "100%", borderRadius: 10, marginTop: 4 }}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            Done & Refresh App
                        </Button>
                    </View>
                )}

                {/* NORMAL FORM VIEW (WHEN NOT SUCCESS) */}
                {!exportSuccessData && !restoreSuccessData && (
                    <>
                        {/* Header Title */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: colors.primary + "20",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon source="cloud-sync" size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: "800", color: colors.onSurface }}>
                                    Backup & Restore
                                </Text>
                                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                    Encrypted database export and import
                                </Text>
                            </View>
                        </View>

                        {/* Segmented Mode Selector */}
                        <View
                            style={{
                                flexDirection: "row",
                                backgroundColor: colors.surfaceVariant,
                                borderRadius: 12,
                                padding: 4,
                                marginBottom: 20,
                            }}
                        >
                            <Pressable
                                disabled={isLoading}
                                onPress={() => {
                                    setMode("export");
                                    setImportError(null);
                                    setImportPreview(null);
                                }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    backgroundColor: mode === "export" ? colors.surface : "transparent",
                                    alignItems: "center",
                                    shadowColor: "#000",
                                    shadowOpacity: mode === "export" ? 0.08 : 0,
                                    shadowRadius: 2,
                                    elevation: mode === "export" ? 2 : 0,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "700",
                                        color: mode === "export" ? colors.primary : colors.onSurfaceVariant,
                                    }}
                                >
                                    Export Backup
                                </Text>
                            </Pressable>

                            <Pressable
                                disabled={isLoading}
                                onPress={() => {
                                    setMode("import");
                                    setImportError(null);
                                }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    backgroundColor: mode === "import" ? colors.surface : "transparent",
                                    alignItems: "center",
                                    shadowColor: "#000",
                                    shadowOpacity: mode === "import" ? 0.08 : 0,
                                    shadowRadius: 2,
                                    elevation: mode === "import" ? 2 : 0,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "700",
                                        color: mode === "import" ? colors.primary : colors.onSurfaceVariant,
                                    }}
                                >
                                    Import Backup
                                </Text>
                            </Pressable>
                        </View>

                        {/* EXPORT MODE */}
                        {mode === "export" && (
                            <View style={{ gap: 16 }}>
                                <View style={{ backgroundColor: colors.surfaceVariant + "60", borderRadius: 12, padding: 14 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <Icon source="shield-lock-outline" size={18} color={colors.primary} />
                                        <Text style={{ fontWeight: "700", color: colors.onSurface, fontSize: 13 }}>AES-256 Encryption Protected</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 17 }}>
                                        Your data will be encrypted securely before saving the <Text style={{ fontWeight: "700" }}>.fkbackup</Text> file.
                                    </Text>
                                </View>

                                <TextInput
                                    mode="outlined"
                                    label="Encryption Password (Optional)"
                                    placeholder="Set optional password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    textColor={colors.onSurface}
                                    outlineColor={colors.border}
                                    activeOutlineColor={colors.primary}
                                    right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                                />

                                {importError && (
                                    <View style={{ backgroundColor: colors.dangerBg, padding: 12, borderRadius: 10 }}>
                                        <Text style={{ color: colors.dangerText, fontSize: 12, fontWeight: "600" }}>{importError}</Text>
                                    </View>
                                )}

                                <Button
                                    mode="contained"
                                    onPress={handleExport}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    icon="download-outline"
                                    buttonColor={colors.primary}
                                    style={{ borderRadius: 10, marginTop: 4 }}
                                    contentStyle={{ paddingVertical: 6 }}
                                >
                                    Download Backup File
                                </Button>
                            </View>
                        )}

                        {/* IMPORT MODE */}
                        {mode === "import" && (
                            <View style={{ gap: 16 }}>
                                {!importPreview ? (
                                    <>
                                        <TextInput
                                            mode="outlined"
                                            label="Backup Password (if password protected)"
                                            placeholder="Enter file password"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            textColor={colors.onSurface}
                                            outlineColor={colors.border}
                                            activeOutlineColor={colors.primary}
                                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                                        />

                                        <Button
                                            mode="outlined"
                                            onPress={handlePickFile}
                                            loading={isLoading}
                                            disabled={isLoading}
                                            icon="file-search-outline"
                                            textColor={colors.primary}
                                            style={{ borderRadius: 10, borderColor: colors.primary }}
                                            contentStyle={{ paddingVertical: 6 }}
                                        >
                                            Select Backup File
                                        </Button>

                                        {importError && (
                                            <View style={{ backgroundColor: colors.dangerBg, padding: 12, borderRadius: 10 }}>
                                                <Text style={{ color: colors.dangerText, fontSize: 12, fontWeight: "600" }}>{importError}</Text>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View
                                        style={{
                                            backgroundColor: colors.surfaceVariant + "80",
                                            borderRadius: 12,
                                            padding: 14,
                                            borderWidth: 1,
                                            borderColor: colors.primary + "40",
                                            gap: 10,
                                        }}
                                    >
                                        <Text style={{ fontWeight: "800", color: colors.primary, fontSize: 14 }}>Backup File Verified ✓</Text>
                                        <Divider />
                                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Accounts:</Text>
                                            <Text style={{ fontWeight: "700", color: colors.onSurface, fontSize: 13 }}>{importPreview.userCount} users</Text>
                                        </View>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Transactions:</Text>
                                            <Text style={{ fontWeight: "700", color: colors.onSurface, fontSize: 13 }}>
                                                {importPreview.transactionCount} entries
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Export Date:</Text>
                                            <Text style={{ fontWeight: "700", color: colors.onSurface, fontSize: 13 }}>
                                                {new Date(importPreview.exportedAt).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        <Button
                                            mode="contained"
                                            onPress={handleConfirmRestore}
                                            loading={isLoading}
                                            disabled={isLoading}
                                            icon="database-import"
                                            buttonColor={colors.success}
                                            style={{ borderRadius: 10, marginTop: 8 }}
                                            contentStyle={{ paddingVertical: 6 }}
                                        >
                                            Restore Database Now
                                        </Button>

                                        <Button
                                            mode="text"
                                            onPress={() => setImportPreview(null)}
                                            textColor={colors.onSurfaceVariant}
                                            style={{ marginTop: 2 }}
                                            labelStyle={{ fontSize: 12 }}
                                        >
                                            Choose Different File / Re-enter Password
                                        </Button>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
