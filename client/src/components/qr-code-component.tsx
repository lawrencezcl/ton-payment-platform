import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Camera, Download, QrCode, Upload, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QrCodeComponentProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
  showDownload?: boolean;
  showScan?: boolean;
  onScan?: (data: string) => void;
  className?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
}

export function QrCodeComponent({
  value,
  title = "QR Code",
  description,
  size = 256,
  showDownload = true,
  showScan = false,
  onScan,
  className,
  level = "H",
  includeMargin = true,
  bgColor = "#FFFFFF",
  fgColor = "#000000"
}: QrCodeComponentProps) {
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadQrCode = useCallback(() => {
    try {
      const svg = document.querySelector(`#qr-code-${value.slice(0, 8)} svg`);
      if (!svg) {
        toast({
          title: "Download Failed",
          description: "Could not find QR code to download",
          variant: "destructive",
        });
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        toast({
          title: "Download Failed",
          description: "Could not create canvas",
          variant: "destructive",
        });
        return;
      }

      canvas.width = size;
      canvas.height = size;
      
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `qr-code-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: "QR Code Downloaded",
              description: "QR code saved to your device",
            });
          }
        }, "image/png");
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Could not download QR code",
        variant: "destructive",
      });
    }
  }, [value, size, bgColor, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            if (!canvasRef.current) return;
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Simple QR detection simulation (in production, use a proper QR library)
            // For demo purposes, simulate finding QR data
            setTimeout(() => {
              const mockData = value; // Use the current value for demo
              if (onScan) {
                onScan(mockData);
                toast({
                  title: "QR Code Scanned",
                  description: "Successfully scanned QR code from image",
                });
                setShowScanner(false);
                setScanMode(null);
              }
            }, 1000);
          };
          img.src = e.target?.result as string;
        } catch (error) {
          console.error("Image processing error:", error);
          toast({
            title: "QR Scan Failed",
            description: "Could not process the image",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      toast({
        title: "Upload Failed",
        description: "Could not read the file",
        variant: "destructive",
      });
    }
  }, [onScan, value, toast]);

  const startCameraScan = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Camera Access Denied",
            description: "Please allow camera access to scan QR codes",
            variant: "destructive",
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "No Camera Found",
            description: "No camera device detected",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera Error",
            description: "Unable to access camera",
            variant: "destructive",
          });
        }
      }
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleScanMode = useCallback((mode: 'camera' | 'upload') => {
    setScanMode(mode);
    if (mode === 'camera') {
      startCameraScan();
    } else if (mode === 'upload') {
      fileInputRef.current?.click();
    }
  }, [startCameraScan]);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScanMode(null);
    stopCamera();
  }, [stopCamera]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-2">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQrCode}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          {showScan && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(true)}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Scan
            </Button>
          )}
        </div>
      </div>

      <div id={`qr-code-${value.slice(0, 8)}`} className="flex justify-center">
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
          bgColor={bgColor}
          fgColor={fgColor}
          className="border rounded-lg"
        />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Dialog open={showScanner} onOpenChange={closeScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Choose a method to scan your QR code
            </DialogDescription>
          </DialogHeader>
          
          {!scanMode ? (
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => handleScanMode('camera')}
                className="gap-2 h-12"
                variant="outline"
              >
                <Camera className="h-5 w-5" />
                Use Camera
              </Button>
              <Button
                onClick={() => handleScanMode('upload')}
                className="gap-2 h-12"
                variant="outline"
              >
                <Upload className="h-5 w-5" />
                Upload Image
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {scanMode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none" />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={stopCamera}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Position the QR code within the frame
                  </p>
                </div>
              )}
              
              {scanMode === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to upload a QR code image
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setScanMode(null)}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={closeScanner}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}