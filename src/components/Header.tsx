import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/Feather";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Tenant {
    id: string;
    name: string;
    domain: string;
}

type Props = {
    tenant?: string | null;
    onLogout: () => void;
    tenants?: Tenant[];
    onChangeTenant?: (tenantId: string) => void;
    user?: string | null;
};

/* ---------------- CLIMA ---------------- */
type WeatherInfo = {
    icon: string;
    label: string;
    temp: number;
    code: number;
};

const weatherCodeMap: Record<number, { icon: string; label: string }> = {
    0: { icon: "sun", label: "Despejado" },
    1: { icon: "sun", label: "Mayormente despejado" },
    2: { icon: "cloud", label: "Parcialmente nublado" },
    3: { icon: "cloud", label: "Nublado" },
    45: { icon: "cloud", label: "Neblina" },
    48: { icon: "cloud", label: "Neblina helada" },
    51: { icon: "droplet", label: "Llovizna leve" },
    53: { icon: "cloud-drizzle", label: "Llovizna" },
    55: { icon: "cloud-drizzle", label: "Llovizna intensa" },
    61: { icon: "cloud-rain", label: "Lluvia leve" },
    63: { icon: "cloud-rain", label: "Lluvia" },
    65: { icon: "cloud-lightning", label: "Lluvia intensa" },
    71: { icon: "cloud-snow", label: "Nieve leve" },
    73: { icon: "cloud-snow", label: "Nieve" },
    75: { icon: "cloud-snow", label: "Nieve intensa" },
    80: { icon: "cloud-rain", label: "Chubascos" },
    81: { icon: "cloud-rain", label: "Chubascos moderados" },
    82: { icon: "cloud-lightning", label: "Chubascos fuertes" },
    95: { icon: "cloud-lightning", label: "Tormenta" },
    96: { icon: "cloud-lightning", label: "Tormenta con granizo" },
    99: { icon: "cloud-lightning", label: "Tormenta severa" },
};

const getWeatherInfo = (code: number, temp: number): WeatherInfo => {
    const info = weatherCodeMap[code] ?? { icon: "cloud", label: "Nublado" };
    return { ...info, temp, code };
};

const fetchWeather = async (): Promise<WeatherInfo | null> => {
    try {
        const url =
            "https://api.open-meteo.com/v1/forecast?latitude=-33.441772&longitude=-70.637449&current_weather=true&timezone=auto";
        const response = await fetch(url);
        const data = await response.json();

        if (data?.current_weather) {
            return getWeatherInfo(
                data.current_weather.weathercode,
                Math.round(data.current_weather.temperature)
            );
        }
        return null;
    } catch (e) {
        console.log("❌ Error obteniendo clima:", e);
        return null;
    }
};

/* ---------------- TIPOS DE PARTÍCULAS ---------------- */
type ParticleType = "rain" | "snow" | "wind" | "sun" | "none";

const getParticleType = (code: number): ParticleType => {
    if ([0, 1].includes(code)) return "sun";
    if ([2, 3, 45, 48].includes(code)) return "wind";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return "rain";
    if ([71, 73, 75].includes(code)) return "snow";
    return "none";
};

/* ---------------- GOTA DE LLUVIA ---------------- */
const RainDrop = ({ delay, left, startTop }: { delay: number; left: number; startTop: number }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateY.setValue(0);
            opacity.setValue(0.6);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 120,
                    duration: 3000 + Math.random() * 1000,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 3000 + Math.random() * 1000,
                    delay,
                    useNativeDriver: true,
                }),
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: startTop,
                left: left,
                transform: [{ translateY }],
                opacity,
            }}
        >
            <Icon name="droplet" size={12} color="#ffffff" />
        </Animated.View>
    );
};

/* ---------------- COPO DE NIEVE ---------------- */
const SnowFlake = ({ delay, left, startTop }: { delay: number; left: number; startTop: number }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateY.setValue(0);
            translateX.setValue(0);
            opacity.setValue(0.8);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 120,
                    duration: 2000 + Math.random() * 1000,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: 15,
                        duration: 1000,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: -15,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 2000 + Math.random() * 1000,
                    delay,
                    useNativeDriver: true,
                }),
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: startTop,
                left: left,
                transform: [{ translateY }, { translateX }],
                opacity,
            }}
        >
            <Icon name="cloud-snow" size={10} color="#ffffff" />
        </Animated.View>
    );
};

