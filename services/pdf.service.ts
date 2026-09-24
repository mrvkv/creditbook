import { TransactionType } from "@/enums/transaction.enum";
import { ITransaction } from "@/types/transaction.interface";
import { formatDateLabel, formatTime } from "@/utils/date.util";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface IStatementFilterOptions {
    readonly userName?: string;
    readonly typeFilter: "all" | "credit" | "debit";
    readonly includeSettled: boolean;
    readonly dateRangePreset: "all" | "this_month" | "last_month" | "last_30_days" | "last_90_days" | "custom";
    readonly startDate?: Date;
    readonly endDate?: Date;
}

export interface IStatementSummary {
    readonly totalCount: number;
    readonly totalCredit: number;
    readonly totalDebit: number;
    readonly netBalance: number;
}

export default class PdfService {
    /**
     * Filters a transaction list based on user statement filter options.
     */
    public static filterTransactions(
        transactions: ITransaction[],
        options: IStatementFilterOptions
    ): ITransaction[] {
        let list = [...(transactions || [])];

        // 1. Transaction Type filter
        if (options.typeFilter === "credit") {
            list = list.filter((t) => t.type === TransactionType.Credit);
        } else if (options.typeFilter === "debit") {
            list = list.filter((t) => t.type === TransactionType.Debit);
        }

        // 2. Settled filter
        if (!options.includeSettled) {
            list = list.filter((t) => t.isSettled !== 1);
        }

        // 3. Date Range filter
        const now = new Date();
        let startTimestamp: number | null = null;
        let endTimestamp: number | null = null;

        if (options.dateRangePreset === "this_month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            startTimestamp = start.getTime();
        } else if (options.dateRangePreset === "last_month") {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            startTimestamp = start.getTime();
            endTimestamp = end.getTime();
        } else if (options.dateRangePreset === "last_30_days") {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            start.setHours(0, 0, 0, 0);
            startTimestamp = start.getTime();
        } else if (options.dateRangePreset === "last_90_days") {
            const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            start.setHours(0, 0, 0, 0);
            startTimestamp = start.getTime();
        } else if (options.dateRangePreset === "custom") {
            if (options.startDate) {
                const s = new Date(options.startDate);
                s.setHours(0, 0, 0, 0);
                startTimestamp = s.getTime();
            }
            if (options.endDate) {
                const e = new Date(options.endDate);
                e.setHours(23, 59, 59, 999);
                endTimestamp = e.getTime();
            }
        }

        if (startTimestamp !== null) {
            list = list.filter((t) => new Date(t.date).getTime() >= startTimestamp!);
        }
        if (endTimestamp !== null) {
            list = list.filter((t) => new Date(t.date).getTime() <= endTimestamp!);
        }

        // Sort chronologically ascending for a statement ledger
        list.sort((a, b) => {
            const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
            return diff !== 0 ? diff : a.transactionId - b.transactionId;
        });

        return list;
    }

    /**
     * Calculates summary totals for filtered transactions.
     */
    public static calculateSummary(transactions: ITransaction[]): IStatementSummary {
        let totalCredit = 0;
        let totalDebit = 0;

        for (const t of transactions) {
            if (t.type === TransactionType.Credit) {
                totalCredit += t.amount;
            } else {
                totalDebit += t.amount;
            }
        }

        const netBalance = totalDebit - totalCredit;
        return {
            totalCount: transactions.length,
            totalCredit,
            totalDebit,
            netBalance,
        };
    }

