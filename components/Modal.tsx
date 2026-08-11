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
            }}
        >
            {children}
        </PaperModal>
    );
}
