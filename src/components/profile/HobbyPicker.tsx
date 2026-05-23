import { Pressable, Text, View } from "react-native";

import type { SelectOption } from "@/api";

type HobbyPickerProps = {
  options: SelectOption[];
  selectedValues: string[];
  maxSelected: number;
  disabled?: boolean;
  onToggle: (value: string) => void;
};

export function HobbyPicker({
  options,
  selectedValues,
  maxSelected,
  disabled,
  onToggle,
}: HobbyPickerProps) {
  const isSelectionFull = selectedValues.length >= maxSelected;

  return (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {disabled ? (
        <Text className="font-jakarta text-[12px] text-[#777873]">
          Loading interests...
        </Text>
      ) : options.length === 0 ? (
        <Text className="font-jakarta text-[12px] text-[#777873]">
          No interests available.
        </Text>
      ) : (
        options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const isOverLimitOption = isSelectionFull && !isSelected;

          return (
            <Pressable
              key={option.value}
              className={`h-[34px] items-center justify-center rounded-full border px-4 ${
                isSelected
                  ? "border-[#211C1D] bg-[#211C1D]"
                  : "border-[#211C1D] bg-white"
              } ${isOverLimitOption ? "opacity-45" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onToggle(option.value)}
            >
              <Text
                className={`font-jakarta-semibold text-[12px] ${
                  isSelected ? "text-white" : "text-[#171819]"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
