import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — MotoGT GT mark from public/motogt-logo.svg */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          borderRadius: 36,
        }}
      >
        <svg
          width="148"
          height="84"
          viewBox="428 0 218 94"
          fill="none"
        >
          <path
            d="M511.911 93.9572H438.767L428.164 80.5381L442.385 13.427L458.762 0H535.273L529.499 26.846H466.415L457.826 67.1112H504.132L505.603 60.4016H485.474L491.114 33.5556H538.089L528.154 80.5381L511.911 93.9572Z"
            fill="#CF172F"
          />
          <path
            d="M588.957 93.9572H562.111L576.34 26.846H539.292L545.066 0H646L640.226 26.846H603.186L588.957 93.9572Z"
            fill="#CF172F"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