/* ---------------- LÍNEA DE VIENTO ---------------- */
const WindLine = ({ delay, top }: { delay: number; top: number }) => {
    const translateX = useRef(new Animated.Value(-30)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateX.setValue(-30);
            opacity.setValue(0);

            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 200,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: SCREEN_WIDTH,
                        duration: 1500 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 1500 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: top,
                left: 0,
                transform: [{ translateX }],
                opacity,
            }}
        >
            <Icon name="wind" size={25} color="#ffffff" />
        </Animated.View>
    );
};
/* ---------------- SOL FLOTANTE ---------------- */
const FloatingSun = ({ delay, left, startTop }: { delay: number; left: number; startTop: number }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateY.setValue(0);
            opacity.setValue(0);
            scale.setValue(0.5);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -30,
                    duration: 3000 + Math.random() * 1000,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.5,
                        duration: 1000,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 1500,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.3,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: startTop,
                left: left,
                transform: [{ translateY }, { scale }],
                opacity,
            }}
        >
            <Icon name="sun" size={14} color="#ffffff" />
        </Animated.View>
    );
};

/* ---------------- PARTÍCULAS ---------------- */
const WeatherParticles = ({ type }: { type: ParticleType }) => {
    if (type === "none") return null;

    return (
        <View style={styles.particlesContainer} pointerEvents="none">
            {type === "rain" &&
                Array.from({ length: 20 }).map((_, i) => (
                    <RainDrop
                        key={`rain-${i}`}
                        delay={i * 200}
                        left={Math.random() * SCREEN_WIDTH}
                        startTop={Math.random() * -20}
                    />
                ))}

            {type === "snow" &&
                Array.from({ length: 15 }).map((_, i) => (
                    <SnowFlake
                        key={`snow-${i}`}
                        delay={i * 250}
                        left={Math.random() * SCREEN_WIDTH}
                        startTop={Math.random() * -10}
                    />
                ))}

            {type === "wind" &&
                Array.from({ length: 5 }).map((_, i) => (
                    <WindLine
                        key={`wind-${i}`}
                        delay={i * 400}
                        top={15 + i * 18}
                    />
                ))}

            {type === "sun" &&
                Array.from({ length: 10 }).map((_, i) => (
                    <FloatingSun
                        key={`sun-${i}`}
                        delay={i * 400}
                        left={Math.random() * SCREEN_WIDTH}
                        startTop={10 + Math.random() * 60}
                    />
                ))}
        </View>
    );
};

/* ---------------- COLORES SEGÚN CLIMA ---------------- */
const getHeaderColor = (type: ParticleType): string => {
    switch (type) {
        case "sun": return "#1e40af";
        case "wind": return "#1e40af";
        case "rain": return "#1e40af";
        case "snow": return "#1e40af";
        default: return "#1e40af";
    }
};

/* ---------------- HEADER ---------------- */
export const Header = ({ tenant, onLogout, user }: Props) => {
    const [weather, setWeather] = useState<WeatherInfo | null>(null);

    useEffect(() => {
        // Consultar al montar
        fetchWeather().then(setWeather);

        // Actualizar cada 15 minutos
        const interval = setInterval(() => {
            fetchWeather().then(setWeather);
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const particleType = weather ? getParticleType(weather.code) : "none";

    return (
        <Animatable.View
            animation="fadeInDown"
            style={[styles.header, { backgroundColor: getHeaderColor(particleType) }]}
        >
            <WeatherParticles type={particleType} />

            {/* Columna izquierda: info usuario */}
            <View style={{ flex: 1, zIndex: 2 }}>
                <Text style={styles.headerSubtitle}>Bienvenido,</Text>
                <Text style={styles.headerName}>{user ?? "Usuario"}</Text>
                <Text style={styles.headerTitle}>
                    {tenant ? `${tenant}.ayuda.uchilefau.cl` : "ayuda.uchilefau.cl"}
                </Text>
            </View>

            {/* Columna derecha: clima + logout alineados */}
            <View style={[styles.rightColumn, { zIndex: 2 }]}>
                {weather && (
                    <Animatable.View animation="fadeIn" style={styles.weatherContainer}>
                        <Icon name={weather.icon} size={14} color="#fff" />
                        <Text style={styles.weatherTemp}>{weather.temp}°</Text>
                        <Text style={styles.weatherLabel}>{weather.label}</Text>
                    </Animatable.View>
                )}
                <TouchableOpacity style={styles.logout} onPress={onLogout}>
                    <Icon name="log-out" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        </Animatable.View>
    );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    header: {
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
    },
    headerTitle: {
        color: "#fff",
        opacity: 0.8,
        fontSize: 14,
    },
    headerSubtitle: {
        color: "#fff",
        opacity: 0.8,
        fontSize: 14,
        marginTop: 16,
    },
    headerName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    rightColumn: {
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: 16,
    },
    logout: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
    },
    weatherContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    weatherTemp: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    weatherLabel: {
        color: "#fff",
        opacity: 0.8,
        fontSize: 11,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
});