import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { SelectOption } from "@/api";

type OptionSelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function OptionSelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: OptionSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View>
      <RequiredLabel>{label}</RequiredLabel>
      <Pressable
        className={`h-[45px] flex-row items-center justify-between rounded-xl border border-[#9A9A9A] px-4 ${
          disabled ? "opacity-60" : ""
        }`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`mr-3 flex-1 font-jakarta text-[13px] ${
            selectedOption ? "text-[#171819]" : "text-[#8D8D8D]"
          }`}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#777873" />
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setIsOpen(false)}
        >
          <Pressable className="max-h-[420px] rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 h-1 w-12 self-center rounded-full bg-[#D9D9D9]" />
            <Text className="mb-3 font-jakarta-bold text-[16px] text-[#171819]">
              {label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  className="flex-row items-center justify-between border-b border-[#F0F0F0] py-4"
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text className="font-jakarta text-[14px] text-[#171819]">
                    {option.label}
                  </Text>
                  {value === option.value ? (
                    <Ionicons name="checkmark" size={20} color="#211C1D" />
                  ) : null}
                </Pressable>
              ))}

              {options.length === 0 ? (
                <View className="h-24 items-center justify-center">
                  <Text className="font-jakarta text-[12px] text-[#777873]">
                    No options available.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
      {children}
      <Text className="text-[#D71920]">*</Text>
    </Text>
  );
}
