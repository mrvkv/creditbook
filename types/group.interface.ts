export type GroupCategory = "trip" | "home" | "couple" | "other";

export interface IGroup {
    groupId: number;
    name: string;
    category: GroupCategory;
    createdAt: string;
    isArchived: number; // 0 or 1
    totalSpend?: number;
    memberCount?: number;
    userNetBalance?: number; // >0: You will get, <0: You owe, 0: Settled
}

export interface IGroupMember {
    groupMemberId: number;
    groupId: number;
    userId: number; // 0 for "You", >0 for user from users table
    userName?: string;
}

export interface IGroupExpenseSplit {
    userId: number;
    amount: number;
}

export interface IGroupExpense {
    expenseId: number;
    groupId: number;
    description: string;
    totalAmount: number;
    paidByUserId: number; // 0 for "You" or specific userId
    splitType: "equal" | "exact";
    date: string;
    paidByName?: string;
    splits?: IGroupExpenseSplit[];
    isSettlement?: number; // 1 if this was a debt settle-up transaction
}

export interface IGroupMemberBalance {
    userId: number;
    userName: string;
    netBalance: number; // >0: gets back, <0: owes, 0: settled
    totalPaid: number;
    totalShare: number;
}

export interface ISimplifiedDebt {
    fromUserId: number;
    fromUserName: string;
    toUserId: number;
    toUserName: string;
    amount: number;
}
