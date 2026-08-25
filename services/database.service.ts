import { Tables } from "@/constants/table.constant";
import { TransactionType } from "@/enums/transaction.enum";
import { ITransaction } from "@/types/transaction.interface";
import { IUser } from "@/types/user.interface";
import * as SQLite from "expo-sqlite";
import QueryService from "./query.service";

export default class DatabaseService {
    private static isSettledChecked = false;

    public static ensureIsSettledColumn(db: SQLite.SQLiteDatabase): void {
        if (DatabaseService.isSettledChecked) return;
        try {
            const tableInfo = db.getAllSync("PRAGMA table_info(transactions)") as { name: string }[];
            const exists = tableInfo.some((col) => col.name === "isSettled");
            if (!exists) {
                db.execSync("ALTER TABLE transactions ADD COLUMN isSettled INTEGER DEFAULT 0;");
            }
            DatabaseService.isSettledChecked = true;
        } catch (error) {
            console.warn("Migration warning for isSettled column:", error);
        }
    }

    public static async migrate(db: SQLite.SQLiteDatabase): Promise<void> {
        let { user_version: currentDbVersion } = db.getFirstSync("PRAGMA user_version") as { user_version: number };

        // Version 0: Initial database creation (fresh install)
        if (currentDbVersion === 0) {
            db.execSync(QueryService.init());
            db.execSync(QueryService.setDefaults());
            currentDbVersion = 1;
            db.execSync(`PRAGMA user_version = 1`);
        }

        // Version 1 -> 2: Add preferences key-value table if missing
        if (currentDbVersion === 1) {
            db.execSync("CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
            currentDbVersion = 2;
            db.execSync(`PRAGMA user_version = 2`);
        }

        // Version 2 -> 3: Add isSettled column to transactions table
        if (currentDbVersion === 2) {
            DatabaseService.ensureIsSettledColumn(db);
            currentDbVersion = 3;
            db.execSync(`PRAGMA user_version = 3`);
        }

        // Runtime fallback: ensure isSettled column exists on any DB version
        DatabaseService.ensureIsSettledColumn(db);
    }

    public static seedSampleData(db: SQLite.SQLiteDatabase, force: boolean = false): void {
        // Only run sample data seeding in development mode (__DEV__)
        // or if explicitly enabled via EXPO_PUBLIC_ENABLE_SEEDING=true
        const explicitFlag = process.env.EXPO_PUBLIC_ENABLE_SEEDING;
        if (explicitFlag === "false" || (!__DEV__ && explicitFlag !== "true")) {
            return;
        }

        const userCountRow = db.getFirstSync("SELECT COUNT(*) as count FROM users") as { count: number } | null;
        if (!force && (userCountRow?.count ?? 0) >= 100) {
            return;
        }

        const sampleNames = [
            "Rahul Sharma", "Priya Patel", "Amit Verma", "Ananya Roy", "Vikram Singh",
            "Neha Gupta", "Rajesh Kumar", "Sneha Reddy", "Suresh Nair", "Pooja Joshi",
            "Deepak Malhotra", "Kavita Choudhary", "Manoj Tiwari", "Ritu Saxena", "Manish Agrawal",
            "Swati Deshmukh", "Sanjay Kapoor", "Meera Iyer", "Alok Mishra", "Divya Pillai",
            "Pankaj Yadav", "Sunita Bhatia", "Nitin Kulkarni", "Rashmi Rao", "Gaurav Das",
            "Shilpa Jain", "Tarun Mehta", "Neeta Pandey", "Harish Bhasin", "Jyoti Sen",
            "Akash Dutta", "Nisha Bansal", "Kunal Saxena", "Simran Arora", "Vivek Anand",
            "Aarti Sharma", "Siddharth Roy", "Trisha Kapoor", "Rohan Varma", "Isha Gupta",
            "Varun Nair", "Tanvi Kulkarni", "Devendra Singh", "Bhavna Patel", "Abhinav Reddy",
            "Shalini Malhotra", "Chetan Joshi", "Payal Agrawal", "Sandeep Kumar", "Priyanka Sen",
            "Mohit Verma", "Anushree Pillai", "Rishabh Choudhary", "Monica Bhatia", "Yash Deshmukh",
            "Shruti Iyer", "Pradeep Mishra", "Komal Yadav", "Arvind Rao", "Namrata Jain",
            "Sachin Bhasin", "Archana Mehta", "Sameer Pandey", "Ritu Sen", "Nikhil Dutta",
            "Sonam Bansal", "Hemant Saxena", "Vandana Arora", "Chirag Anand", "Surbhi Sharma",
            "Krunal Patel", "Niharika Roy", "Ashish Varma", "Preeti Gupta", "Tushar Nair",
            "Garima Kulkarni", "Deepak Singh", "Richa Malhotra", "Mayank Joshi", "Dipika Agrawal",
            "Saurabh Kumar", "Barkha Sen", "Rajiv Verma", "Rekha Pillai", "Lokesh Choudhary",
            "Seema Bhatia", "Umang Deshmukh", "Latika Iyer", "Kapil Mishra", "Pallavi Yadav",
            "Jayant Rao", "Anita Jain", "Sumit Bhasin", "Vandana Mehta", "Kapil Pandey",
            "Neeta Sen", "Paras Dutta", "Ishita Bansal", "Himanshu Saxena", "Reena Arora"
        ];

        const remarksList = [
            "Tea & Snacks", "Groceries", "UPI Transfer", "Lunch bill", "Borrowed cash",
            "Payment received", "Stationery", "Dinner share", "Fuel charges", "Rent contribution",
            "Mobile recharge", "Medicine purchase", "Coffee & Pastry", "Auto fare", "Shopping",
            "Salary credit", "Client invoice", "Hardware purchase", "Vendor payout", "Electricity bill"
        ];

        const amounts = [15, 30, 50, 75, 100, 150, 200, 250, 350, 450, 500, 1000, 2500, 5000];

        db.withTransactionSync(() => {
            const counterRow = db.getFirstSync("SELECT userId, transactionId FROM counters") as { userId: number; transactionId: number } | null;
            let currentUserId = counterRow?.userId ?? 0;
            let currentTxId = counterRow?.transactionId ?? 0;

            sampleNames.forEach((name, index) => {
                const existing = db.getFirstSync("SELECT userId FROM users WHERE name = ?", name);
                if (existing) return;

                currentUserId += 1;
                const uId = currentUserId;

                // Determine transaction count for user:
                // 15% users: 0 transactions (empty)
                // 15% users: Heavy volume (500 to 5,000 transactions!)
                // 20% users: Moderate volume (100 to 500 transactions)
                // 50% users: Standard volume (5 to 50 transactions)
                let txCount = 0;
                if (index % 8 === 0) {
                    txCount = 0; // Empty transactions
                } else if (index % 10 === 1 || index % 10 === 6) {
                    txCount = 500 + ((index * 373) % 4500); // Heavy: 500 to 5,000 transactions!
                } else if (index % 4 === 2) {
                    txCount = 100 + ((index * 41) % 400); // 100 to 500 transactions
                } else {
                    txCount = 5 + ((index * 13) % 45); // 5 to 50 transactions
                }

                let userBalance = 0;
                const baseDate = Date.now();

                for (let t = 0; t < txCount; t++) {
                    currentTxId += 1;
                    const amt = amounts[(index + t) % amounts.length];
                    const type = (t % 2 === 0) ? TransactionType.Debit : TransactionType.Credit;
                    const remark = remarksList[(index + t) % remarksList.length];

                    const txDate = new Date(baseDate - t * 3600000 * 3).toISOString();

                    if (type === TransactionType.Debit) {
                        userBalance -= amt;
                    } else {
                        userBalance += amt;
                    }

                    db.runSync(
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark) VALUES (?, ?, ?, ?, ?, ?)",
                        currentTxId, uId, amt, type, txDate, remark
                    );
                }

                db.runSync(
                    "INSERT INTO users (userId, name, balance, lastUpdated) VALUES (?, ?, ?, ?)",
                    uId, name, userBalance, new Date().toISOString()
                );
            });

            if (!counterRow) {
                db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", currentUserId, currentTxId);
            } else {
                db.runSync("UPDATE counters SET userId = ?, transactionId = ?", currentUserId, currentTxId);
            }
        });
    }

