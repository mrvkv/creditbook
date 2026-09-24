import { Tables } from "@/constants/table.constant";
import { TransactionType } from "@/enums/transaction.enum";
import { GroupCategory, IGroup, IGroupExpense, IGroupMember, IGroupMemberBalance, ISimplifiedDebt } from "@/types/group.interface";
import { ITransaction } from "@/types/transaction.interface";
import { IUser } from "@/types/user.interface";
import * as SQLite from "expo-sqlite";
import QueryService from "./query.service";

export default class DatabaseService {
    private static isSettledChecked = false;
    private static isSettledRepaired = false;
    private static isGroupTablesChecked = false;

    public static ensureIsSettledColumn(db: SQLite.SQLiteDatabase): void {
        if (DatabaseService.isSettledChecked) return;
        try {
            const tableInfo = db.getAllSync("PRAGMA table_info(transactions)") as { name: string }[];
            const exists = tableInfo.some((col) => col.name === "isSettled");
            if (!exists) {
                db.execSync("ALTER TABLE transactions ADD COLUMN isSettled INTEGER DEFAULT 0;");
            }
            DatabaseService.isSettledChecked = true;
            if (!DatabaseService.isSettledRepaired) {
                DatabaseService.isSettledRepaired = true;
                DatabaseService.repairUnbalancedSettledAccounts(db);
            }
        } catch (error) {
            console.warn("Migration warning for isSettled column:", error);
        }
    }

