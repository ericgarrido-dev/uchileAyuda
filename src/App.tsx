import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../src/screens/DashboardScreen";
import RequestsStack from "./navigation/RequestsStack";
import StatsScreen from "../src/screens/StatsScreen";
import { LoginScreen } from "../src/screens/LoginScreen";
import { RegisterScreen } from "../src/screens/RegisterScreen";
import TenantSelectionScreen from "../src/screens/TenantSelectionScreen";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "../src/context/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const [tenants, setTenants] = useState<any[]>([]);
  const [loginTicket, setLoginTicket] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedTenant(null);
    setTenants([]);
    setLoginTicket(null);
    setUser(null);

    AsyncStorage.removeItem("token");
    AsyncStorage.removeItem("tenant_id");
  };

  /* ---------------- MAPEO TENANTS ---------------- */
  const mapTenants = (list: any[]) =>
    list.map((t: any, index: number) => ({
      id: t.tenant_id || index.toString(),
      name: t.tenant_id.toUpperCase(),
      domain: `${t.tenant_id}.ayuda.uchilefau.cl`,
      description: "Unidad institucional",
    }));

  return (
    <AuthProvider logout={handleLogout}>
      <NavigationContainer>

        {/* ---------------- LOGIN FLOW ---------------- */}
        {!isLoggedIn ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLogin={async (data) => {

                    // MULTI TENANT
                    if (data.requiresTenantSelection) {
                      setTenants(mapTenants(data.tenants || []));
                      setLoginTicket(data.loginTicket);
                      setUser(data.user);
                      setIsLoggedIn(true);
                      return;
                    }

                    // SINGLE TENANT
                    setUser(data.user);
                    setSelectedTenant(data.tenant_id);
                    setIsLoggedIn(true);

                    // 🔥 FIX CRÍTICO
                    await AsyncStorage.setItem("token", data.token);
                    await AsyncStorage.setItem("tenant_id", data.tenant_id);
                  }}
                  onRegister={() => props.navigation.navigate("Register")}
                  onForgotPassword={() => { }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Register">
              {(props) => (
                <RegisterScreen
                  {...props}
                  onRegister={() => setIsLoggedIn(true)}
                  onBackToLogin={() => props.navigation.navigate("Login")}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        ) : !selectedTenant ? (

          <TenantSelectionScreen
            tenants={tenants}
            userName={user?.email || "Usuario"}
            onSelectTenant={async (tenantId: string) => {

              setSelectedTenant(tenantId);

              // 🔥 FIX CRÍTICO TAMBIÉN AQUÍ
              await AsyncStorage.setItem("tenant_id", tenantId);
            }}
            onLogout={handleLogout}
          />

        ) : (

          <Tab.Navigator
            screenOptions={{
              headerShown: false,
            }}>
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Requests" component={RequestsStack} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Search" component={StatsScreen} />
            <Tab.Screen name="Admin" component={StatsScreen} />
          </Tab.Navigator>

        )}

      </NavigationContainer>
    </AuthProvider>
  );
}