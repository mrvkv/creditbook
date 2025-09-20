export interface ITransaction {
    userId: number;
    transactionId: number;
    date: string;
    amount: number;
    type: string;
    remark: string;
}
