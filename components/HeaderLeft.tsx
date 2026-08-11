import { useAppTheme } from "@/hooks/useAppTheme";
import { IconButton } from "react-native-paper";

interface HeaderLeftProps {
    readonly handler: Function;
}

export default function HeaderLeft({ handler }: HeaderLeftProps) {
    const { colors } = useAppTheme();

    return (
        <IconButton
            icon="arrow-left"
            size={22}
            iconColor={colors.headerText}
            style={{
                margin: 0,
                marginLeft: 4,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.15)",
            }}
            onPress={() => {
                handler();
            }}
        />
    );
}
