import { cssInterop } from "nativewind";
import * as React from "react";
import Svg, { SvgProps } from "react-native-svg";

// Agar bisa pakai className di komponen Svg
cssInterop(Svg, {
  className: {
    target: "style",
  },
});

const CompassIcon = ({
  className,
  ...props
}: SvgProps & { className?: string }) => (
  <Svg
    width={28} // Ukuran default
    height={28}
    viewBox="0 0 28 28" // Sesuaikan dengan viewBox asli SVG Anda
    fill="none"
    className={className}
    {...props}
  >
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M18.2246 7.87695C19.3971 7.48612 20.5125 8.60193 20.1221 9.77441L18.0098 16.1123C17.7112 17.0081 17.0081 17.7112 16.1123 18.0098L9.77441 20.1221C8.60195 20.5125 7.48616 19.3971 7.87695 18.2246L9.99023 11.8867C10.289 10.9913 10.9922 10.2888 11.8877 9.99023L18.2246 7.87695ZM14 12C12.8956 12.0001 12.0002 12.8957 12 14C12.0002 15.1043 12.8957 15.9999 14 16C15.1043 15.9998 15.9998 15.1043 16 14C15.9998 12.8957 15.1043 12.0002 14 12Z"
        fill="currentColor"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14 1C21.1797 1 27 6.8203 27 14C27 21.1797 21.1797 27 14 27C6.8203 27 1 21.1797 1 14C1 6.8203 6.8203 1 14 1ZM14 3C7.92487 3 3 7.92487 3 14C3 20.0751 7.92487 25 14 25C20.0751 25 25 20.0751 25 14C25 7.92487 20.0751 3 14 3Z"
        fill="currentColor"
      />
    </svg>
  </Svg>
);

export default CompassIcon;
