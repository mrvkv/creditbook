import { ITransaction, IUser } from "@/app";
import * as SQLite from "expo-sqlite";

export default class DatabaseService {
    private static db: SQLite.SQLiteDatabase;

    public static connect(): void {
        this.db = SQLite.openDatabaseSync("creditbook");

        this.db.execSync("CREATE TABLE IF NOT EXISTS counters (userId INTEGER NOT NULL)");
        const counter = this.db.getFirstSync("SELECT userId from counters");
        if (!counter) {
            this.db.execSync("INSERT INTO counters (userId) values  (0)");
        }

        this.db.execSync(
            "CREATE TABLE IF NOT EXISTS transactions (userId INTEGER NOT NULL, amount INTEGER NOT NULL, type TEXT NOT NULL)"
        );
        this.db.execSync(
            "CREATE TABLE IF NOT EXISTS users (userId INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, balance INTEGER NOT NULL)"
        );
    }

    public static getUsers(): IUser[] {
        return this.db.getAllSync("SELECT * FROM users");
    }

    public static createUser(userName: string): IUser {
        const { userId: counter } = this.db.getFirstSync("SELECT userId from counters") as { userId: number };
        this.db.runSync("INSERT INTO users (userId, name, balance) VALUES (?, ?, ?)", counter + 1, userName, 0);
        this.db.runSync("UPDATE counters SET userId = ?", counter + 1);
        return { userId: counter + 1, name: userName, balance: 0 };
    }

    public static deleteUser(userId: number): void {
        this.db.runSync("DELETE FROM users where userId = ?", userId);
        this.db.runSync("DELETE FROM transactions where userId = ?", userId);
    }

    public static getTransactions(userId: number): ITransaction[] {
        return this.db.getAllSync("SELECT * FROM transactions where userId = ?", userId);
    }

    public static createTransaction(userId: number, amount: number, type: string): void {
        this.db.runSync("INSERT INTO transactions (userId, amount, type) VALUES (?, ?, ?)", userId, amount, type);
        let { balance } = this.db.getFirstSync("SELECT balance FROM users WHERE userId = ?", userId) as IUser;
        console.log(balance);
        if (type === "Debit") {
            balance -= amount;
        } else {
            balance += amount;
        }
        console.log("After", balance);
        this.db.runSync("UPDATE users SET balance = ? WHERE userId = ?", balance, userId);
    }
}
