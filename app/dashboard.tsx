import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const BASE_URL = "https://yudibulat.kuota-zone.me/api";

interface PulsaData {
  [key: string]: unknown;
}

const TIMESTAMP_KEYS = [
  "expired_at", "expire_at", "expiry", "expiry_date", "expiration",
  "timestamp", "created_at", "updated_at", "date", "time", "masa_aktif",
  "berlaku_sampai", "kadaluarsa",
];

function isUnixTimestamp(key: string, value: unknown): boolean {
  if (typeof value !== "number") return false;
  const lower = key.toLowerCase();
  const isTimestampKey = TIMESTAMP_KEYS.some((k) => lower.includes(k));
  const isReasonableTimestamp = value > 1_000_000_000 && value < 9_999_999_999;
  return isTimestampKey && isReasonableTimestamp;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}/${mo}/${y} ${h}:${mi}:${s}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { msisdn } = useLocalSearchParams<{ msisdn: string }>();

  const [pulsaData, setPulsaData] = useState<PulsaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maskedNumber = msisdn
    ? `${msisdn.slice(0, 4)} ${msisdn.slice(4, 8)} ${msisdn.slice(8)}`
    : "";

  const handleCekPulsa = async () => {
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${BASE_URL}/cek_pulsa?msisdn=${msisdn}`);
      const data = await res.json();
      if (res.ok) {
        setPulsaData(data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(data.message || "Gagal mengambil info pulsa.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.replace("/");
  };

  const renderValue = (key: string, value: unknown): string => {
    if (isUnixTimestamp(key, value)) {
      return formatTimestamp(value as number);
    }
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toLocaleString("id-ID");
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const styles = makeStyles(colors, insets);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Selamat Datang</Text>
          <Text style={styles.phoneDisplay}>{maskedNumber}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={handleLogout}
          testID="button-logout"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        {/* XD Logo */}
        <View style={styles.xdBadge}>
          <Text style={styles.xdText}>XD</Text>
        </View>

        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name="sim" size={28} color={colors.primaryForeground} />
        </View>
        <Text style={styles.heroLabel}>Nomor Aktif</Text>
        <Text style={styles.heroPhone}>{msisdn}</Text>
        {pulsaData && (
          <View style={styles.heroStatus}>
            <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
            <Text style={styles.heroStatusText}>Data berhasil diambil</Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.cekButton,
          loading && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleCekPulsa}
        disabled={loading}
        testID="button-cek-pulsa"
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <>
            <Ionicons name="wifi" size={20} color={colors.primaryForeground} />
            <Text style={styles.cekButtonText}>
              {pulsaData ? "Perbarui Info" : "Cek Pulsa"}
            </Text>
          </>
        )}
      </Pressable>

      {!!error && (
        <View style={styles.errorCard} testID="text-pulsa-error">
          <Ionicons name="alert-circle-outline" size={18} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {pulsaData && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Informasi Pulsa</Text>
          {Object.entries(pulsaData)
            .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
            .map(([key, value]) => (
              <View key={key} style={styles.resultRow}>
                <Text style={styles.resultKey}>{formatKey(key)}</Text>
                <Text style={[
                  styles.resultValue,
                  isUnixTimestamp(key, value) && styles.resultValueDate,
                ]}>
                  {renderValue(key, value)}
                </Text>
              </View>
            ))}
          {Object.entries(pulsaData)
            .filter(([, v]) => v !== null && v !== undefined && typeof v === "object")
            .map(([key, value]) => (
              <View key={key}>
                <Text style={styles.resultSubTitle}>{formatKey(key)}</Text>
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                  <View key={k} style={styles.resultRow}>
                    <Text style={styles.resultKey}>{formatKey(k)}</Text>
                    <Text style={[
                      styles.resultValue,
                      isUnixTimestamp(k, v) && styles.resultValueDate,
                    ]}>
                      {renderValue(k, v)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
        </View>
      )}

      {!pulsaData && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={40} color={colors.border} />
          <Text style={styles.emptyTitle}>Belum ada data</Text>
          <Text style={styles.emptySubtitle}>
            Tekan tombol di atas untuk mengecek informasi pulsa Anda
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (
  colors: ReturnType<typeof useColors>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: 20,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    greeting: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    phoneDisplay: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginTop: 2,
    },
    logoutBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    xdBadge: {
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    xdText: {
      fontSize: 20,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      letterSpacing: 2,
    },
    heroIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    heroLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
      marginBottom: 4,
    },
    heroPhone: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
    },
    heroStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    heroStatusText: {
      fontSize: 12,
      color: "#FFFFFF",
      fontFamily: "Inter_500Medium",
      fontWeight: "500" as const,
    },
    cekButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonPressed: { opacity: 0.85 },
    cekButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#FEF2F2",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 16,
    },
    resultSubTitle: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      marginTop: 12,
      marginBottom: 8,
    },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultKey: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },
    resultValue: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      textAlign: "right",
      flex: 1,
    },
    resultValueDate: {
      color: colors.primary,
      fontSize: 12,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      paddingHorizontal: 24,
      lineHeight: 20,
    },
  });
