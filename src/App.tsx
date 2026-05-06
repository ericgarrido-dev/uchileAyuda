import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import DashboardScreen from "../src/screens/DashboardScreen";
import StatsScreen from "../src/screens/StatsScreen";
import RequestsListScreen from "../src/screens/RequestsListScreen";
import { LoginScreen } from "../src/screens/LoginScreen";
import TenantSelectionScreen from "../src/screens/TenantSelectionScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "../src/context/AuthContext";
import RequestDetailScreen from "../src/screens/RequestDetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ---------------- TAB NAVIGATOR SEPARADO ---------------- */
// Necesita ser componente propio para poder usar el hook useSafeAreaInsets
function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          height: 60 + insets.bottom,       // ✅ sube sobre la barra de sistema
          paddingBottom: insets.bottom + 5, // ✅ empuja iconos hacia arriba
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 2,
          fontWeight: "500",
        },
        tabBarIcon: ({ color }) => {
          let iconName = "";

          switch (route.name) {
            case "Inicio":
              iconName = "home";
              break;
            case "Mis Solicitudes":
              iconName = "file-text";
              break;
            case "Estadisticas":
              iconName = "bar-chart-2";
              break;
          }

          return <Icon name={iconName} size={18} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Mis Solicitudes" component={RequestsListScreen} />
      <Tab.Screen name="Estadisticas" component={StatsScreen} />
      
    </Tab.Navigator>
  );
}

/* ---------------- APP ---------------- */
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

  const mapTenants = (list: any[]) =>
    list.map((t: any, index: number) => ({
      id: t.tenant_id || index.toString(),
      name: t.tenant_id.toUpperCase(),
      domain: `${t.tenant_id}.ayuda.uchilefau.cl`,
      description: "Unidad institucional",
    }));

  return (
    // ✅ SafeAreaProvider envuelve todo
    <SafeAreaProvider>
      <AuthProvider logout={handleLogout}>
        <NavigationContainer>

          {!isLoggedIn ? (

            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={async (data) => {
                      if (data.requiresTenantSelection) {
                        setTenants(mapTenants(data.tenants || []));
                        setLoginTicket(data.loginTicket);
                        setUser(data.user);
                        setIsLoggedIn(true);
                        return;
                      }

                      setUser(data.user);
                      setSelectedTenant(data.tenant_id);
                      setIsLoggedIn(true);

                      await AsyncStorage.setItem("token", data.token);
                      await AsyncStorage.setItem("tenant_id", data.tenant_id);
                    }}
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
                await AsyncStorage.setItem("tenant_id", tenantId);
              }}
              onLogout={handleLogout}
            />

          ) : (

            <Stack.Navigator screenOptions={{ headerShown: false }}>

              {/* ✅ Tabs como componente separado */}
              <Stack.Screen name="Tabs" component={TabNavigator} />

              {/* Vista detalle — no aparece en tabs */}
              <Stack.Screen
                name="RequestDetail"
                component={RequestDetailScreen}
              />

            </Stack.Navigator>

          )}

        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
