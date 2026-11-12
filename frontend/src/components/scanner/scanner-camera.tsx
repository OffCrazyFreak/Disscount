"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Banner } from "@/components/custom/common/banner";
import { Button } from "@/components/ui/button";
import {
  clearPreferredCamera,
  getPreferredCamera,
  setPreferredCamera,
} from "@/utils/browser/local-storage";
import {
  describeScannerError,
  pickBackCamera,
  type ScannerErrorKey,
} from "@/utils/browser/camera";
import type { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import CameraView from "@/components/scanner/camera-view";
import CameraSelect from "@/components/scanner/camera-select";
import ScanImageButton from "@/components/scanner/scan-image";
import { playBeep, prepareBeep } from "@/components/scanner/scan-beep";
import useCameraDevices from "@/components/scanner/hooks/use-camera-devices";
import useScanConsensus from "@/components/scanner/hooks/use-scan-consensus";

interface IScannerCameraProps {
  preset: ScanPreset;
  canType: boolean;
  onCodes: (codes: IScannedCode[]) => void;
  onManual: () => void;
}

export default function ScannerCamera({
  preset,
  canType,
  onCodes,
  onManual,
}: IScannerCameraProps) {
  const t = useTranslations("scanner");
  const { devices, refreshDevices } = useCameraDevices();

  function handleStable(codes: IScannedCode[]) {
    playBeep();
    onCodes(codes);
  }

  const { handleDetected, showHint } = useScanConsensus({
    preset,
    onStable: handleStable,
  });
  const [manualDeviceId, setManualDeviceId] = useState<string | undefined>(() =>
    getPreferredCamera(),
  );
  const [error, setError] = useState<ScannerErrorKey | null>(null);

  const activeDeviceId = manualDeviceId ?? pickBackCamera(devices) ?? undefined;
  const hasManualChoice = Boolean(manualDeviceId);

  useEffect(() => {
    prepareBeep();
  }, []);

  function handleSelect(deviceId: string) {
    setManualDeviceId(deviceId);
    setPreferredCamera(deviceId);
    setError(null);
  }

  function handleReset() {
    setManualDeviceId(undefined);
    clearPreferredCamera();
    setError(null);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Banner
          role="alert"
          variant="warningSoft"
          size="md"
          icon={TriangleAlert}
          className="mb-0"
        >
          {t(`errors.${error}`)}
        </Banner>
      ) : (
        <CameraView
          preset={preset}
          deviceId={activeDeviceId}
          onDetect={handleDetected}
          onError={(err) => setError(describeScannerError(err))}
          onCameraReady={refreshDevices}
        />
      )}

      {showHint && (
        <div
          role="status"
          className="bg-muted flex flex-col gap-2 rounded-lg p-3 text-sm"
        >
          <p>{t("camera.hint")}</p>
          {canType && (
            <Button type="button" variant="outline" onClick={onManual}>
              {t("camera.manual")}
            </Button>
          )}
        </div>
      )}

      <CameraSelect
        devices={devices}
        value={activeDeviceId}
        hasManualChoice={hasManualChoice}
        onSelect={handleSelect}
        onReset={handleReset}
      />

      <ScanImageButton preset={preset} onCodes={onCodes} />
    </div>
  );
}
