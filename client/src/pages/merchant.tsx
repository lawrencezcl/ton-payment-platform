import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Copy, QrCode } from "lucide-react";
import { useCreateMerchantPayment } from "@/lib/api-hooks";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Merchant() {
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const createMerchantPayment = useCreateMerchantPayment();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createMerchantPayment.mutateAsync({
        merchantName,
        amount,
        description,
        paymentLink: `https://tonpay.app/pay/${merchantName.toLowerCase().replace(/\s+/g, '-')}/${amount}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const link = `https://tonpay.app/pay/${result.id}`;
      setPaymentLink(link);
      
      toast({
        title: "Payment Link Generated!",
        description: "Your merchant payment link is ready to use.",
      });
    } catch (error) {
      toast({
        title: "Failed to generate payment link",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast({
      title: "Link Copied",
      description: "Payment link copied to clipboard.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
          Merchant Payments
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate payment links and QR codes for your business
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Payment Link</CardTitle>
          <CardDescription>
            Generate a unique payment link for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="merchant-name">Business Name</Label>
              <Input
                id="merchant-name"
                placeholder="Your Store Name"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                required
                data-testid="input-merchant-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant-amount">Amount (TON)</Label>
              <Input
                id="merchant-amount"
                type="number"
                step="0.1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                data-testid="input-merchant-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant-description">Product/Service Description</Label>
              <Textarea
                id="merchant-description"
                placeholder="What are you selling?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-testid="input-merchant-description"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2"
              disabled={createMerchantPayment.isPending}
              data-testid="button-generate-link"
            >
              <Store className="h-4 w-4" />
              {createMerchantPayment.isPending ? "Generating..." : "Generate Payment Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {paymentLink && (
        <Card>
          <CardHeader>
            <CardTitle>Your Payment Link</CardTitle>
            <CardDescription>
              Share this link with your customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md break-all font-mono text-sm" data-testid="text-payment-link">
              {paymentLink}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={copyLink}
                data-testid="button-copy-payment-link"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => setShowQR(true)}
                data-testid="button-show-payment-qr"
              >
                <QrCode className="h-4 w-4" />
                Show QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Customers can scan this code to pay
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-md">
              <QRCodeSVG
                value={paymentLink}
                size={256}
                level="H"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold">{merchantName}</p>
              <p className="text-2xl font-bold font-mono">{amount} TON</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={copyLink}
              data-testid="button-copy-qr-merchant-link"
            >
              <Copy className="h-4 w-4" />
              Copy Payment Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