    /**
     * Generates a modern, clean HTML report template.
     */
    public static generateStatementHtml(
        transactions: ITransaction[],
        options: IStatementFilterOptions,
        summary: IStatementSummary
    ): string {
        const generatedAt = new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        const periodText =
            options.dateRangePreset === "all"
                ? "All Time"
                : options.dateRangePreset === "this_month"
                ? "Current Month"
                : options.dateRangePreset === "last_month"
                ? "Previous Month"
                : options.dateRangePreset === "last_30_days"
                ? "Last 30 Days"
                : options.dateRangePreset === "last_90_days"
                ? "Last 90 Days"
                : options.startDate && options.endDate
                ? `${formatDateLabel(options.startDate)} to ${formatDateLabel(options.endDate)}`
                : "Custom Period";

        const typeFilterLabel =
            options.typeFilter === "credit"
                ? "Got (Credit) Only"
                : options.typeFilter === "debit"
                ? "Gave (Debit) Only"
                : "All (Credit & Debit)";

        // Running balance accumulator
        let currentRunningBalance = 0;

        const tableRows = transactions.map((t, index) => {
            const isCredit = t.type === TransactionType.Credit;
            const isSettled = t.isSettled === 1;

            if (isCredit) {
                currentRunningBalance -= t.amount;
            } else {
                currentRunningBalance += t.amount;
            }

            const formattedDate = `${formatDateLabel(t.date)} ${formatTime(t.date)}`;
            const debitCell = !isCredit ? `₹${t.amount.toLocaleString("en-IN")}` : "-";
            const creditCell = isCredit ? `₹${t.amount.toLocaleString("en-IN")}` : "-";
            const balanceSign = currentRunningBalance > 0 ? "+" : currentRunningBalance < 0 ? "-" : "";
            const balanceCell = currentRunningBalance === 0 ? "₹0" : `${balanceSign}₹${Math.abs(currentRunningBalance).toLocaleString("en-IN")}`;
            const balanceColor = currentRunningBalance > 0 ? "#059669" : currentRunningBalance < 0 ? "#DC2626" : "#64748B";

            return `
                <tr style="background-color: ${index % 2 === 0 ? "#FFFFFF" : "#F8FAFC"}; page-break-inside: avoid !important; break-inside: avoid !important;">
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; color: #475569; white-space: nowrap;">
                        ${formattedDate}
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; color: #1E293B; font-weight: 600;">
                        ${t.remark || (isCredit ? "Credit Entry" : "Debit Entry")}
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 10px; font-weight: 700; color: ${isCredit ? "#059669" : "#DC2626"};">
                        ${isCredit ? "GOT" : "GAVE"}
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 10px;">
                        ${
                            isSettled
                                ? `<span style="background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">Settled</span>`
                                : `<span style="background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">Active</span>`
                        }
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; font-weight: 700; color: #DC2626; text-align: right;">
                        ${debitCell}
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; font-weight: 700; color: #059669; text-align: right;">
                        ${creditCell}
                    </td>
                    <td style="padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; font-weight: 800; color: ${balanceColor}; text-align: right;">
                        ${balanceCell}
                    </td>
                </tr>
            `;
        }).join("");

        const netSign = summary.netBalance > 0 ? "+" : summary.netBalance < 0 ? "-" : "";
        const netStatus = summary.netBalance > 0 ? "Net Receivable" : summary.netBalance < 0 ? "Net Payable" : "Settled Up (₹0)";
        const netColor = summary.netBalance > 0 ? "#059669" : summary.netBalance < 0 ? "#DC2626" : "#475569";

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>Account Statement</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 12mm 10mm 12mm 10mm;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #1E293B;
                        background: #FFFFFF;
                        padding: 16px 20px;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    @media print {
                        body {
                            padding: 0 !important;
                        }
                    }
                    .keep-together {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    table.statement-table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        margin-top: 4px;
                        margin-bottom: 20px;
                        page-break-inside: auto;
                        border: 1px solid #CBD5E1;
                    }
                    table.statement-table thead {
                        display: table-header-group !important;
                    }
                    table.statement-table tbody {
                        display: table-row-group;
                    }
                    table.statement-table tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    table.statement-table th {
                        background-color: #0F172A !important;
                        color: #FFFFFF !important;
                        padding: 10px 10px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border: 1px solid #0F172A;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    table.statement-table td {
                        padding: 8px 10px;
                        border: 1px solid #E2E8F0;
                        font-size: 11px;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .footer-note {
                        border-top: 1px solid #E2E8F0;
                        padding-top: 14px;
                        text-align: center;
                        color: #94A3B8;
                        font-size: 10px;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                </style>
            </head>
            <body>
                <div class="keep-together">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 18px; margin-bottom: 20px;">
                        <div>
                            <div style="font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
                                Finance Keeper
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                Personal Finance Books
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: #2563EB; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 4px 14px; border-radius: 8px; display: inline-block; letter-spacing: 0.5px;">
                                ACCOUNT STATEMENT
                            </div>
                            <div style="font-size: 11px; color: #64748B; margin-top: 6px;">
                                Generated: ${generatedAt}
                            </div>
                        </div>
                    </div>

                    <!-- Account & Metadata Information Card -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Account Name
                                </div>
                                <div style="font-size: 18px; font-weight: 900; color: #0F172A; margin-top: 2px;">
                                    ${options.userName || "Global Ledger (All Accounts)"}
                                </div>
                            </div>

                            <div>
                                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Statement Period
                                </div>
                                <div style="font-size: 13px; font-weight: 800; color: #1E293B; margin-top: 2px;">
                                    ${periodText}
                                </div>
                            </div>

                            <div>
                                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Filters Applied
                                </div>
                                <div style="font-size: 12px; font-weight: 700; color: #334155; margin-top: 2px;">
                                    ${typeFilterLabel} ${options.includeSettled ? "• Settled Included" : "• Active Only"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KPI Summary Cards -->
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <!-- Total Debit (Gave) -->
                        <div style="flex: 1; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 12px 14px;">
                            <div style="font-size: 10px; font-weight: 700; color: #991B1B; text-transform: uppercase;">
                                Total Gave (Debit)
                            </div>
                            <div style="font-size: 16px; font-weight: 900; color: #DC2626; margin-top: 4px;">
                                ₹${summary.totalDebit.toLocaleString("en-IN")}
                            </div>
                        </div>

                        <!-- Total Credit (Got) -->
                        <div style="flex: 1; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 12px 14px;">
                            <div style="font-size: 10px; font-weight: 700; color: #065F46; text-transform: uppercase;">
                                Total Got (Credit)
                            </div>
                            <div style="font-size: 16px; font-weight: 900; color: #059669; margin-top: 4px;">
                                ₹${summary.totalCredit.toLocaleString("en-IN")}
                            </div>
                        </div>

                        <!-- Net Balance -->
                        <div style="flex: 1.2; background: #F8FAFC; border: 1.5px solid ${netColor}40; border-radius: 12px; padding: 12px 14px;">
                            <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">
                                Closing Net Balance
                            </div>
                            <div style="font-size: 16px; font-weight: 900; color: ${netColor}; margin-top: 4px;">
                                ${netSign}₹${Math.abs(summary.netBalance).toLocaleString("en-IN")} <span style="font-size: 11px; font-weight: 700;">(${netStatus})</span>
                            </div>
                        </div>

                        <!-- Transactions Count -->
                        <div style="flex: 0.8; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 14px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">
                                Total Entries
                            </div>
                            <div style="font-size: 16px; font-weight: 900; color: #1E293B; margin-top: 4px;">
                                ${summary.totalCount}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transactions Table -->
                <table class="statement-table">
                    <thead>
                        <tr style="background-color: #0F172A; color: #FFFFFF; page-break-inside: avoid !important; break-inside: avoid !important;">
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; width: 17%;">Date & Time</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Remark / Description</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; width: 9%;">Type</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; width: 9%;">Status</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 14%;">Gave (Dr ₹)</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 14%;">Got (Cr ₹)</th>
                            <th style="padding: 10px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 14%;">Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            tableRows.length > 0
                                ? tableRows
                                : `<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748B; font-weight: 600;">No transactions found matching the selected filter criteria.</td></tr>`
                        }
                    </tbody>
                </table>

                <!-- Footer Note -->
                <div class="footer-note">
                    This is a computer-generated statement from Finance Keeper. No signature required.
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Renders statement HTML, prints to PDF file, and triggers native share dialog.
     */
    public static async exportAndShareStatement(
        transactions: ITransaction[],
        options: IStatementFilterOptions
    ): Promise<{ success: boolean; uri: string; fileName: string }> {
        // Dynamic import of expo-print to avoid runtime errors if package was just installed
        const Print = await import("expo-print");

        const filtered = PdfService.filterTransactions(transactions, options);
        const summary = PdfService.calculateSummary(filtered);
        const html = PdfService.generateStatementHtml(filtered, options, summary);

        const safeName = (options.userName || "All_Accounts").replace(/[^a-zA-Z0-9_-]/g, "_");
        const dateTag = new Date().toISOString().slice(0, 10);
        const fileName = `Statement_${safeName}_${dateTag}.pdf`;

        // 1. Generate PDF file via expo-print
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        // 2. Prepare file in documentDirectory if needed
        let finalUri = uri;
        if (FileSystem.documentDirectory) {
            const destUri = `${FileSystem.documentDirectory}${fileName}`;
            try {
                await FileSystem.copyAsync({ from: uri, to: destUri });
                finalUri = destUri;
            } catch (copyErr) {
                // If copy fails, fallback to original temp uri
                finalUri = uri;
            }
        }

        // 3. Web direct download fallback
        if (Platform.OS === "web") {
            try {
                await Print.printAsync({ html });
                return { success: true, uri: finalUri, fileName };
            } catch (webErr) {
                console.warn("Web print error:", webErr);
            }
        }

        // 4. Native share sheet via expo-sharing
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
            await Sharing.shareAsync(finalUri, {
                mimeType: "application/pdf",
                dialogTitle: `Share Statement - ${options.userName || "Finance Keeper"}`,
                UTI: "com.adobe.pdf",
            });
        }

        return { success: true, uri: finalUri, fileName };
    }
}
