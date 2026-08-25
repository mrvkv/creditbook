import CryptoService from "@/services/crypto.service";
import DatabaseService from "@/services/database.service";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

export interface IBackupPreview {
    userCount: number;
    transactionCount: number;
    exportedAt: string;
    appName: string;
    rawPayload: any;
}

export default class BackupService {
    /**
     * Generates encrypted backup payload from database and downloads/saves it to device storage.
     */
    public static async exportBackup(
        db: SQLiteDatabase,
        password?: string
    ): Promise<{ success: boolean; uri: string; fileName: string; savedToFolder: boolean }> {
        try {
            const dataPayload = DatabaseService.exportAllData(db);
            const encryptedContent = CryptoService.encrypt(dataPayload, password);

            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `FinanceKeeper_Backup_${dateStr}.fkbackup`;

            if (Platform.OS === "web") {
                // Web direct download
                const blob = new Blob([encryptedContent], { type: "application/octet-stream" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
                return { success: true, uri: fileName, fileName, savedToFolder: true };
            }

            // Try Android StorageAccessFramework for direct download to user's selected folder (e.g., Downloads)
            if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
                try {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                            permissions.directoryUri,
                            fileName,
                            "application/octet-stream"
                        );
                        await FileSystem.writeAsStringAsync(newFileUri, encryptedContent, {
                            encoding: FileSystem.EncodingType.UTF8,
                        });
                        return { success: true, uri: newFileUri, fileName, savedToFolder: true };
                    }
                } catch (safErr) {
                    console.warn("StorageAccessFramework skipped or cancelled:", safErr);
                }
            }

            // Standard local document storage fallback
            const fileDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            const fileUri = `${fileDir}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, encryptedContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            return { success: true, uri: fileUri, fileName, savedToFolder: false };
        } catch (error) {
            console.error("Failed to export backup:", error);
            throw error;
        }
    }

    /**
     * Shares an exported backup file via OS share sheet.
     * Converts content:// URIs to local file:// URIs as required by expo-sharing on Android.
     */
    public static async shareBackupFile(fileUri: string, fileName?: string): Promise<void> {
        let shareableUri = fileUri;

        if (fileUri.startsWith("content://")) {
            const cacheName = fileName || `FinanceKeeper_Backup_${Date.now()}.fkbackup`;
            const cachedFileUri = `${FileSystem.cacheDirectory}${cacheName}`;
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            await FileSystem.writeAsStringAsync(cachedFileUri, fileContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            shareableUri = cachedFileUri;
        }

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(shareableUri, {
                mimeType: "application/octet-stream",
                dialogTitle: "Share Finance Keeper Backup",
                UTI: "public.data",
            });
        }
    }

    /**
     * Opens document picker to let user select a backup file, reads and decrypts it.
     */
    public static async pickBackupFile(password?: string): Promise<IBackupPreview | null> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return null;
            }

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

            return BackupService.parseBackupContent(fileContent, password);
        } catch (error) {
            console.error("Error picking backup file:", error);
            throw error;
        }
    }

    /**
     * Decrypts string content into a backup preview object.
     */
    public static parseBackupContent(fileContent: string, password?: string): IBackupPreview {
        const decryptedPayload = CryptoService.decrypt(fileContent, password);

        if (!decryptedPayload || (!Array.isArray(decryptedPayload.users) && !Array.isArray(decryptedPayload.transactions))) {
            throw new Error("Invalid backup file format. Expected users or transactions records.");
        }

        const userCount = Array.isArray(decryptedPayload.users) ? decryptedPayload.users.length : 0;
        const transactionCount = Array.isArray(decryptedPayload.transactions) ? decryptedPayload.transactions.length : 0;

        return {
            userCount,
            transactionCount,
            exportedAt: decryptedPayload.exportedAt || new Date().toISOString(),
            appName: decryptedPayload.appName || "FinanceKeeper",
            rawPayload: decryptedPayload,
        };
    }

    /**
     * Restores raw backup payload into the database.
     */
    public static restoreBackup(db: SQLiteDatabase, rawPayload: any): void {
        DatabaseService.restoreBackupData(db, rawPayload);
    }
}
