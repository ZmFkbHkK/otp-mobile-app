import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const BASE_URL = "https://yudibulat.kuota-zone.me/api";
const OTP_LENGTH = 6;

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { msisdn } = useLocalSearchParams<{ msisdn: string }>();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const maskedNumber = msisdn
    ? `${msisdn.slice(0, 5)}****${msisdn.slice(-3)}`
    : "";

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleLogin = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(
        `${BASE_URL}/otp/login?msisdn=${msisdn}&otp=${otp}`
      );
      const data = await res.json();
      if (
        res.ok ||
        data.status === "success" ||
        data.token ||
        data.message?.toLowerCase().includes("berhasil")
      ) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({ pathname: "/dashboard", params: { msisdn } });
      } else {
        setError(data.message || "Kode OTP tidak valid. Coba lagi.");
        setOtp("");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setOtp("");
    try {
      await fetch(`${BASE_URL}/otp/request?msisdn=${msisdn}`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Gagal mengirim ulang OTP.");
    } finally {
      setResending(false);
    }
  };

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? "");
  const styles = makeStyles(colors, insets);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.backBtn} onPress={() => router.back()} testID="button-back">
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={36} color={colors.primaryForeground} />
        </View>
        <Text style={styles.title}>Verifikasi OTP</Text>
        <Text style={styles.subtitle}>
          Masukkan kode 6 digit yang dikirim ke{"\n"}
          <Text style={styles.phone}>{maskedNumber}</Text>
        </Text>
      </View>

      <TouchableWithoutFeedback onPress={focusInput}>
        <View style={styles.card}>
          <View style={styles.otpWrapper}>
            {/* Hidden real TextInput — positioned off-screen with real dimensions */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(t) => {
                const clean = t.replace(/\D/g, "").slice(0, OTP_LENGTH);
                setOtp(clean);
                setError("");
                if (clean.length === OTP_LENGTH) {
                  setTimeout(() => {
                    handleLogin();
                  }, 100);
                }
              }}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              style={styles.hiddenInput}
              autoFocus
              caretHidden
              showSoftInputOnFocus
              testID="input-otp"
            />

            {/* Visual OTP digit boxes */}
            <Pressable onPress={focusInput} style={styles.otpRow}>
              {digits.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    otp.length === i && styles.otpBoxActive,
                    !!d && styles.otpBoxFilled,
                    !!error && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{d ? "●" : ""}</Text>
                </View>
              ))}
            </Pressable>
          </View>

          {!!error && (
            <Text style={styles.errorText} testID="text-otp-error">
              {error}
            </Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (otp.length !== OTP_LENGTH || loading) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogin}
            disabled={otp.length !== OTP_LENGTH || loading}
            testID="button-verify-otp"
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verifikasi</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryForeground} />
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending}
            testID="button-resend-otp"
          >
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.resendText}>Kirim ulang OTP</Text>
            )}
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const makeStyles = (
  colors: ReturnType<typeof useColors>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
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
    },
    phone: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600" as const,
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
    otpWrapper: {
      marginBottom: 16,
    },
    hiddenInput: {
      position: "absolute",
      width: "100%",
      height: 54,
      opacity: 0,
      zIndex: 1,
    },
    otpRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    otpBox: {
      width: 46,
      height: 54,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    otpBoxActive: {
      borderColor: colors.primary,
      backgroundColor: colors.accent,
    },
    otpBoxFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.accent,
    },
    otpBoxError: { borderColor: colors.destructive },
    otpDigit: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    errorText: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginBottom: 8,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
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
    resendBtn: {
      marginTop: 16,
      alignItems: "center",
      padding: 8,
    },
    resendText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
      fontWeight: "500" as const,
    },
  });
