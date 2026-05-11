import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginAccount } from "../lib/api/auth";
import { saveAuthSession } from "../lib/auth/session";
import { goBackOrReplace } from "../lib/navigation/back";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Could not log in. Try again.";
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    let hasError = false;

    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    if (!trimmedEmail) {
      setEmailError("Please enter your Binusian email.");
      hasError = true;
    } else if (!trimmedEmail.endsWith("@binus.ac.id")) {
      setEmailError("Email must use @binus.ac.id.");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      const session = await loginAccount(trimmedEmail, password);
      await saveAuthSession(session);
      router.replace("/home");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior="translate-with-padding"
        className="mx-auto w-full max-w-[430px] flex-1 bg-white"
      >
        <View className="flex-1 px-5 pb-8 pt-7">
          <Pressable
            className="h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => goBackOrReplace("/")}
          >
            <Ionicons name="arrow-back" size={24} color="#171819" />
          </Pressable>

          <View className="mt-8">
            <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
              Glad to see you again!
            </Text>
            <Text className="mt-2 font-jakarta text-[12px] leading-4 text-[#777873]">
              Let&apos;s sign you back in!
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <View>
              <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
                Binusian email
              </Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError("");
                  setSubmitError("");
                }}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="example@binus.ac.id"
                placeholderTextColor="#8D8D8D"
                className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
                  emailError ? "border-[#D71920]" : "border-[#9A9A9A]"
                }`}
              />
              <ErrorMessage message={emailError} />
            </View>

            <View>
              <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordError("");
                  setSubmitError("");
                }}
                secureTextEntry
                placeholder="Enter your password"
                placeholderTextColor="#8D8D8D"
                className={`h-[45px] rounded-xl border px-4 font-jakarta text-[13px] text-[#171819] ${
                  passwordError ? "border-[#D71920]" : "border-[#9A9A9A]"
                }`}
              />
              <ErrorMessage message={passwordError} />
            </View>
          </View>

          <Pressable
            className={`mt-7 h-[46px] items-center justify-center rounded-full bg-[#FFDD2D] ${
              isSubmitting ? "opacity-60" : ""
            }`}
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleLogin}
          >
            <Text className="font-jakarta-bold text-[14px] text-[#171819]">
              {isSubmitting ? "Logging In..." : "Log In"}
            </Text>
          </Pressable>
          <ErrorMessage message={submitError} />

          <View className="mt-4 flex-row justify-center">
            <Text className="font-jakarta text-[11px] text-[#171819]">
              Don&apos;t have an account?{" "}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/register")}
            >
              <Text className="font-jakarta-bold text-[11px] text-[#171819]">
                Register here
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text className="mt-2 font-jakarta text-[10px] leading-3 text-[#D71920]">
      {message}
    </Text>
  );
}
