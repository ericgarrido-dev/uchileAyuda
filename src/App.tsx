import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
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
import messaging from "@react-native-firebase/messaging";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ---------------- TAB NAVIGATOR ---------------- */
function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
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
            case "Inicio":          iconName = "home";        break;
            case "Mis Solicitudes": iconName = "file-text";   break;
            case "Estadisticas":    iconName = "bar-chart-2"; break;
          }
          return <Icon name={iconName} size={18} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio"          component={DashboardScreen} />
      <Tab.Screen name="Mis Solicitudes" component={RequestsListScreen} />
      <Tab.Screen name="Estadisticas"    component={StatsScreen} />
    </Tab.Navigator>
  );
}

/* ---------------- HELPERS FCM ---------------- */
// ✅ Se mantiene igual que tu versión original que funcionaba
const guardarFCMToken = async () => {
  try {
    const permiso = await messaging().requestPermission();
    const autorizado =
      permiso === messaging.AuthorizationStatus.AUTHORIZED ||
      permiso === messaging.AuthorizationStatus.PROVISIONAL;

    if (!autorizado) {
      console.log("❌ Permisos denegados");
      return;
    }

    const fcmToken = await messaging().getToken();
    console.log("🔑 FCM TOKEN PARA PRUEBAS:", fcmToken);

    // ✅ Descomentar cuando el backend tenga el endpoint listo:
    // const authToken = await AsyncStorage.getItem("token");
    // await fetch("https://devticket.uchilefau.cl/api/user/fcm-token", {
    //   method: "POST",
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${authToken}`,
    //   },
    //   body: JSON.stringify({ fcm_token: fcmToken }),
    // });

  } catch (e) {
    console.log("❌ Error guardando FCM token:", e);
  }
};

const actualizarFCMToken = async (nuevoToken: string) => {
  try {
    console.log("🔄 FCM token rotado:", nuevoToken);

    // ✅ Descomentar cuando el backend tenga el endpoint listo:
    // const authToken = await AsyncStorage.getItem("token");
    // if (!authToken) return;
    // await fetch("https://devticket.uchilefau.cl/api/user/fcm-token", {
    //   method: "POST",
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${authToken}`,
    //   },
    //   body: JSON.stringify({ fcm_token: nuevoToken }),
    // });
  } catch (e) {
    console.log("❌ Error actualizando FCM token:", e);
  }
};

/* ---------------- APP ---------------- */
export default function App() {
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenants,        setTenants]        = useState<any[]>([]);
  const [loginTicket,    setLoginTicket]    = useState<string | null>(null);
  const [user,           setUser]           = useState<any>(null);

  const navigationRef = React.useRef<any>(null);

  /* ── App CERRADA → delay para que Firebase esté listo ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (!remoteMessage) return;
          console.log("🚀 App abierta desde notificación:", remoteMessage);

          const ticketId = remoteMessage.data?.ticket_id;
          if (ticketId) {
            setTimeout(() => {
              navigationRef.current?.navigate("RequestDetail", {
                request: { id: ticketId },
              });
            }, 1500);
          }
        })
        .catch((e) => console.log("❌ getInitialNotification error:", e));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  /* ── Foreground + Background + Token (solo con sesión activa) ── */
  useEffect(() => {
    if (!isLoggedIn) return;

    guardarFCMToken();

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log("🔔 Foreground:", remoteMessage);
      const ticketId = remoteMessage.data?.ticket_id;

      Alert.alert(
        remoteMessage.notification?.title ?? "Nueva notificación",
        remoteMessage.notification?.body ?? "",
        [
          {
            text: "Ver ticket",
            onPress: () => {
              if (ticketId) {
                navigationRef.current?.navigate("RequestDetail", {
                  request: { id: ticketId },
                });
              }
            },
          },
          { text: "Cerrar", style: "cancel" },
        ]
      );
    });

    const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("📲 Background:", remoteMessage);
      const ticketId = remoteMessage.data?.ticket_id;
      if (ticketId) {
        setTimeout(() => {
          navigationRef.current?.navigate("RequestDetail", {
            request: { id: ticketId },
          });
        }, 500);
      }
    });

    const unsubscribeRefresh = messaging().onTokenRefresh(actualizarFCMToken);

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeRefresh();
    };
  }, [isLoggedIn]);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    setIsLoggedIn(false);
    setSelectedTenant(null);
    setTenants([]);
    setLoginTicket(null);
    setUser(null);
    // ✅ FIX: limpiar todas las keys incluyendo tenants y login_ticket
    await AsyncStorage.multiRemove(["token", "tenant_id", "tenants", "login_ticket"]);
  };

  /* ---------------- HELPERS ---------------- */
  const mapTenants = (list: any[]) =>
    list.map((t: any, index: number) => ({
      id:          t.tenant_id || String(index),
      name:        t.tenant_id.toUpperCase(),
      domain:      `${t.tenant_id}.ayuda.uchilefau.cl`,
      description: "Unidad institucional",
    }));

  /* ---------------- RENDER ---------------- */
  return (
    <SafeAreaProvider>
      <AuthProvider logout={handleLogout}>
        <NavigationContainer ref={navigationRef}>

          {/* ── 1. NO LOGUEADO → Login ── */}
          {!isLoggedIn ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={async (data) => {
                      console.log("📥 onLogin data:", JSON.stringify(data)); // ← agregar esto
                      /* ── MULTI TENANT ──
                       * Persiste loginTicket + tenants en AsyncStorage
                       * para que DashboardScreen los lea y el Header
                       * muestre el switcher si hay más de 1 tenant. */
                      if (data.requiresTenantSelection) {
                        const mapped = mapTenants(data.tenants || []);

                        // ✅ FIX: guardar en AsyncStorage para DashboardScreen
                        await AsyncStorage.setItem("login_ticket", data.loginTicket);
                        await AsyncStorage.setItem("tenants", JSON.stringify(mapped));

                        setTenants(mapped);
                        setLoginTicket(data.loginTicket);
                        setUser(data.user ?? null);
                        setIsLoggedIn(true);
                        return;
                      }

                      /* ── SINGLE TENANT ──
                       * Limpiar login_ticket y guardar lista vacía
                       * para que el Header NO muestre el switcher. */
                      await AsyncStorage.removeItem("login_ticket");
                      await AsyncStorage.setItem("tenants", JSON.stringify([]));
                      await AsyncStorage.setItem("token", data.token);
                      await AsyncStorage.setItem("tenant_id", data.tenant_id);

                      setUser(data.user);
                      setSelectedTenant(data.tenant_id);
                      setIsLoggedIn(true);
                    }}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>

          /* ── 2. LOGUEADO PERO SIN TENANT → Selección ── */
          ) : !selectedTenant ? (
            <TenantSelectionScreen
              tenants={tenants}
              userName={user?.email || user?.name || "Usuario"}
              loginTicket={loginTicket!}   // ✅ FIX: se pasa para canjearlo por token
              onSelectTenant={(tenantId) => {
                // TenantSelectionScreen ya guardó token + tenant_id en AsyncStorage
                setSelectedTenant(tenantId);
              }}
              onLogout={handleLogout}
            />

          /* ── 3. LOGUEADO CON TENANT → Dashboard ── */
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Tabs"          component={TabNavigator} />
              <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            </Stack.Navigator>
          )}

        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
