import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RequestsListScreen from "../screens/RequestsListScreen";
import RequestDetailScreen from "../screens/RequestDetailScreen";

const Stack = createNativeStackNavigator();

export default function RequestsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* LISTA DE SOLICITUDES */}
      <Stack.Screen
        name="RequestsList"
        component={RequestsListScreen}
      />

      {/* DETALLE DE SOLICITUD */}
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
      />

    </Stack.Navigator>
  );
}