import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RequestDetailScreen from "../screens/RequestDetailScreen";
import { FloatingButton } from "../components/FloatingButton";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* STACK para detalle */
function RequestsStack() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      </Stack.Navigator>
      {/*<FloatingButton /> */}
    </View>
  );
}