import * as React from "react";
import { View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

const CardComponent = ({
    userId,
    name,
    balance,
    onPressHandler,
    onDeleteHandler,
}: {
    userId: number;
    name: string;
    balance: number;
    onPressHandler: Function;
    onDeleteHandler: Function;
}) => {
    return (
        <Card mode="outlined" style={{ borderRadius: 0 }} onPress={() => onPressHandler(userId)}>
            <Card.Content>
                <View style={{ flexDirection: "row" }}>
                    <Text variant="titleMedium" style={{ textAlignVertical: "center" }}>
                        {name}
                    </Text>
                    <Text
                        style={{
                            color: balance < 0 ? "red" : "green",
                            marginLeft: "auto",
                            textAlignVertical: "center",
                        }}
                    >
                        ₹{Math.abs(balance)}
                    </Text>
                    <IconButton icon="delete" onPress={() => onDeleteHandler(userId)}></IconButton>
                </View>
            </Card.Content>
        </Card>
    );
};

export default CardComponent;
