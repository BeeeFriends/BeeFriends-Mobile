import { Text, TextInput, View } from "react-native";

type EditFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  multiline?: boolean;
};

export function EditField({
  label,
  value,
  onChangeText,
  onFocus,
  keyboardType,
  multiline = false,
}: EditFieldProps) {
  return (
    <View>
      <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
        {label}
      </Text>
      <TextInput
        value={value}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-2xl bg-[#F5F5F5] px-4 font-jakarta text-[14px] text-[#171819] ${
          multiline ? "min-h-[112px] py-3 leading-5" : "h-12"
        }`}
        placeholderTextColor="#8D8D8D"
        onFocus={onFocus}
        onChangeText={onChangeText}
      />
    </View>
  );
}
