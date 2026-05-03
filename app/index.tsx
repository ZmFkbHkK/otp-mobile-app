import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const BASE_URL = "https://yudibulat.kuota-zone.me/api";

export default function PhoneScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [msisdn, setMsisdn] = useState("628");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = msisdn.startsWith("628") && msisdn.length >= 10;

  const handleSendOtp = async () => {
    if (!isValid) {
      setError("Masukkan nomor yang valid (contoh: 62812xxxxxxx)");
      return;
    }
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${BASE_URL}/otp/request?msisdn=${msisdn}`);
      const data = await res.json();
      if (res.ok || data.status === "success" || data.message) {
        router.push({ pathname: "/otp", params: { msisdn } });
      } else {
        setError(data.message || "Gagal mengirim OTP. Coba lagi.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={36} color={colors.primaryForeground} />
          </View>
          <Text style={styles.title}>Masuk ke Akun</Text>
          <Text style={styles.subtitle}>
            Masukkan nomor HP Anda untuk menerima kode OTP
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nomor Handphone</Text>
          <View style={[styles.inputRow, error ? styles.inputError : null]}>
            <Ionicons name="call-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={msisdn}
              onChangeText={(t) => {
                setMsisdn(t);
                setError("");
              }}
              placeholder="628xxxxxxxxx"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              maxLength={15}
              testID="input-msisdn"
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>
          {!!error && (
            <Text style={styles.errorText} testID="text-error">
              {error}
            </Text>
          )}

          <Text style={styles.hint}>
            Format: 628 diikuti nomor HP (contoh: 62812xxxxxxx)
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!isValid || loading) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSendOtp}
            disabled={!isValid || loading}
            testID="button-send-otp"
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Kirim OTP</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Dengan melanjutkan, Anda menyetujui syarat dan ketentuan layanan
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
    },
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    title: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    label: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      marginBottom: 8,
    },
    inputError: { borderColor: colors.destructive },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    errorText: {
      fontSize: 12,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
      marginBottom: 4,
    },
    hint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 20,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonPressed: { opacity: 0.85 },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 24,
      lineHeight: 18,
      paddingHorizontal: 16,
    },
  });
