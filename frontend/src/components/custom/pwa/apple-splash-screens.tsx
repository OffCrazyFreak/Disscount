import splashScreens from "@/constants/ios-splash-screens.json";

// iOS ignores the manifest for launch screens, so it needs per-device link tags.
export default function AppleSplashScreens() {
  return (
    <>
      {splashScreens.map((device) => {
        const pxWidth = device.width * device.ratio;
        const pxHeight = device.height * device.ratio;

        return (
          <link
            key={`${pxWidth}x${pxHeight}`}
            rel="apple-touch-startup-image"
            href={`/splash/apple-splash-${pxWidth}-${pxHeight}.png`}
            media={`screen and (device-width: ${device.width}px) and (device-height: ${device.height}px) and (-webkit-device-pixel-ratio: ${device.ratio}) and (orientation: portrait)`}
          />
        );
      })}
    </>
  );
}
