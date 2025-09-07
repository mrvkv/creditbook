import { Tables } from "@/constants/table.constant";
import { IUser } from "@/types/user.interface";
import * as SQLite from "expo-sqlite";
import QueryService from "./query.service";

export default class DatabaseService {
    public static async migrate(db: SQLite.SQLiteDatabase): Promise<void> {
        let isChanged = false;
        let { user_version: currentDbVersion } = db.getFirstSync("PRAGMA user_version") as { user_version: number };

        if (currentDbVersion === 0) {
            db.execSync(QueryService.init());
            db.execSync(QueryService.setDefaults());
            currentDbVersion = 1;
            isChanged = true;
        }

        isChanged && db.execSync(`PRAGMA user_version = ${currentDbVersion}`);
    }

    public static getUsers(db: SQLite.SQLiteDatabase): IUser[] {
        return db.getAllSync(QueryService.list(Tables.User));
    }

    public static createUser(db: SQLite.SQLiteDatabase, userName: string): void {
        const { userId: counter } = db.getFirstSync("SELECT userId from counters") as { userId: number };
        db.runSync("INSERT INTO users (userId, name, balance) VALUES (?, ?, ?)", counter + 1, userName, 0);
        db.runSync("UPDATE counters SET userId = ?", counter + 1);
    }

    public static updateUser(db: SQLite.SQLiteDatabase, userId: number, userName: string): void {
        db.runSync("UPDATE users SET name = ? WHERE userId = ?", userName, userId);
    }

    public static deleteUser(db: SQLite.SQLiteDatabase, userId: number): void {
        db.runSync("DELETE FROM users where userId = ?", userId);
        db.runSync("DELETE FROM transactions where userId = ?", userId);
    }

    // public static getTransactions(userId: number): ITransaction[] {
    //     return this.db.getAllSync("SELECT * FROM transactions where userId = ?", userId);
    // }

    // public static createTransaction(userId: number, amount: number, type: string): void {
    //     this.db.runSync("INSERT INTO transactions (userId, amount, type) VALUES (?, ?, ?)", userId, amount, type);
    //     let { balance } = this.db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as IUser;
    //     console.log(balance);
    //     if (type === "Debit") {
    //         balance -= amount;
    //     } else {
    //         balance += amount;
    //     }
    //     console.log("After", balance);
    //     this.db.runSync("UPDATE users SET balance = ? WHERE userId = ?", balance, userId);
    // }
}
