import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { requestOtp, verifyOtp } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const OTP_LENGTH = 4;
const navBarHeight =
  Platform.OS === "android"
    ? Dimensions.get("screen").height - Dimensions.get("window").height
    : 0;

export function AuthSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const slideY = useRef(new Animated.Value(500)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const onHide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);
  const [error, setError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      slideY.setValue(500);
      panY.setValue(0);
      // Сброс формы после закрытия
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setDigits(Array(OTP_LENGTH).fill(""));
        setError("");
        setLoading(false);
      }, 300);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            fadeAnim.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  async function handleEmailSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const result = await requestOtp(email.trim()).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setStep("otp");
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } else {
      setError(result.message);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1) {
      const code = next.join("");
      if (code.length === OTP_LENGTH) handleOtpSubmit(code);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleOtpSubmit(code = digits.join("")) {
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    setError("");
    const result = await verifyOtp(email.trim(), code).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setAccessToken(result.accessToken);
      queryClient.invalidateQueries(); 
      onClose();
      router.replace(result.isNewUser ? "/(auth)/profile-setup" : "/(app)");
    } else {
      setError(result.message);
      setDigits(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    }
  }

  const bottomPadding =
    kbHeight > 0
      ? kbHeight - navBarHeight + 16
      : Math.max(insets.bottom, navBarHeight) + 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.45)", opacity: fadeAnim },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={{
            backgroundColor: "#F5F0EB",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY: Animated.add(slideY, panY) }],
          }}
        >
          {/* Ручка */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 16 }}
          >
            <View style={styles.handle} />
          </View>

          {/* Контент */}
          <View style={{ paddingHorizontal: 24, paddingBottom: bottomPadding }}>
            {step === "email" ? (
              <>
                <Text style={styles.title}>Войти в selte</Text>
                <Text style={styles.sub}>Введите email — пришлём код</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Введите ваш email"
                  placeholderTextColor="#8A8278"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleEmailSubmit}
                  style={styles.input}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
                <Pressable
                  style={styles.btn}
                  onPress={handleEmailSubmit}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>
                    {loading ? "Отправка..." : "Отправить код"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.title}>Введите код</Text>
                <Text style={styles.sub}>Отправили код на {email}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 8,
                    justifyContent: "center",
                  }}
                >
                  {digits.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={digit}
                      onChangeText={(v) => handleDigitChange(i, v)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(i, nativeEvent.key)
                      }
                      maxLength={1}
                      keyboardType="number-pad"
                      textAlign="center"
                      style={styles.otpInput}
                    />
                  ))}
                </View>
                {!!error && <Text style={styles.error}>{error}</Text>}
                <Pressable
                  style={styles.btn}
                  onPress={() => handleOtpSubmit()}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>
                    {loading ? "Проверка..." : "Войти"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setStep("email");
                    setError("");
                    setDigits(Array(OTP_LENGTH).fill(""));
                  }}
                  style={{ alignItems: "center", marginTop: 14 }}
                >
                  <Text style={{ fontSize: 13, color: "#8A8278" }}>
                    ← Изменить email
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D4C9BE" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: "#8A8278",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#EDE8E2",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  otpInput: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: "#EDE8E2",
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  error: {
    fontSize: 13,
    color: "#E05252",
    marginBottom: 12,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#E46D41",
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
