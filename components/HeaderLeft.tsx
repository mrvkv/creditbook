import { IconButton } from "react-native-paper";

interface HeaderLeftProps {
    readonly handler: Function;
}

export default function HeaderLeft({ handler }: HeaderLeftProps) {
    return (
        <IconButton
            icon="arrow-left"
            mode="contained"
            onPress={() => {
                handler();
            }}
        />
    );
}
