import { cssInterop } from "nativewind";
import * as React from "react";
import Svg, { SvgProps } from "react-native-svg";

// Agar bisa pakai className di komponen Svg
cssInterop(Svg, {
  className: {
    target: "style",
  },
});

const PersonIcon = ({
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
        d="M14 1C18.2526 1 21.7 4.39517 21.7 8.58333C21.7 11.0422 20.5104 13.2259 18.6686 14.6115C22.3674 15.9793 25 19.4939 25 23.6146C24.9999 24.1566 24.796 24.8985 24.0848 25.3274C22.7718 26.1191 19.6942 27 14 27C8.30582 27 5.22821 26.1191 3.91523 25.3274C3.20401 24.8985 3.00007 24.1566 3 23.6146C3 19.4943 5.63201 15.9795 9.33037 14.6115C7.48895 13.2258 6.3 11.0419 6.3 8.58333C6.3 4.39517 9.74741 1 14 1ZM12.7625 16.1667C8.60598 16.1667 5.23325 19.4693 5.20107 23.5553C6.12721 24.0425 8.71943 24.8333 14 24.8333C19.279 24.8333 21.871 24.0425 22.7979 23.5553C22.7657 19.4693 19.394 16.1667 15.2375 16.1667H12.7625ZM14 3.16667C10.9624 3.16667 8.5 5.59179 8.5 8.58333C8.5 11.5749 10.9624 14 14 14C17.0376 14 19.5 11.5749 19.5 8.58333C19.5 5.59179 17.0376 3.16667 14 3.16667Z"
        fill="currentColor"
      />
    </svg>
  </Svg>
);

export default PersonIcon;
