import CryptoJS from "crypto-js";

const DEFAULT_SECRET = "FK_FINANCE_KEEPER_SECURE_KEY_2026_v1";
const HEADER_PREFIX = "FKENC1:";

// Safety patch for CryptoJS WordArray.random in React Native/Expo environments
// Prevents "Native crypto module could not be used to get secure random number." error
CryptoJS.lib.WordArray.random = function (nBytes: number) {
    const words: number[] = [];

    // Try native crypto.getRandomValues if available and functioning
    if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
        try {
            const byteBuffer = new Uint8Array(nBytes);
            globalThis.crypto.getRandomValues(byteBuffer);
            for (let i = 0; i < nBytes; i += 4) {
                const word =
                    ((byteBuffer[i] || 0) << 24) |
                    ((byteBuffer[i + 1] || 0) << 16) |
                    ((byteBuffer[i + 2] || 0) << 8) |
                    (byteBuffer[i + 3] || 0);
                words.push(word >>> 0);
            }
            return CryptoJS.lib.WordArray.create(words, nBytes);
        } catch {
            // Fall through to fallback random generator below if native crypto fails
        }
    }

    // Fallback pseudo-random entropy generator for RN environments without native crypto module
    for (let i = 0; i < nBytes; i += 4) {
        const r = Math.floor((Math.random() * 0x100000000) ^ (Date.now() * 1000 + i));
        words.push(r >>> 0);
    }
    return CryptoJS.lib.WordArray.create(words, nBytes);
};


export default class CryptoService {
    /**
     * Encrypts object payload into a protected string using AES-256.
     */
    public static encrypt(payload: object, customPassword?: string): string {
        const jsonStr = JSON.stringify(payload);
        const secretKey = customPassword && customPassword.trim().length > 0
            ? `${DEFAULT_SECRET}_${customPassword.trim()}`
            : DEFAULT_SECRET;

        const ciphertext = CryptoJS.AES.encrypt(jsonStr, secretKey).toString();
        return `${HEADER_PREFIX}${ciphertext}`;
    }

    /**
     * Decrypts encrypted backup string back into JSON object payload.
     * Throws an error if payload is tampered or password is incorrect.
     */
    public static decrypt(encryptedStr: string, customPassword?: string): any {
        const cleanStr = encryptedStr.trim();
        let ciphertext = cleanStr;

        if (cleanStr.startsWith(HEADER_PREFIX)) {
            ciphertext = cleanStr.substring(HEADER_PREFIX.length);
        }

        const secretKey = customPassword && customPassword.trim().length > 0
            ? `${DEFAULT_SECRET}_${customPassword.trim()}`
            : DEFAULT_SECRET;

        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) {
                throw new Error("Invalid decryption key or corrupted data");
            }

            return JSON.parse(decryptedData);
        } catch (error) {
            // Also try raw JSON parse in case user imported unencrypted legacy backup file
            try {
                const rawJson = JSON.parse(cleanStr);
                if (rawJson && (rawJson.users || rawJson.appName)) {
                    return rawJson;
                }
            } catch {
                // Ignore raw json fallback
            }

            throw new Error("Failed to decrypt file. Invalid password or corrupted backup file.");
        }
    }
}
