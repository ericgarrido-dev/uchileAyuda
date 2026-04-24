import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RequestDetailScreen from "../screens/RequestDetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* STACK para detalle */
function RequestsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
    </Stack.Navigator>
  );
}