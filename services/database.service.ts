import { Tables } from "@/constants/table.constant";
import { TransactionType } from "@/enums/transaction.enum";
import { ITransaction } from "@/types/transaction.interface";
import { IUser } from "@/types/user.interface";
import * as SQLite from "expo-sqlite";
import QueryService from "./query.service";

export default class DatabaseService {
    public static async migrate(db: SQLite.SQLiteDatabase): Promise<void> {
        let isChanged = false;
        let freshInstall = false;
        let { user_version: currentDbVersion } = db.getFirstSync("PRAGMA user_version") as { user_version: number };

        if (currentDbVersion === 0) {
            freshInstall = true;
            db.execSync(QueryService.init());
            db.execSync(QueryService.setDefaults());
            currentDbVersion = 1;
            isChanged = true;
        }

        if (currentDbVersion === 1) {
            if (!freshInstall) {
                db.execSync("ALTER TABLE users ADD COLUMN lastUpdated TEXT DEFAULT ''");
            }
            currentDbVersion = 2;
            isChanged = true;
        }

        isChanged && db.execSync(`PRAGMA user_version = ${currentDbVersion}`);
    }

    public static getUsers(db: SQLite.SQLiteDatabase): IUser[] {
        return db.getAllSync(QueryService.list(Tables.User, "lastUpdated", "DESC"));
    }

    public static createUser(db: SQLite.SQLiteDatabase, userName: string): void {
        const { userId: counter } = db.getFirstSync("SELECT userId from counters") as { userId: number };
        db.runSync("INSERT INTO users (userId, name, balance, lastUpdated) VALUES (?, ?, ?, ?)", counter + 1, userName, 0, "");
        db.runSync("UPDATE counters SET userId = ?", counter + 1);
    }

    public static updateUser(db: SQLite.SQLiteDatabase, userId: number, userName: string): void {
        db.runSync("UPDATE users SET name = ? WHERE userId = ?", userName, userId);
    }

    public static deleteUser(db: SQLite.SQLiteDatabase, userId: number): void {
        db.runSync("DELETE FROM users where userId = ?", userId);
        db.runSync("DELETE FROM transactions where userId = ?", userId);
    }

    public static getTransactions(db: SQLite.SQLiteDatabase, userId: number): ITransaction[] {
        return db.getAllSync("SELECT * FROM transactions where userId = ?", userId);
    }

    public static createTransaction(db: SQLite.SQLiteDatabase, userId: number, amount: number, type: string, remark: string): void {
        const { transactionId: counter } = db.getFirstSync("SELECT transactionId from counters") as { transactionId: number };
        db.runSync(
            "INSERT INTO transactions (transactionId, userId, amount, type, date, remark) VALUES (?, ?, ?, ?, ?, ?)",
            counter,
            userId,
            amount,
            type,
            new Date().toISOString(),
            remark
        );
        let { balance } = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as IUser;
        if (type === TransactionType.Debit) {
            balance -= amount;
        } else {
            balance += amount;
        }
        db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), userId);
        db.runSync("UPDATE counters SET transactionId = ?", counter + 1);
    }

    public static deleteTransaction(db: SQLite.SQLiteDatabase, { transactionId, userId, type, amount }: ITransaction): void {
        db.runSync("DELETE FROM transactions where transactionId = ?", transactionId);
        let { balance } = db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as IUser;
        if (type === TransactionType.Debit) {
            balance = balance + amount;
        } else {
            balance = balance - amount;
        }
        db.runSync("UPDATE users SET balance = ?, lastUpdated = ? WHERE userId = ?", balance, new Date().toISOString(), userId);
    }
}
