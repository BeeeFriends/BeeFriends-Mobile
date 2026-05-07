import Svg, { Path } from "react-native-svg";
import type { IconProps } from "./types";

export function PersonIcon({
  color = "#252D36",
  fillColor = "none",
  size = 28,
}: IconProps & { fillColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M20 9C20 12.3137 17.3137 15 14 15C10.6863 15 8 12.3137 8 9C8 5.68629 10.6863 3 14 3C17.3137 3 20 5.68629 20 9Z"
        fill={fillColor}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M15.1253 15H12.8747C8.52564 15 5 18.5256 5 22.8747C5 23.1657 5.10603 23.4511 5.3542 23.603C6.30933 24.1879 8.88071 25 14 25C19.1193 25 21.6907 24.1879 22.6458 23.603C22.894 23.4511 23 23.1657 23 22.8747C23 18.5256 19.4744 15 15.1253 15Z"
        fill={fillColor}
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