    public static getPreference(db: SQLite.SQLiteDatabase, key: string, defaultValue: string = ""): string {
        try {
            const row = db.getFirstSync("SELECT value FROM preferences WHERE key = ?", key) as { value: string } | null;
            return row?.value ?? defaultValue;
        } catch {
            return defaultValue;
        }
    }

    public static setPreference(db: SQLite.SQLiteDatabase, key: string, value: string): void {
        db.runSync("INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)", key, value);
    }

    public static getUsers(db: SQLite.SQLiteDatabase): IUser[] {
        return db.getAllSync(QueryService.list(Tables.User, "lastUpdated", "DESC"));
    }

    public static createUser(db: SQLite.SQLiteDatabase, userName: string): void {
        const row = db.getFirstSync("SELECT userId from counters") as { userId: number } | null;
        const counter = row?.userId ?? 0;
        db.runSync("INSERT INTO users (userId, name, balance, lastUpdated) VALUES (?, ?, ?, ?)", counter + 1, userName, 0, new Date().toISOString());
        if (!row) {
            db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", counter + 1, 0);
        } else {
            db.runSync("UPDATE counters SET userId = ?", counter + 1);
        }
    }

    public static updateUser(db: SQLite.SQLiteDatabase, userId: number, userName: string): void {
        db.runSync("UPDATE users SET name = ? WHERE userId = ?", userName, userId);
    }

