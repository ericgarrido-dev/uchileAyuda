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
            case "Inicio": iconName = "home"; break;
            case "Mis Solicitudes": iconName = "file-text"; break;
            case "Estadisticas": iconName = "bar-chart-2"; break;
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

/* ---------------- HELPERS FCM ---------------- */

/**
 * Navega a RequestDetail de forma segura.
 * Si el navegador no está listo, reintenta hasta 5 veces cada 300ms.
 */
const navegarATicket = (
  navigationRef: React.MutableRefObject<any>,
  ticketId: string,
  delay = 0,
  intentos = 0
) => {
  const MAX_INTENTOS = 5;

  const go = () => {
    if (!navigationRef.current?.isReady()) {
      if (intentos < MAX_INTENTOS) {
        setTimeout(() => navegarATicket(navigationRef, ticketId, 0, intentos + 1), 300);
      }
      return;
    }

    try {
      console.log("🧭 Navegando al ticket:", ticketId);

      const state = navigationRef.current.getRootState();
    console.log("🔍 Estado completo:", JSON.stringify(state, null, 2));
      // 👇 reset en vez de navigate — fuerza el stack correcto
      navigationRef.current.reset({
        index: 1,
        routes: [
          { name: "Tabs" },
          {
            name: "RequestDetail",
            params: { request: { id: ticketId } },
          },
        ],
      });

    } catch (e: any) {
      console.log("❌ Error detallado:", e?.message, e?.stack);
    }
  };

  delay > 0 ? setTimeout(go, delay) : go();
};

/**
 * Guarda el FCM token en el backend asociado al user_id de la tabla users de Laravel.
 * Por ahora solo loguea el payload para verificar en consola Firebase.
 */
const guardarFCMToken = async (userId?: number) => {
  try {
    const permiso = await messaging().requestPermission();
    const autorizado =
      permiso === messaging.AuthorizationStatus.AUTHORIZED ||
      permiso === messaging.AuthorizationStatus.PROVISIONAL;

    if (!autorizado) {
      console.log("❌ Permisos FCM denegados");
      return;
    }

    const fcmToken = await messaging().getToken();

    // 👇 Payload completo que se enviará al backend cuando esté listo
    console.log("📦 Payload que se enviará al backend:", JSON.stringify({
      user_id: userId,
      fcm_token: fcmToken,
    }, null, 2));

    console.log("🔑 FCM TOKEN:", fcmToken);
    console.log("👤 USER ID (tabla users Laravel):", userId);

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

/**
 * Actualiza el FCM token en el backend cuando Firebase lo rota.
 */
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loginTicket, setLoginTicket] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const navigationRef = React.useRef<any>(null);

  /* ── App CERRADA: esperar que Firebase y el nav estén listos ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (!remoteMessage) return;
          console.log("🚀 App abierta desde notificación (cerrada):", remoteMessage);

          const ticketId = remoteMessage.data?.ticket_id;
          if (ticketId) {
            navegarATicket(navigationRef, String(ticketId), 1500);
          }
        })
        .catch((e) => console.log("❌ getInitialNotification error:", e));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  /* ── Foreground + Background + Token (solo con sesión completa) ── */
  useEffect(() => {
    if (!isLoggedIn || !selectedTenant) return;

    // 👇 Log completo del usuario para verificar campos disponibles
    console.log("✅ SESIÓN COMPLETA");
    console.log("👤 User completo:", JSON.stringify(user, null, 2));
    console.log("👤 User ID (Laravel):", user?.id);
    console.log("👤 User email:", user?.email);
    console.log("🏢 Tenant seleccionado:", selectedTenant);

    // Pasa el user.id (PK de la tabla users de Laravel)
    guardarFCMToken(user?.id);

    // 🔔 App en FOREGROUND: mostrar Alert con botón para navegar
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
                console.log("🔔 ticket:", ticketId);
                navegarATicket(navigationRef, String(ticketId));
              } else {
                console.warn("⚠️ No llegó ticket_id en la notificación foreground");
              }
            },
          },
          { text: "Cerrar", style: "cancel" },
        ]
      );
    });

    // 📲 App en BACKGROUND: usuario toca la notificación
    const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("📲 Background tap:", remoteMessage);
      const ticketId = remoteMessage.data?.ticket_id;
      if (ticketId) {
        navegarATicket(navigationRef, String(ticketId), 500);
      } else {
        console.warn("⚠️ No llegó ticket_id en la notificación background");
      }
    });

    // 🔄 Token rotado por Firebase
    const unsubscribeRefresh = messaging().onTokenRefresh(actualizarFCMToken);

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeRefresh();
    };
  }, [isLoggedIn, selectedTenant]);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    setIsLoggedIn(false);
    setSelectedTenant(null);
    setTenants([]);
    setLoginTicket(null);
    setUser(null);
    await AsyncStorage.multiRemove(["token", "tenant_id", "tenants", "login_ticket"]);
  };

  /* ---------------- HELPERS ---------------- */
  // 👇 Se preserva tenant_user_id para poder identificar al usuario por tenant
  const mapTenants = (list: any[]) =>
    list.map((t: any, index: number) => ({
      id: t.tenant_id || String(index),
      name: t.tenant_id.toUpperCase(),
      domain: `${t.tenant_id}.ayuda.uchilefau.cl`,
      description: "Unidad institucional",
      tenant_user_id: t.tenant_user_id, // 👈 PK del usuario en ese tenant
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
                      // 👇 Ver todo lo que retorna el backend al hacer login
                      console.log("📡 DATA LOGIN COMPLETA:", JSON.stringify(data, null, 2));
                      console.log("👤 USER OBJECT:", JSON.stringify(data.user, null, 2));
                      console.log("👤 USER ID:", data.user?.id);

                      if (data.requiresTenantSelection) {
                        const mapped = mapTenants(data.tenants || []);

                        await AsyncStorage.setItem("login_ticket", data.loginTicket);
                        await AsyncStorage.setItem("tenants", JSON.stringify(mapped));

                        setTenants(mapped);
                        setLoginTicket(data.loginTicket);
                        setUser(data.user ?? null);
                        setIsLoggedIn(true);
                        return;
                      }

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
              loginTicket={loginTicket!}
              onSelectTenant={(tenantId) => {
                // 👇 Buscar el tenant elegido y extraer su tenant_user_id
                const tenantSeleccionado = tenants.find((t) => t.id === tenantId);

                console.log("🏢 Tenant elegido:", tenantId);
                console.log("👤 tenant_user_id del tenant elegido:", tenantSeleccionado?.tenant_user_id);

                // Guardamos el user_id correspondiente al tenant seleccionado
                setUser({ id: tenantSeleccionado?.tenant_user_id });
                setSelectedTenant(tenantId);
              }}
              onLogout={handleLogout}
            />

            /* ── 3. LOGUEADO CON TENANT → Dashboard ── */
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Tabs" component={TabNavigator} />
              <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            </Stack.Navigator>
          )}

        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
