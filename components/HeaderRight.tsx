import { IconButton } from "react-native-paper";

interface HeaderRightProps {
    readonly handler: Function;
}

export default function HeaderRight({ handler }: HeaderRightProps) {
    return (
        <IconButton
            icon="plus"
            mode="contained"
            selected={true}
            onPress={() => {
                handler();
            }}
        />
    );
}
