import { ActivityIndicator, Pressable, Text } from "react-native";

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}

export function Button({ onPress, disabled, loading, children, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        "w-full items-center justify-center rounded-2xl py-4",
        isPrimary ? "bg-charcoal" : "bg-transparent",
        disabled || loading ? "opacity-50" : "active:opacity-80",
      ].join(" ")}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#F5F0EB" : "#1A1A1A"} />
      ) : (
        <Text
          className={[
            "text-[15px] font-semibold",
            isPrimary ? "text-sand" : "text-charcoal",
          ].join(" ")}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
