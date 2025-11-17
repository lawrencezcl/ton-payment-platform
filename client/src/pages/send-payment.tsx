import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, User, QrCode, Camera, Upload, Copy, Check } from "lucide-react";
import { useCreateTransaction, useTonPrice } from "@/lib/api-hooks";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { QrCodeComponent } from "@/components/qr-code-component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SendPayment() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { toast } = useToast();
  const createTransaction = useCreateTransaction();
  const { data: tonPrice, isLoading: isPriceLoading } = useTonPrice();
  const { scanQrCode, isScanning } = useQrScanner();

  const walletAddress = localStorage.getItem("ton_wallet_address") || "UQA...";
  const usdValue = amount && tonPrice ? (parseFloat(amount) * tonPrice.usd).toFixed(2) : "0.00";

  const handleScanQr = useCallback(() => {
    setShowQrScanner(true);
  }, []);

  const handleQrScanResult = useCallback((qrData: string) => {
    // Validate if it looks like a TON address
    if (qrData.match(/^[UEk][Qf][A-Za-z0-9_-]{46}$/)) {
      setAddress(qrData);
      toast({
        title: "Address Scanned",
        description: "Wallet address added successfully",
      });
      setShowQrScanner(false);
      return true; // Close scanner
    } else {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid TON wallet address",
        variant: "destructive",
      });
      return false; // Keep scanner open
    }
  }, [toast]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generatePaymentQr = useCallback(() => {
    if (!address || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipient address and amount",
        variant: "destructive",
      });
      return;
    }
    setShowPaymentQr(true);
  }, [address, amount, toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTransaction.mutateAsync({
        fromAddress: walletAddress,
        toAddress: address,
        amount,
        type: "send",
        status: "confirmed",
        description,
      });

      toast({
        title: "Payment Sent!",
        description: `Successfully sent ${amount} TON`,
      });
      
      setAmount("");
      setAddress("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to send payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
          Send Payment
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Transfer TON to any wallet address instantly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Enter the recipient and amount</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Recipient Address</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="address"
                    placeholder="UQD..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="font-mono pr-20"
                    required
                    data-testid="input-recipient-address"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  {address && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(address)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleScanQr}
                  disabled={isScanning}
                  className="min-w-[44px] h-10"
                  data-testid="button-scan-qr-address"
                >
                  {isScanning ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setShowQrScanner(true)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Camera className="h-3 w-3" />
                  Camera Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Handle file upload for QR scanning
                        toast({
                          title: "File Selected",
                          description: "QR code analysis would be implemented here",
                        });
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Upload QR
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount (TON)</Label>
                {(address && amount) && (
                  <button
                    type="button"
                    onClick={generatePaymentQr}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <QrCode className="h-3 w-3" />
                    Generate Payment QR
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  id="amount"
                  type="number"
                  step="0.000000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-3xl font-bold font-mono h-auto py-4"
                  required
                  data-testid="input-amount"
                />
                <p className="text-sm text-muted-foreground">
                  ≈ ${usdValue} USD
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this payment for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-testid="input-description"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2 min-h-[48px]" 
              disabled={createTransaction.isPending || !amount || !address}
              data-testid="button-send-payment"
            >
              <Send className="h-4 w-4" />
              {createTransaction.isPending ? "Sending..." : "Send Payment"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Network fee: ~0.005 TON
            </p>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Scanner Dialog */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan a TON wallet address or payment QR code
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <QrCodeComponent
              value="scan-mode"
              title=""
              description="Position the QR code within the frame"
              showScan={true}
              onScan={handleQrScanResult}
              size={280}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment QR Code Dialog */}
      <Dialog open={showPaymentQr} onOpenChange={setShowPaymentQr}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code for payment
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QrCodeComponent
                value={`tonpay:${address}:${amount}:${description || 'Payment'}`}
                title=""
                description=""
                showDownload={true}
                showScan={false}
                size={280}
              />
            </div>
            <div className="text-center space-y-1 w-full">
              <p className="font-semibold text-sm">Recipient: {address.slice(0, 8)}...{address.slice(-4)}</p>
              <p className="text-2xl font-bold font-mono">{amount} TON</p>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <p className="text-xs text-muted-foreground">≈ ${usdValue} USD</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const paymentData = `tonpay:${address}:${amount}:${description || 'Payment'}`;
                  copyToClipboard(paymentData);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Data
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => copyToClipboard(`https://tonpayment-qrxo00a3v-lawrencezcls-projects.vercel.app/pay/${address}/${amount}`)}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
