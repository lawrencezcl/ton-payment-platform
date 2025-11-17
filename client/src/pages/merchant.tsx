import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Copy, QrCode, Download, Share2, Camera, Check } from "lucide-react";
import { useCreateMerchantPayment } from "@/lib/api-hooks";
import { QrCodeComponent } from "@/components/qr-code-component";
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
  const [copiedLink, setCopiedLink] = useState(false);
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

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopiedLink(true);
      toast({
        title: "Link Copied",
        description: "Payment link copied to clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }, [paymentLink, toast]);

  const sharePayment = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${merchantName} - Payment Request`,
          text: `Pay ${amount} TON to ${merchantName}`,
          url: paymentLink,
        });
      } else {
        copyLink();
      }
    } catch (error) {
      console.error('Share failed:', error);
      copyLink();
    }
  }, [paymentLink, merchantName, amount, copyLink]);

  const downloadQrCode = useCallback(() => {
    try {
      const svg = document.querySelector(`#merchant-qr svg`);
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

      canvas.width = 512;
      canvas.height = 512;
      
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payment-qr-${merchantName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: "QR Code Downloaded",
              description: "Payment QR code saved to your device",
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
  }, [merchantName, toast]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
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
              className="w-full gap-2 min-h-[48px]"
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
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2 min-h-[44px]"
                onClick={copyLink}
                data-testid="button-copy-payment-link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 min-h-[44px]"
                onClick={sharePayment}
                data-testid="button-share-payment"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2 min-h-[44px]"
                onClick={() => setShowQR(true)}
                data-testid="button-show-payment-qr"
              >
                <QrCode className="h-4 w-4" />
                Show QR
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 min-h-[44px]"
                onClick={downloadQrCode}
                data-testid="button-download-qr"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Customers can scan this code to pay
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div id="merchant-qr" className="bg-white p-4 rounded-lg">
              <QrCodeComponent
                value={paymentLink}
                title=""
                description=""
                showDownload={false}
                showScan={false}
                size={window.innerWidth < 400 ? 240 : 280}
              />
            </div>
            <div className="text-center space-y-1 w-full">
              <p className="font-semibold">{merchantName}</p>
              <p className="text-2xl font-bold font-mono">{amount} TON</p>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={copyLink}
                data-testid="button-copy-qr-merchant-link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={downloadQrCode}
                data-testid="button-download-qr-merchant"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
