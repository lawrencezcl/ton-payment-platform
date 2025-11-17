import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, User, QrCode } from "lucide-react";
import { useCreateTransaction, useTonPrice } from "@/lib/api-hooks";
import { useQrScanner } from "@/hooks/use-qr-scanner";

export default function SendPayment() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const createTransaction = useCreateTransaction();
  const { data: tonPrice, isLoading: isPriceLoading } = useTonPrice();
  const { scanQrCode } = useQrScanner();

  const walletAddress = localStorage.getItem("ton_wallet_address") || "UQA...";
  const usdValue = amount && tonPrice ? (parseFloat(amount) * tonPrice.usd).toFixed(2) : "0.00";

  const handleScanQr = () => {
    scanQrCode((qrData) => {
      // Validate if it looks like a TON address
      if (qrData.match(/^[UEk][Qf][A-Za-z0-9_-]{46}$/)) {
        setAddress(qrData);
        toast({
          title: "Address Scanned",
          description: "Wallet address added successfully",
        });
        return true; // Close scanner
      } else {
        toast({
          title: "Invalid QR Code",
          description: "Please scan a valid TON wallet address",
          variant: "destructive",
        });
        return false; // Keep scanner open
      }
    }, { text: "Scan recipient's wallet QR code" });
  };

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
                    className="font-mono pr-10"
                    required
                    data-testid="input-recipient-address"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleScanQr}
                  data-testid="button-scan-qr-address"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (TON)</Label>
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
              className="w-full gap-2" 
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
    </div>
  );
}
