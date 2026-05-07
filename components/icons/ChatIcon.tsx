import Svg, { Circle, Path } from "react-native-svg";
import type { IconProps } from "./types";

export function ChatIcon({
  color = "#777873",
  fillColor = "#FFFFFF",
  size = 28,
}: IconProps & { fillColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M16.1818 4H11.8182C6.39575 4 2 8.45359 2 13.9474C2 16.8934 3.26409 19.5404 5.27273 21.3618L4.63203 23.4986C4.42209 24.1987 5.00973 24.8802 5.73313 24.7755L7.54313 24.5135C10.3895 24.1015 13.2618 23.8947 16.1378 23.8947H16.1818C21.6042 23.8947 26 19.4411 26 13.9474C26 8.45359 21.6042 4 16.1818 4Z"
        fill={fillColor}
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={9} cy={14} r={1} fill={color} stroke={color} />
      <Circle cx={14} cy={14} r={1} fill={color} stroke={color} />
      <Circle cx={19} cy={14} r={1} fill={color} stroke={color} />
    </Svg>
  );
}
