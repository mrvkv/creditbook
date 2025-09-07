import modalStylesheet from "@/stylesheets/modal.stylesheet";
import { ReactNode } from "react";
import { Modal as PaperModal } from "react-native-paper";

interface IModalProps {
    readonly children: ReactNode;
    readonly isVisible: boolean;
    readonly setVisibility: (isVisible: boolean) => void;
}

export default function Modal({ children, isVisible, setVisibility }: IModalProps) {
    function hideModal() {
        setVisibility(false);
    }

    return (
        <PaperModal visible={isVisible} onDismiss={hideModal} contentContainerStyle={modalStylesheet.modal}>
            {children}
        </PaperModal>
    );
}
