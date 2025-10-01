import { DbConstraint, DbDataType } from "@/enums/database.enum";

export interface ITableSchema {
    [key: string]: {
        [key: string]: {
            type: DbDataType;
            constraints: DbConstraint[];
        };
    };
}

export enum Tables {
    User = "users",
    Transaction = "transactions",
    Counter = "counters",
}

export default {
    counters: {
        userId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        transactionId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
    },
    transactions: {
        transactionId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        userId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        amount: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        type: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        date: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        remark: {
            type: DbDataType.Text,
            constraints: [`${DbConstraint.Default} ''`] as unknown as DbConstraint[],
        },
    },
    users: {
        userId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        name: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        balance: {
            type: DbDataType.Real,
            constraints: [DbConstraint.NotNull],
            default: 0,
        },
        lastUpdated: {
            type: DbDataType.Text,
            constraints: [`${DbConstraint.Default} ''`] as unknown as DbConstraint[],
        },
    },
} as ITableSchema;