    public static repairUnbalancedSettledAccounts(db: SQLite.SQLiteDatabase): void {
        try {
            // Find users whose balance is 0 but whose transaction records do not sum to 0
            const settledUsers = db.getAllSync<IUser>("SELECT * FROM users WHERE balance = 0");
            if (!settledUsers || settledUsers.length === 0) return;

            db.withTransactionSync(() => {
                const counterRow = db.getFirstSync("SELECT transactionId FROM counters") as { transactionId: number } | null;
                let counter = counterRow?.transactionId ?? 0;
                let counterChanged = false;

                for (const u of settledUsers) {
                    const txs = db.getAllSync<ITransaction>("SELECT * FROM transactions WHERE userId = ?", u.userId);
                    if (!txs || txs.length === 0) continue;

                    let totalDebit = 0;
                    let totalCredit = 0;
                    for (const t of txs) {
                        if (t.type === TransactionType.Debit) {
                            totalDebit += t.amount;
                        } else {
                            totalCredit += t.amount;
                        }
                    }

                    const diff = totalDebit - totalCredit;
                    if (diff !== 0) {
                        counter += 1;
                        counterChanged = true;
                        // If diff > 0: Gave (Debit) was higher -> record Credit (Got) to balance
                        // If diff < 0: Got (Credit) was higher -> record Debit (Gave) to balance
                        const txType = diff > 0 ? TransactionType.Credit : TransactionType.Debit;
                        const settleAmount = Math.abs(diff);
                        const settleDate = u.lastUpdated || new Date().toISOString();
                        const txRemark = "Settled Up";

                        db.runSync(
                            "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 1)",
                            counter,
                            u.userId,
                            settleAmount,
                            txType,
                            settleDate,
                            txRemark
                        );
                        db.runSync(
                            "UPDATE transactions SET isSettled = 1 WHERE userId = ?",
                            u.userId
                        );
                    }
                }

                if (counterChanged) {
                    if (!counterRow) {
                        db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, counter);
                    } else {
                        db.runSync("UPDATE counters SET transactionId = ?", counter);
                    }
                }
            });
        } catch (err) {
            console.warn("repairUnbalancedSettledAccounts warning:", err);
        }
    }

    public static ensureGroupTables(db: SQLite.SQLiteDatabase): void {
        if (DatabaseService.isGroupTablesChecked) return;
        try {
            // 1. Groups table
            db.execSync(`
                CREATE TABLE IF NOT EXISTS groups (
                    groupId INTEGER PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    createdAt TEXT NOT NULL,
                    isArchived INTEGER DEFAULT 0
                );
            `);

            // 2. Group members table
            db.execSync(`
                CREATE TABLE IF NOT EXISTS group_members (
                    groupMemberId INTEGER PRIMARY KEY NOT NULL,
                    groupId INTEGER NOT NULL,
                    userId INTEGER NOT NULL
                );
            `);

            // 3. Group expenses table
            db.execSync(`
                CREATE TABLE IF NOT EXISTS group_expenses (
                    expenseId INTEGER PRIMARY KEY NOT NULL,
                    groupId INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    totalAmount INTEGER NOT NULL,
                    paidByUserId INTEGER NOT NULL,
                    splitType TEXT NOT NULL,
                    date TEXT NOT NULL,
                    isSettlement INTEGER DEFAULT 0
                );
            `);

            // 4. Group expense splits table
            db.execSync(`
                CREATE TABLE IF NOT EXISTS group_expense_splits (
                    splitId INTEGER PRIMARY KEY NOT NULL,
                    expenseId INTEGER NOT NULL,
                    userId INTEGER NOT NULL,
                    amount INTEGER NOT NULL
                );
            `);

            // 5. Ensure groupId and expenseId columns in transactions table
            const tableInfo = db.getAllSync("PRAGMA table_info(transactions)") as { name: string }[];
            const hasGroupId = tableInfo.some((col) => col.name === "groupId");
            if (!hasGroupId) {
                db.execSync("ALTER TABLE transactions ADD COLUMN groupId INTEGER DEFAULT NULL;");
            }
            const hasExpenseId = tableInfo.some((col) => col.name === "expenseId");
            if (!hasExpenseId) {
                db.execSync("ALTER TABLE transactions ADD COLUMN expenseId INTEGER DEFAULT NULL;");
            }

            DatabaseService.isGroupTablesChecked = true;
        } catch (error) {
            console.warn("Migration warning for group tables:", error);
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

        // Version 3 -> 4: Group & Splitwise tables
        if (currentDbVersion === 3) {
            DatabaseService.ensureGroupTables(db);
            currentDbVersion = 4;
            db.execSync(`PRAGMA user_version = 4`);
        }

        // Runtime fallback: ensure all tables and columns exist on any DB version
        DatabaseService.ensureIsSettledColumn(db);
        DatabaseService.ensureGroupTables(db);
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

    public static getUser(db: SQLite.SQLiteDatabase, userId: number): IUser | null {
        return db.getFirstSync<IUser>("SELECT * FROM users WHERE userId = ?", userId);
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
        DatabaseService.ensureGroupTables(db);
        return db.getAllSync<ITransaction>(
            "SELECT transactions.*, groups.name as groupName FROM transactions LEFT JOIN groups ON transactions.groupId = groups.groupId WHERE transactions.userId = ? ORDER BY transactions.date DESC, transactions.transactionId DESC",
            userId
        );
    }

    public static getAllTransactions(db: SQLite.SQLiteDatabase): ITransaction[] {
        DatabaseService.ensureIsSettledColumn(db);
        DatabaseService.ensureGroupTables(db);
        return db.getAllSync<ITransaction>(
            "SELECT transactions.*, users.name as userName, groups.name as groupName FROM transactions JOIN users ON transactions.userId = users.userId LEFT JOIN groups ON transactions.groupId = groups.groupId ORDER BY transactions.date DESC, transactions.transactionId DESC"
        );
    }

    public static createTransaction(db: SQLite.SQLiteDatabase, userId: number, amount: number, type: string, remark: string, date?: string): void {
        DatabaseService.ensureIsSettledColumn(db);
        const row = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number } | null;
        const counter = row?.transactionId ?? 0;
        const txDate = date || new Date().toISOString();
        db.runSync(
            "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 0)",
            counter + 1,
            userId,
            amount,
            type,
            txDate,
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
        remark: string,
        date?: string
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        if (!userIds || userIds.length === 0) return;

        db.withTransactionSync(() => {
            const row = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number } | null;
            let counter = row?.transactionId ?? 0;
            const txDate = date || new Date().toISOString();

            for (const uId of userIds) {
                counter += 1;
                db.runSync(
                    "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 0)",
                    counter,
                    uId,
                    amount,
                    type,
                    txDate,
                    remark
                );

                const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", uId) as { balance: number } | null;
                let balance = userRow?.balance ?? 0;
                if (type === TransactionType.Debit) {
                    balance -= amount;
                } else {
                    balance += amount;
                }
                db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), uId);
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
        newTransaction: { amount: number; type: string; remark: string; date?: string }
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
            const txDate = newTransaction.date || oldTransaction.date || new Date().toISOString();
            db.runSync(
                "UPDATE transactions SET amount = ?, type = ?, remark = ?, date = ? WHERE transactionId = ?",
                newTransaction.amount,
                newTransaction.type,
                newTransaction.remark,
                txDate,
                oldTransaction.transactionId
            );
            db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), oldTransaction.userId);
        }
    }

    public static settleAccount(
        db: SQLite.SQLiteDatabase,
        userId: number,
        options?: {
            amount?: number;
            remark?: string;
            date?: string;
        }
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        db.withTransactionSync(() => {
            const userRow = db.getFirstSync<IUser>("SELECT * FROM users WHERE userId = ?", userId);
            if (!userRow) return;

            const currentBalance = userRow.balance ?? 0;
            const settleDate = options?.date || new Date().toISOString();

            if (currentBalance !== 0) {
                const settleAmount = options?.amount !== undefined && options.amount > 0 ? options.amount : Math.abs(currentBalance);
                // When balance < 0 (Receivable): user owes You -> user pays You -> Credit (Got)
                // When balance > 0 (Payable): you owe user -> You pay user -> Debit (Gave)
                const txType = currentBalance < 0 ? TransactionType.Credit : TransactionType.Debit;
                const defaultRemark = currentBalance < 0
                    ? `Settled Up: Received from ${userRow.name}`
                    : `Settled Up: Paid to ${userRow.name}`;
                const txRemark = options?.remark?.trim() ? options.remark.trim() : defaultRemark;

                const counterRow = db.getFirstSync("SELECT transactionId FROM counters") as { transactionId: number } | null;
                const counter = counterRow?.transactionId ?? 0;
                const newTxId = counter + 1;

                db.runSync(
                    "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 1)",
                    newTxId,
                    userId,
                    settleAmount,
                    txType,
                    settleDate,
                    txRemark
                );

                if (!counterRow) {
                    db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, newTxId);
                } else {
                    db.runSync("UPDATE counters SET transactionId = ?", newTxId);
                }
            }

            db.runSync(
                "UPDATE transactions SET isSettled = 1 WHERE userId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                userId
            );
            db.runSync(
                "UPDATE users SET balance = 0, lastUpdated = ? WHERE userId = ?",
                settleDate,
                userId
            );
        });
    }

    public static settleMultipleAccounts(db: SQLite.SQLiteDatabase, userIds: number[]): void {
        if (!userIds || userIds.length === 0) return;
        DatabaseService.ensureIsSettledColumn(db);
        db.withTransactionSync(() => {
            const counterRow = db.getFirstSync("SELECT transactionId FROM counters") as { transactionId: number } | null;
            let counter = counterRow?.transactionId ?? 0;
            let counterChanged = false;
            const settleDate = new Date().toISOString();

            for (const uId of userIds) {
                const userRow = db.getFirstSync<IUser>("SELECT * FROM users WHERE userId = ?", uId);
                if (!userRow) continue;

                const currentBal = userRow.balance ?? 0;
                if (currentBal !== 0) {
                    const settleAmount = Math.abs(currentBal);
                    const txType = currentBal < 0 ? TransactionType.Credit : TransactionType.Debit;
                    const txRemark = currentBal < 0
                        ? `Settled Up: Received from ${userRow.name}`
                        : `Settled Up: Paid to ${userRow.name}`;

                    counter += 1;
                    counterChanged = true;
                    db.runSync(
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled) VALUES (?, ?, ?, ?, ?, ?, 1)",
                        counter,
                        uId,
                        settleAmount,
                        txType,
                        settleDate,
                        txRemark
                    );
                }

                db.runSync(
                    "UPDATE transactions SET isSettled = 1 WHERE userId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                    uId
                );
                db.runSync(
                    "UPDATE users SET balance = 0, lastUpdated = ? WHERE userId = ?",
                    settleDate,
                    uId
                );
            }

            if (counterChanged) {
                if (!counterRow) {
                    db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, counter);
                } else {
                    db.runSync("UPDATE counters SET transactionId = ?", counter);
                }
            }
        });
    }

    public static exportAllData(db: SQLite.SQLiteDatabase) {
        DatabaseService.ensureIsSettledColumn(db);
        DatabaseService.ensureGroupTables(db);
        const users = db.getAllSync("SELECT * FROM users") as IUser[];
        const transactions = db.getAllSync("SELECT * FROM transactions") as ITransaction[];
        const counterRow = db.getFirstSync("SELECT * FROM counters") as { userId: number; transactionId: number } | null;
        let preferences: { key: string; value: string }[] = [];
        try {
            preferences = db.getAllSync("SELECT * FROM preferences") as { key: string; value: string }[];
        } catch {
            preferences = [];
        }

        let groups: any[] = [];
        let groupMembers: any[] = [];
        let groupExpenses: any[] = [];
        let groupExpenseSplits: any[] = [];
        try {
            groups = db.getAllSync("SELECT * FROM groups");
            groupMembers = db.getAllSync("SELECT * FROM group_members");
            groupExpenses = db.getAllSync("SELECT * FROM group_expenses");
            groupExpenseSplits = db.getAllSync("SELECT * FROM group_expense_splits");
        } catch {}

        return {
            appName: "FinanceKeeper",
            version: 2,
            exportedAt: new Date().toISOString(),
            users,
            transactions,
            counters: counterRow,
            preferences,
            groups,
            groupMembers,
            groupExpenses,
            groupExpenseSplits,
        };
    }

    public static restoreBackupData(
        db: SQLite.SQLiteDatabase,
        data: {
            users: IUser[];
            transactions: ITransaction[];
            counters?: { userId: number; transactionId: number } | null;
            preferences?: { key: string; value: string }[];
            groups?: any[];
            groupMembers?: any[];
            groupExpenses?: any[];
            groupExpenseSplits?: any[];
        }
    ): void {
        DatabaseService.ensureIsSettledColumn(db);
        DatabaseService.ensureGroupTables(db);
        db.withTransactionSync(() => {
            db.runSync("DELETE FROM transactions;");
            db.runSync("DELETE FROM users;");
            db.runSync("DELETE FROM counters;");
            try {
                db.runSync("DELETE FROM preferences;");
            } catch {
                db.execSync("CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
            }
            try {
                db.runSync("DELETE FROM group_expense_splits;");
                db.runSync("DELETE FROM group_expenses;");
                db.runSync("DELETE FROM group_members;");
                db.runSync("DELETE FROM groups;");
            } catch {}

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
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled, groupId, expenseId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        tx.transactionId,
                        tx.userId,
                        tx.amount,
                        tx.type,
                        tx.date ?? new Date().toISOString(),
                        tx.remark ?? "",
                        tx.isSettled ? 1 : 0,
                        tx.groupId ?? null,
                        tx.expenseId ?? null
                    );
                }
            }

            if (Array.isArray(data.groups)) {
                for (const g of data.groups) {
                    db.runSync(
                        "INSERT INTO groups (groupId, name, category, createdAt, isArchived) VALUES (?, ?, ?, ?, ?)",
                        g.groupId,
                        g.name,
                        g.category ?? "general",
                        g.createdAt ?? new Date().toISOString(),
                        g.isArchived ?? 0
                    );
                }
            }

            if (Array.isArray(data.groupMembers)) {
                for (const gm of data.groupMembers) {
                    db.runSync(
                        "INSERT INTO group_members (groupMemberId, groupId, userId) VALUES (?, ?, ?)",
                        gm.groupMemberId,
                        gm.groupId,
                        gm.userId
                    );
                }
            }

            if (Array.isArray(data.groupExpenses)) {
                for (const ge of data.groupExpenses) {
                    db.runSync(
                        "INSERT INTO group_expenses (expenseId, groupId, description, totalAmount, paidByUserId, splitType, date, isSettlement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        ge.expenseId,
                        ge.groupId,
                        ge.description,
                        ge.totalAmount,
                        ge.paidByUserId,
                        ge.splitType,
                        ge.date ?? new Date().toISOString(),
                        ge.isSettlement ?? 0
                    );
                }
            }

            if (Array.isArray(data.groupExpenseSplits)) {
                for (const ges of data.groupExpenseSplits) {
                    db.runSync(
                        "INSERT INTO group_expense_splits (splitId, expenseId, userId, amount) VALUES (?, ?, ?, ?)",
                        ges.splitId,
                        ges.expenseId,
                        ges.userId,
                        ges.amount
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

    // ═══════════════════════════════════════════════════════════════════════
    // GROUPS & SPLIT EXPENSES (Splitwise Features)
    // ═══════════════════════════════════════════════════════════════════════

    public static getGroups(db: SQLite.SQLiteDatabase): IGroup[] {
        DatabaseService.ensureGroupTables(db);
        const groups = db.getAllSync<IGroup>(
            "SELECT * FROM groups WHERE isArchived = 0 ORDER BY groupId DESC"
        );

        return groups.map((g) => {
            const memberCountRow = db.getFirstSync(
                "SELECT COUNT(*) as count FROM group_members WHERE groupId = ?",
                g.groupId
            ) as { count: number } | null;

            const spendRow = db.getFirstSync(
                "SELECT COALESCE(SUM(totalAmount), 0) as total FROM group_expenses WHERE groupId = ? AND isSettlement = 0",
                g.groupId
            ) as { total: number } | null;

            const balances = DatabaseService.calculateGroupBalances(db, g.groupId);
            const userBalance = balances.members.find((m) => m.userId === 0)?.netBalance ?? 0;

            return {
                ...g,
                memberCount: memberCountRow?.count ?? 0,
                totalSpend: spendRow?.total ?? 0,
                userNetBalance: userBalance,
            };
        });
    }

    public static getGroup(db: SQLite.SQLiteDatabase, groupId: number): IGroup | null {
        DatabaseService.ensureGroupTables(db);
        const group = db.getFirstSync<IGroup>(
            "SELECT * FROM groups WHERE groupId = ?",
            groupId
        );
        if (!group) return null;

        const spendRow = db.getFirstSync(
            "SELECT COALESCE(SUM(totalAmount), 0) as total FROM group_expenses WHERE groupId = ? AND isSettlement = 0",
            groupId
        ) as { total: number } | null;

        const memberCountRow = db.getFirstSync(
            "SELECT COUNT(*) as count FROM group_members WHERE groupId = ?",
            groupId
        ) as { count: number } | null;

        const balances = DatabaseService.calculateGroupBalances(db, groupId);
        const userBalance = balances.members.find((m) => m.userId === 0)?.netBalance ?? 0;

        return {
            ...group,
            memberCount: memberCountRow?.count ?? 0,
            totalSpend: spendRow?.total ?? 0,
            userNetBalance: userBalance,
        };
    }

    public static createGroup(
        db: SQLite.SQLiteDatabase,
        name: string,
        category: GroupCategory = "trip",
        memberUserIds: number[] = []
    ): number {
        DatabaseService.ensureGroupTables(db);
        let createdGroupId = 0;

        db.withTransactionSync(() => {
            const nextGroupRow = db.getFirstSync(
                "SELECT COALESCE(MAX(groupId), 0) + 1 as nextId FROM groups"
            ) as { nextId: number };
            createdGroupId = nextGroupRow.nextId;

            db.runSync(
                "INSERT INTO groups (groupId, name, category, createdAt, isArchived) VALUES (?, ?, ?, ?, 0)",
                createdGroupId,
                name.trim(),
                category,
                new Date().toISOString()
            );

            // Always add "You" (userId: 0) as the first group member
            const nextMemberRow = db.getFirstSync(
                "SELECT COALESCE(MAX(groupMemberId), 0) + 1 as nextId FROM group_members"
            ) as { nextId: number };
            let memberId = nextMemberRow.nextId;

            db.runSync(
                "INSERT INTO group_members (groupMemberId, groupId, userId) VALUES (?, ?, 0)",
                memberId++,
                createdGroupId
            );

            // Add other selected members
            const uniqueMemberIds = Array.from(new Set(memberUserIds)).filter((id) => id > 0);
            for (const uId of uniqueMemberIds) {
                db.runSync(
                    "INSERT INTO group_members (groupMemberId, groupId, userId) VALUES (?, ?, ?)",
                    memberId++,
                    createdGroupId,
                    uId
                );
            }
        });

        return createdGroupId;
    }

    public static updateGroup(
        db: SQLite.SQLiteDatabase,
        groupId: number,
        name: string,
        category: GroupCategory
    ): void {
        DatabaseService.ensureGroupTables(db);
        db.runSync(
            "UPDATE groups SET name = ?, category = ? WHERE groupId = ?",
            name.trim(),
            category,
            groupId
        );
    }

    public static deleteGroup(db: SQLite.SQLiteDatabase, groupId: number): void {
        DatabaseService.ensureGroupTables(db);
        db.withTransactionSync(() => {
            // 1. Revert user balances ONLY for ACTIVE (unsettled) transactions linked to this group
            const activeLinkedTxs = db.getAllSync<{ userId: number; amount: number; type: string }>(
                "SELECT userId, amount, type FROM transactions WHERE groupId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                groupId
            );

            for (const tx of activeLinkedTxs) {
                const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", tx.userId) as { balance: number } | null;
                if (userRow) {
                    let newBalance = userRow.balance;
                    if (tx.type === TransactionType.Debit) {
                        newBalance += tx.amount; // Revert debit
                    } else {
                        newBalance -= tx.amount; // Revert credit
                    }
                    db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBalance, new Date().toISOString(), tx.userId);
                }
            }

            // 2. Preserve already SETTLED transactions in member ledgers (unlink from group)
            db.runSync(
                "UPDATE transactions SET groupId = NULL, expenseId = NULL WHERE groupId = ? AND isSettled = 1",
                groupId
            );

            // 3. Delete only the UNSETTLED linked transactions
            db.runSync(
                "DELETE FROM transactions WHERE groupId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                groupId
            );

            // 4. Delete group expense splits
            const expenseIds = db.getAllSync<{ expenseId: number }>(
                "SELECT expenseId FROM group_expenses WHERE groupId = ?",
                groupId
            );
            for (const exp of expenseIds) {
                db.runSync("DELETE FROM group_expense_splits WHERE expenseId = ?", exp.expenseId);
            }

            // 5. Delete group expenses, members, and group
            db.runSync("DELETE FROM group_expenses WHERE groupId = ?", groupId);
            db.runSync("DELETE FROM group_members WHERE groupId = ?", groupId);
            db.runSync("DELETE FROM groups WHERE groupId = ?", groupId);
        });
    }

    public static getGroupMembers(db: SQLite.SQLiteDatabase, groupId: number): IGroupMember[] {
        DatabaseService.ensureGroupTables(db);
        const rows = db.getAllSync<{ groupMemberId: number; groupId: number; userId: number; userName: string | null }>(
            `SELECT gm.groupMemberId, gm.groupId, gm.userId, 
                    CASE WHEN gm.userId = 0 THEN 'You' ELSE u.name END as userName
             FROM group_members gm
             LEFT JOIN users u ON gm.userId = u.userId
             WHERE gm.groupId = ?
             ORDER BY gm.userId ASC`,
            groupId
        );
        return rows.map((r) => ({
            groupMemberId: r.groupMemberId,
            groupId: r.groupId,
            userId: r.userId,
            userName: r.userName || (r.userId === 0 ? "You" : `User #${r.userId}`),
        }));
    }

    public static addMemberToGroup(db: SQLite.SQLiteDatabase, groupId: number, userId: number): void {
        DatabaseService.ensureGroupTables(db);
        const existing = db.getFirstSync(
            "SELECT groupMemberId FROM group_members WHERE groupId = ? AND userId = ?",
            groupId,
            userId
        );
        if (existing) return;

        const nextRow = db.getFirstSync(
            "SELECT COALESCE(MAX(groupMemberId), 0) + 1 as nextId FROM group_members"
        ) as { nextId: number };

        db.runSync(
            "INSERT INTO group_members (groupMemberId, groupId, userId) VALUES (?, ?, ?)",
            nextRow.nextId,
            groupId,
            userId
        );
    }

    public static removeMemberFromGroup(db: SQLite.SQLiteDatabase, groupId: number, userId: number): void {
        DatabaseService.ensureGroupTables(db);
        if (userId === 0) return; // Cannot remove "You"
        db.runSync("DELETE FROM group_members WHERE groupId = ? AND userId = ?", groupId, userId);
    }

    public static getGroupExpenses(db: SQLite.SQLiteDatabase, groupId: number): IGroupExpense[] {
        DatabaseService.ensureGroupTables(db);
        const expenses = db.getAllSync<{
            expenseId: number;
            groupId: number;
            description: string;
            totalAmount: number;
            paidByUserId: number;
            splitType: "equal" | "exact";
            date: string;
            isSettlement: number;
            paidByName: string | null;
        }>(
            `SELECT ge.*, 
                    CASE WHEN ge.paidByUserId = 0 THEN 'You' ELSE u.name END as paidByName
             FROM group_expenses ge
             LEFT JOIN users u ON ge.paidByUserId = u.userId
             WHERE ge.groupId = ?
             ORDER BY ge.date DESC, ge.expenseId DESC`,
            groupId
        );

        return expenses.map((e) => {
            const splits = db.getAllSync<{ userId: number; amount: number }>(
                "SELECT userId, amount FROM group_expense_splits WHERE expenseId = ?",
                e.expenseId
            );
            return {
                ...e,
                paidByName: e.paidByName || (e.paidByUserId === 0 ? "You" : `User #${e.paidByUserId}`),
                splits,
            };
        });
    }

    public static createGroupExpense(
        db: SQLite.SQLiteDatabase,
        params: {
            groupId: number;
            description: string;
            totalAmount: number;
            paidByUserId: number;
            splitType: "equal" | "exact";
            date?: string;
            splits: { userId: number; amount: number }[];
            isSettlement?: boolean;
        }
    ): number {
        DatabaseService.ensureGroupTables(db);
        DatabaseService.ensureIsSettledColumn(db);
        let createdExpenseId = 0;

        db.withTransactionSync(() => {
            const nextExpRow = db.getFirstSync(
                "SELECT COALESCE(MAX(expenseId), 0) + 1 as nextId FROM group_expenses"
            ) as { nextId: number };
            createdExpenseId = nextExpRow.nextId;
            const expDate = params.date || new Date().toISOString();

            db.runSync(
                `INSERT INTO group_expenses (expenseId, groupId, description, totalAmount, paidByUserId, splitType, date, isSettlement)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                createdExpenseId,
                params.groupId,
                params.description.trim(),
                params.totalAmount,
                params.paidByUserId,
                params.splitType,
                expDate,
                params.isSettlement ? 1 : 0
            );

            // Insert splits
            let nextSplitRow = db.getFirstSync(
                "SELECT COALESCE(MAX(splitId), 0) + 1 as nextId FROM group_expense_splits"
            ) as { nextId: number };
            let currentSplitId = nextSplitRow.nextId;

            for (const s of params.splits) {
                db.runSync(
                    "INSERT INTO group_expense_splits (splitId, expenseId, userId, amount) VALUES (?, ?, ?, ?)",
                    currentSplitId++,
                    createdExpenseId,
                    s.userId,
                    s.amount
                );
            }

            // Sync with Individual Accounts / Ledger!
            const groupRow = db.getFirstSync("SELECT name FROM groups WHERE groupId = ?", params.groupId) as { name: string } | null;
            const groupName = groupRow?.name || "Group";

            const txCounterRow = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number } | null;
            let currentTxId = txCounterRow?.transactionId ?? 0;

            if (params.isSettlement) {
                // If this is a direct debt settlement:
                const payee = params.splits[0];
                if (params.paidByUserId === 0 && payee && payee.userId > 0) {
                    currentTxId++;
                    db.runSync(
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled, groupId, expenseId) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                        currentTxId,
                        payee.userId,
                        params.totalAmount,
                        TransactionType.Debit,
                        expDate,
                        `Settlement: ${params.description} (${groupName})`,
                        params.groupId,
                        createdExpenseId
                    );
                    const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", payee.userId) as { balance: number } | null;
                    const newBal = (userRow?.balance ?? 0) - params.totalAmount;
                    db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBal, expDate, payee.userId);
                } else if (params.paidByUserId > 0 && payee && payee.userId === 0) {
                    currentTxId++;
                    db.runSync(
                        "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled, groupId, expenseId) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                        currentTxId,
                        params.paidByUserId,
                        params.totalAmount,
                        TransactionType.Credit,
                        expDate,
                        `Settlement: ${params.description} (${groupName})`,
                        params.groupId,
                        createdExpenseId
                    );
                    const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", params.paidByUserId) as { balance: number } | null;
                    const newBal = (userRow?.balance ?? 0) + params.totalAmount;
                    db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBal, expDate, params.paidByUserId);
                }
            } else {
                // Standard Expense:
                if (params.paidByUserId === 0) {
                    // You paid for the group!
                    for (const s of params.splits) {
                        if (s.userId > 0 && s.amount > 0) {
                            currentTxId++;
                            db.runSync(
                                "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled, groupId, expenseId) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                                currentTxId,
                                s.userId,
                                s.amount,
                                TransactionType.Debit,
                                expDate,
                                `${params.description} (${groupName})`,
                                params.groupId,
                                createdExpenseId
                            );
                            const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", s.userId) as { balance: number } | null;
                            const newBal = (userRow?.balance ?? 0) - s.amount;
                            db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBal, expDate, s.userId);
                        }
                    }
                } else {
                    // Another member P paid!
                    const yourSplit = params.splits.find((s) => s.userId === 0);
                    if (yourSplit && yourSplit.amount > 0) {
                        currentTxId++;
                        db.runSync(
                            "INSERT INTO transactions (transactionId, userId, amount, type, date, remark, isSettled, groupId, expenseId) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                            currentTxId,
                            params.paidByUserId,
                            yourSplit.amount,
                            TransactionType.Credit,
                            expDate,
                            `${params.description} (${groupName})`,
                            params.groupId,
                            createdExpenseId
                        );
                        const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", params.paidByUserId) as { balance: number } | null;
                        const newBal = (userRow?.balance ?? 0) + yourSplit.amount;
                        db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBal, expDate, params.paidByUserId);
                    }
                }
            }

            // Update transactionId counter
            if (!txCounterRow) {
                db.runSync("INSERT INTO counters (userId, transactionId) VALUES (?, ?)", 0, currentTxId);
            } else {
                db.runSync("UPDATE counters SET transactionId = ?", currentTxId);
            }
        });

        return createdExpenseId;
    }

    public static deleteGroupExpense(db: SQLite.SQLiteDatabase, expenseId: number): void {
        DatabaseService.ensureGroupTables(db);
        db.withTransactionSync(() => {
            // 1. Revert ledger balances ONLY for ACTIVE (unsettled) transactions linked to this expense
            const activeLinkedTxs = db.getAllSync<{ userId: number; amount: number; type: string }>(
                "SELECT userId, amount, type FROM transactions WHERE expenseId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                expenseId
            );

            for (const tx of activeLinkedTxs) {
                const userRow = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", tx.userId) as { balance: number } | null;
                if (userRow) {
                    let newBalance = userRow.balance;
                    if (tx.type === TransactionType.Debit) {
                        newBalance += tx.amount;
                    } else {
                        newBalance -= tx.amount;
                    }
                    db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", newBalance, new Date().toISOString(), tx.userId);
                }
            }

            // 2. Preserve already SETTLED transactions in member ledgers (unlink from expense)
            db.runSync(
                "UPDATE transactions SET groupId = NULL, expenseId = NULL WHERE expenseId = ? AND isSettled = 1",
                expenseId
            );

            // 3. Delete only UNSETTLED linked transactions
            db.runSync(
                "DELETE FROM transactions WHERE expenseId = ? AND (isSettled = 0 OR isSettled IS NULL)",
                expenseId
            );

            // 4. Delete splits & expense
            db.runSync("DELETE FROM group_expense_splits WHERE expenseId = ?", expenseId);
            db.runSync("DELETE FROM group_expenses WHERE expenseId = ?", expenseId);
        });
    }

    public static calculateGroupBalances(
        db: SQLite.SQLiteDatabase,
        groupId: number
    ): {
        members: IGroupMemberBalance[];
        simplifiedDebts: ISimplifiedDebt[];
        totalSpend: number;
    } {
        DatabaseService.ensureGroupTables(db);

        const members = DatabaseService.getGroupMembers(db, groupId);
        const memberMap: { [userId: number]: IGroupMemberBalance } = {};

        for (const m of members) {
            memberMap[m.userId] = {
                userId: m.userId,
                userName: m.userName || (m.userId === 0 ? "You" : `User #${m.userId}`),
                netBalance: 0,
                totalPaid: 0,
                totalShare: 0,
            };
        }

        const expenses = db.getAllSync<{
            expenseId: number;
            totalAmount: number;
            paidByUserId: number;
            isSettlement: number;
        }>(
            "SELECT expenseId, totalAmount, paidByUserId, isSettlement FROM group_expenses WHERE groupId = ?",
            groupId
        );

        let totalSpend = 0;

        for (const exp of expenses) {
            const splits = db.getAllSync<{ userId: number; amount: number }>(
                "SELECT userId, amount FROM group_expense_splits WHERE expenseId = ?",
                exp.expenseId
            );

            if (exp.isSettlement === 1) {
                // Direct settlement between payer and payee
                const payee = splits[0];
                if (memberMap[exp.paidByUserId]) {
                    memberMap[exp.paidByUserId].netBalance += exp.totalAmount;
                }
                if (payee && memberMap[payee.userId]) {
                    memberMap[payee.userId].netBalance -= exp.totalAmount;
                }
            } else {
                totalSpend += exp.totalAmount;

                if (memberMap[exp.paidByUserId]) {
                    memberMap[exp.paidByUserId].totalPaid += exp.totalAmount;
                    memberMap[exp.paidByUserId].netBalance += exp.totalAmount;
                }

                for (const s of splits) {
                    if (memberMap[s.userId]) {
                        memberMap[s.userId].totalShare += s.amount;
                        memberMap[s.userId].netBalance -= s.amount;
                    }
                }
            }
        }

        const memberBalances = Object.values(memberMap);

        // Debt Simplification Algorithm (Greedy Minimum Cash Flow)
        const debtors: { userId: number; userName: string; amount: number }[] = [];
        const creditors: { userId: number; userName: string; amount: number }[] = [];

        for (const mb of memberBalances) {
            if (mb.netBalance < -0.01) {
                debtors.push({ userId: mb.userId, userName: mb.userName, amount: Math.abs(mb.netBalance) });
            } else if (mb.netBalance > 0.01) {
                creditors.push({ userId: mb.userId, userName: mb.userName, amount: mb.netBalance });
            }
        }

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const simplifiedDebts: ISimplifiedDebt[] = [];
        let dIdx = 0;
        let cIdx = 0;

        while (dIdx < debtors.length && cIdx < creditors.length) {
            const debtor = debtors[dIdx];
            const creditor = creditors[cIdx];
            const settleAmount = Math.min(debtor.amount, creditor.amount);

            if (settleAmount > 0) {
                simplifiedDebts.push({
                    fromUserId: debtor.userId,
                    fromUserName: debtor.userName,
                    toUserId: creditor.userId,
                    toUserName: creditor.userName,
                    amount: Math.round(settleAmount),
                });
            }

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount < 0.01) dIdx++;
            if (creditor.amount < 0.01) cIdx++;
        }

        return {
            members: memberBalances,
            simplifiedDebts,
            totalSpend,
        };
    }
}
