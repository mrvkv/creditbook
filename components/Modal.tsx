import { useAppTheme } from "@/hooks/useAppTheme";
import { ReactNode } from "react";
import { Modal as PaperModal } from "react-native-paper";

interface IModalProps {
    readonly children: ReactNode;
    readonly isVisible: boolean;
    readonly setVisibility: (isVisible: boolean) => void;
}

export default function Modal({ children, isVisible, setVisibility }: IModalProps) {
    const { colors } = useAppTheme();

    function hideModal() {
        setVisibility(false);
    }

    return (
        <PaperModal
            visible={isVisible}
            onDismiss={hideModal}
            contentContainerStyle={{
                backgroundColor: colors.modalBg,
                marginHorizontal: 24,
                borderRadius: 20,
                paddingBottom: 8,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                elevation: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            }}
        >
            {children}
        </PaperModal>
    );
}
