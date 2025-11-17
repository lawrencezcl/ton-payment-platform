import { useCallback } from "react";
import { useTelegram } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";

export function useQrScanner() {
  const { webApp } = useTelegram();
  const { toast } = useToast();

  const scanQrCode = useCallback(
    (
      onScan: (data: string) => boolean | void,
      options?: { text?: string }
    ): void => {
      if (!webApp) {
        toast({
          title: "QR Scanner Not Available",
          description: "QR scanner is only available in Telegram Mini Apps",
          variant: "destructive",
        });
        return;
      }

      // Check if QR scanner is supported (requires Telegram Bot API 6.4+)
      if (typeof webApp.showScanQrPopup !== "function") {
        toast({
          title: "QR Scanner Not Supported",
          description: "Please update your Telegram app to use QR scanner",
          variant: "destructive",
        });
        return;
      }

      try {
        webApp.showScanQrPopup(
          {
            text: options?.text || "Scan QR Code",
          },
          (qrData: string) => {
            const result = onScan(qrData);
            // Return true to close the popup, void to keep it open
            if (result === false) {
              return; // Keep popup open
            }
            return true; // Close popup
          }
        );
      } catch (error) {
        console.error("QR scanner error:", error);
        toast({
          title: "Scanner Error",
          description: "Failed to open QR scanner",
          variant: "destructive",
        });
      }
    },
    [webApp, toast]
  );

  const closeQrScanner = useCallback(() => {
    if (webApp && typeof webApp.closeScanQrPopup === "function") {
      webApp.closeScanQrPopup();
    }
  }, [webApp]);

  return { scanQrCode, closeQrScanner };
}
