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
    Preference = "preferences",
    Group = "groups",
    GroupMember = "group_members",
    GroupExpense = "group_expenses",
    GroupExpenseSplit = "group_expense_splits",
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
    preferences: {
        key: {
            type: DbDataType.Text,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        value: {
            type: DbDataType.Text,
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
        isSettled: {
            type: DbDataType.Int,
            constraints: [`${DbConstraint.Default} 0`] as unknown as DbConstraint[],
        },
        groupId: {
            type: DbDataType.Int,
            constraints: [`${DbConstraint.Default} NULL`] as unknown as DbConstraint[],
        },
        expenseId: {
            type: DbDataType.Int,
            constraints: [`${DbConstraint.Default} NULL`] as unknown as DbConstraint[],
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
    groups: {
        groupId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        name: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        category: {
            type: DbDataType.Text,
            constraints: [`${DbConstraint.Default} 'general'`] as unknown as DbConstraint[],
        },
        createdAt: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        isArchived: {
            type: DbDataType.Int,
            constraints: [`${DbConstraint.Default} 0`] as unknown as DbConstraint[],
        },
    },
    group_members: {
        groupMemberId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        groupId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        userId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
    },
    group_expenses: {
        expenseId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        groupId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        description: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        totalAmount: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        paidByUserId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        splitType: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        date: {
            type: DbDataType.Text,
            constraints: [DbConstraint.NotNull],
        },
        isSettlement: {
            type: DbDataType.Int,
            constraints: [`${DbConstraint.Default} 0`] as unknown as DbConstraint[],
        },
    },
    group_expense_splits: {
        splitId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.PrimaryKey, DbConstraint.NotNull],
        },
        expenseId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        userId: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
        amount: {
            type: DbDataType.Int,
            constraints: [DbConstraint.NotNull],
        },
    },
} as ITableSchema;
