import ConfirmationModal from "@/components/ConfirmationModal";
import HeaderLeft from "@/components/HeaderLeft";
import HeaderRight from "@/components/HeaderRight";
import Modal from "@/components/Modal";
import TransactionModal from "@/components/TransactionModal";
import TransactionTable from "@/components/TransactionTable";
import DatabaseService from "@/services/database.service";
import { ITransaction } from "@/types/transaction.interface";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { Portal } from "react-native-paper";

export default function Details() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const { userId } = useLocalSearchParams() as unknown as { userId: string };
    const headerRight = () => <HeaderRight handler={addTransactionHandler} />;
    const headerLeft = () => <HeaderLeft handler={navigateToHome} />;

    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<ITransaction>();

    useEffect(() => {
        refreshTransactionList();
    }, []);
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft,
            headerRight,
        });
    }, []);

    function refreshTransactionList(): void {
        setTransactions(DatabaseService.getTransactions(db, parseInt(userId)));
    }

    function navigateToHome(): void {
        router.replace({
            pathname: "/",
        });
    }

    function addTransactionHandler(): void {
        setIsDelete(false);
        setIsVisible(true);
    }

    function deleteTransactionHandler(transaction: ITransaction): void {
        setIsDelete(true);
        setIsVisible(true);
        setSelectedTransaction(transaction);
    }

    function deleteTransaction(): void {
        DatabaseService.deleteTransaction(db, selectedTransaction!);
        refreshTransactionList();
    }

    return (
        <View>
            <Portal>
                {!isDelete && (
                    <Modal isVisible={isVisible} setVisibility={setIsVisible}>
                        <TransactionModal userId={userId} setVisibility={setIsVisible} refreshTransactionList={refreshTransactionList}></TransactionModal>
                    </Modal>
                )}
                {isDelete && (
                    <ConfirmationModal
                        message="Are you sure, you want to delete the transaction?"
                        setIsVisible={setIsVisible}
                        onSubmit={() => deleteTransaction()}
                        onCancel={() => {}}
                        isVisible={isVisible}
                    ></ConfirmationModal>
                )}
            </Portal>
            <TransactionTable transactions={transactions} onDelete={deleteTransactionHandler}></TransactionTable>;
        </View>
    );
}
