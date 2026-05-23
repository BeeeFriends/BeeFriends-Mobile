import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, View } from "react-native";

type EditablePhotoTileProps = {
  uri?: string;
  onPick: () => void;
  onRemove: () => void;
};

export function EditablePhotoTile({
  uri,
  onPick,
  onRemove,
}: EditablePhotoTileProps) {
  return (
    <Pressable
      className="aspect-square flex-1 overflow-hidden rounded-2xl bg-[#F1F1F1]"
      accessibilityRole="button"
      onPress={onPick}
    >
      {uri ? (
        <>
          <Image
            source={{ uri }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <Pressable
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/70"
            accessibilityRole="button"
            onPress={onRemove}
          >
            <Ionicons name="trash" size={14} color="#FFFFFF" />
          </Pressable>
        </>
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="add" size={25} color="#777873" />
        </View>
      )}
    </Pressable>
  );
}
