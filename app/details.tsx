import ConfirmationModal from "@/components/ConfirmationModal";
import ExportStatementModal from "@/components/ExportStatementModal";
import HeaderLeft from "@/components/HeaderLeft";
import HeaderRight from "@/components/HeaderRight";
import { TransactionsHeaderTitle } from "@/components/HeaderTitle";
import Modal from "@/components/Modal";
import TransactionModal from "@/components/TransactionModal";
import TransactionTable from "@/components/TransactionTable";
import { ThemeContext, useAppTheme } from "@/hooks/useAppTheme";
import DatabaseService from "@/services/database.service";
import { ITransaction } from "@/types/transaction.interface";
import { IUser } from "@/types/user.interface";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { Portal, Text } from "react-native-paper";

export default function Details() {
    const db = useSQLiteContext();
    const router = useRouter();
    const navigation = useNavigation();
    const { userId } = useLocalSearchParams() as unknown as { userId: string };
    const appTheme = useAppTheme();
    const { colors } = appTheme;

    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [userName, setUserName] = useState<string>("");
    const [isVisible, setIsVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [isSettle, setIsSettle] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<ITransaction>();
    const [isExportVisible, setIsExportVisible] = useState(false);

    // Safe back navigation — works whether or not there is a stack entry above
    const navigateToHome = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    }, [router]);

    // Android hardware back button support
    useEffect(() => {
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            navigateToHome();
            return true; // prevent default (app exit)
        });
        return () => subscription.remove();
    }, [navigateToHome]);

    useEffect(() => {
        refreshTransactionList();
        // Fetch user name to display in header
        const users: IUser[] = DatabaseService.getUsers(db);
        const user = users.find((u) => u.userId === parseInt(userId));
        if (user) setUserName(user.name);
    }, []);

    useLayoutEffect(() => {
        const headerRight = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderRight
                    handler={addTransactionHandler}
                    onExportStatementPress={() => setIsExportVisible(true)}
                />
            </ThemeContext.Provider>
        );
        const headerLeft = () => (
            <ThemeContext.Provider value={appTheme}>
                <HeaderLeft handler={navigateToHome} />
            </ThemeContext.Provider>
        );
        const headerTitle = () => (
            <ThemeContext.Provider value={appTheme}>
                <TransactionsHeaderTitle userName={userName} />
            </ThemeContext.Provider>
        );
        navigation.setOptions({
            headerLeft,
            headerRight,
            headerTitle,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
        });
    }, [userName, appTheme, navigateToHome]);

    function refreshTransactionList(): void {
        setTransactions(DatabaseService.getTransactions(db, parseInt(userId)));
    }

    function addTransactionHandler(): void {
        setIsEdit(false);
        setIsDelete(false);
        setIsSettle(false);
        setSelectedTransaction(undefined);
        setIsVisible(true);
    }

    function editTransactionHandler(transaction: ITransaction): void {
        setIsDelete(false);
        setIsSettle(false);
        setIsEdit(true);
        setSelectedTransaction(transaction);
        setIsVisible(true);
    }

    function deleteTransactionHandler(transaction: ITransaction): void {
        setIsEdit(false);
        setIsSettle(false);
        setIsDelete(true);
        setSelectedTransaction(transaction);
        setIsVisible(true);
    }

    function settleAccountHandler(): void {
        setIsEdit(false);
        setIsDelete(false);
        setIsSettle(true);
        setIsVisible(true);
    }

    function deleteTransaction(): void {
        if (selectedTransaction) {
            DatabaseService.deleteTransaction(db, selectedTransaction);
            refreshTransactionList();
        }
    }

    function settleAccount(): void {
        DatabaseService.settleAccount(db, parseInt(userId));
        refreshTransactionList();
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
                <ThemeContext.Provider value={appTheme}>
                    {!isDelete && !isSettle && (
                        <Modal isVisible={isVisible} setVisibility={setIsVisible}>
                            <TransactionModal
                                userId={userId}
                                setVisibility={setIsVisible}
                                refreshTransactionList={refreshTransactionList}
                                transaction={isEdit ? selectedTransaction : undefined}
                            />
                        </Modal>
                    )}
                    {isDelete && (
                        <ConfirmationModal
                            message="Are you sure you want to delete this transaction? This action cannot be undone."
                            setIsVisible={setIsVisible}
                            onSubmit={() => deleteTransaction()}
                            onCancel={() => {}}
                            isVisible={isVisible}
                        />
                    )}
                    {isSettle && (
                        <ConfirmationModal
                            title="Settle Up Account"
                            submitLabel="Settle Up"
                            icon="check-all"
                            variant="success"
                            message={
                                <Text style={{ color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
                                    Are you sure you want to mark{" "}
                                    <Text style={{ fontWeight: "800", color: colors.onSurface }}>{userName}</Text>'s account as settled? All open entries will be moved to Settled History and{" "}
                                    <Text style={{ fontWeight: "800", color: colors.successText }}>net balance will reset to ₹0</Text>.
                                </Text>
                            }
                            setIsVisible={setIsVisible}
                            onSubmit={() => settleAccount()}
                            onCancel={() => {}}
                            isVisible={isVisible}
                        />
                    )}
                    <ExportStatementModal
                        isVisible={isExportVisible}
                        onClose={() => setIsExportVisible(false)}
                        userName={userName}
                        transactions={transactions}
                    />
                </ThemeContext.Provider>
            </Portal>
            <TransactionTable
                transactions={transactions}
                onEdit={editTransactionHandler}
                onDelete={deleteTransactionHandler}
                onSettleAccount={settleAccountHandler}
                onExportStatement={() => setIsExportVisible(true)}
            />
        </View>
    );
}