    public static deleteUser(db: SQLite.SQLiteDatabase, userId: number): void {
        db.runSync("DELETE FROM users where userId = ?", userId);
        db.runSync("DELETE FROM transactions where userId = ?", userId);
    }

    public static getTransactions(db: SQLite.SQLiteDatabase, userId: number): ITransaction[] {
        DatabaseService.ensureIsSettledColumn(db);
        return db.getAllSync("SELECT * FROM transactions where userId = ?", userId);
    }

    public static createTransaction(db: SQLite.SQLiteDatabase, userId: number, amount: number, type: string, remark: string): void {
        DatabaseService.ensureIsSettledColumn(db);
        const row = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number } | null;
        const counter = row?.transactionId ?? 0;
        db.runSync(
            "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 0)",
            counter + 1,
            userId,
            amount,
            type,
            new Date().toISOString(),
            remark
        );
        let userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as { balance: number } | null;
        let balance = userRow?.balance ?? 0;
        if (type === TransactionType.Debit) {
            balance -= amount;
        } else {
            balance += amount;
        }
        db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), userId);
        if (!row) {
            db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, counter + 1);
        } else {
            db.runSync("UPDATE counters SET transactionId = ?", counter + 1);
        }
    }

    public static createBatchTransactions(
        db: SQLite.SQLiteDatabase,
        userIds: number[],
        amount: number,
        type: string,
        remark: string
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        if (!userIds || userIds.length === 0) return;

        db.withTransactionSync(() => {
            const row = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number } | null;
            let counter = row?.transactionId ?? 0;
            const nowIso = new Date().toISOString();

            for (const uId of userIds) {
                counter += 1;
                db.runSync(
                    "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 0)",
                    counter,
                    uId,
                    amount,
                    type,
                    nowIso,
                    remark
                );

                const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", uId) as { balance: number } | null;
                let balance = userRow?.balance ?? 0;
                if (type === TransactionType.Debit) {
                    balance -= amount;
                } else {
                    balance += amount;
                }
                db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, nowIso, uId);
            }

            if (!row) {
                db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, counter);
            } else {
                db.runSync("UPDATE counters SET transactionId = ?", counter);
            }
        });
    }

    public static deleteTransaction(db: SQLite.SQLiteDatabase, { transactionId, userId, type, amount }: ITransaction): void {
        DatabaseService.ensureIsSettledColumn(db);
        db.runSync("DELETE FROM transactions where transactionId = ?", transactionId);
        let userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as { balance: number } | null;
        if (userRow) {
            let balance = userRow.balance;
            if (type === TransactionType.Debit) {
                balance = balance + amount;
            } else {
                balance = balance - amount;
            }
            db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), userId);
        }
    }

    public static updateTransaction(
        db: SQLite.SQLiteDatabase,
        oldTransaction: ITransaction,
        newTransaction: { amount: number; type: string; remark: string }
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        let userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", oldTransaction.userId) as { balance: number } | null;
        if (userRow) {
            let balance = userRow.balance;
            if (oldTransaction.type === TransactionType.Debit) {
                balance += oldTransaction.amount;
            } else {
                balance -= oldTransaction.amount;
            }
            if (newTransaction.type === TransactionType.Debit) {
                balance -= newTransaction.amount;
            } else {
                balance += newTransaction.amount;
            }
            db.runSync(
                "UPDATE transactions SET amount = ?, type = ?, remark = ? WHERE transactionId = ?",
                newTransaction.amount,
                newTransaction.type,
                newTransaction.remark,
                oldTransaction.transactionId
            );
            db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), oldTransaction.userId);
        }
    }

    public static settleAccount(db: SQLite.SQLiteDatabase, userId: number): void {
        DatabaseService.ensureIsSettledColumn(db);
        db.withTransactionSync(() => {
            db.runSync(
                "UPDATE transactions SET isSettled = 1 WHERE userId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                userId
            );
            db.runSync(
                "UPDATE users SET balance = 0, lastUpdated = ? WHERE userId = ?",
                new Date().toISOString(),
                userId
            );
        });
    }

    public static settleMultipleAccounts(db: SQLite.SQLiteDatabase, userIds: number[]): void {
        if (!userIds || userIds.length === 0) return;
        DatabaseService.ensureIsSettledColumn(db);
        db.withTransactionSync(() => {
            const placeholders = userIds.map(() => "?").join(",");
            db.runSync(
                `UPDATE transactions SET isSettled = 1 WHERE userId IN (${placeholders}) AND (isSettled = 0 OR isSettled IS NULL)`,
                ...userIds
            );
            db.runSync(
                `UPDATE users SET balance = 0, lastUpdated = ? WHERE userId IN (${placeholders})`,
                new Date().toISOString(),
                ...userIds
            );
        });
    }

    public static exportAllData(db: SQLite.SQLiteDatabase) {
        DatabaseService.ensureIsSettledColumn(db);
        const users = db.getAllSync("SELECT * FROM users") as IUser[];
        const transactions = db.getAllSync("SELECT * FROM transactions") as ITransaction[];
        const counterRow = db.getFirstSync("SELECT * FROM counters") as { userId: number; transactionId: number } | null;
        let preferences: { key: string; value: string }[] = [];
        try {
            preferences = db.getAllSync("SELECT * FROM preferences") as { key: string; value: string }[];
        } catch {
            preferences = [];
        }

        return {
            appName: "FinanceKeeper",
            version: 1,
            exportedAt: new Date().toISOString(),
            users,
            transactions,
            counters: counterRow,
            preferences,
        };
    }

    public static restoreBackupData(
        db: SQLite.SQLiteDatabase,
        data: {
            users: IUser[];
            transactions: ITransaction[];
            counters?: { userId: number; transactionId: number } | null;
            preferences?: { key: string; value: string }[];
        }
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        db.withTransactionSync(() => {
            db.runSync("DELETE FROM transactions;");
            db.runSync("DELETE FROM users;");
            db.runSync("DELETE FROM counters;");
            try {
                db.runSync("DELETE FROM preferences;");
            } catch {
                // Table might not exist in old migrations, ensure standard creation
                db.execSync("CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
            }

            if (Array.isArray(data.users)) {
                for (const user of data.users) {
                    db.runSync(
                        "INSERT INTO users (userId, name, balance, lastUpdated) VALUES (?, ?, ?, ?)",
                        user.userId,
                        user.name,
                        user.balance ?? 0,
                        user.lastUpdated ?? new Date().toISOString()
                    );
                }
            }

            if (Array.isArray(data.transactions)) {
                for (const tx of data.transactions) {
                    db.runSync(
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        tx.transactionId,
                        tx.userId,
                        tx.amount,
                        tx.type,
                        tx.date ?? new Date().toISOString(),
                        tx.remark ?? "",
                        tx.isSettled ? 1 : 0
                    );
                }
            }

            if (data.counters) {
                db.runSync(
                    "INSERT INTO counters (userId, transactionId) VALUES (?, ?)",
                    data.counters.userId ?? 0,
                    data.counters.transactionId ?? 0
                );
            } else {
                // Recalculate counters if missing
                const maxUser = data.users?.reduce((max, u) => Math.max(max, u.userId), 0) ?? 0;
                const maxTx = data.transactions?.reduce((max, t) => Math.max(max, t.transactionId), 0) ?? 0;
                db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", maxUser, maxTx);
            }

            if (Array.isArray(data.preferences)) {
                for (const pref of data.preferences) {
                    if (pref.key && pref.value) {
                        db.runSync("INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)", pref.key, pref.value);
                    }
                }
            }
        });
    }
}
