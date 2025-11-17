import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, QrCode, Copy, Loader2 } from "lucide-react";
import { useInvoices, useCreateInvoice } from "@/lib/api-hooks";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

export default function Invoices() {
  const walletAddress = localStorage.getItem("ton_wallet_address") || "";
  const { data: invoices = [], isLoading, error } = useInvoices(walletAddress);
  const createInvoice = useCreateInvoice();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payerAddress, setPayerAddress] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const { toast } = useToast();
  const { scanQrCode } = useQrScanner();

  const handleScanQr = () => {
    scanQrCode((qrData) => {
      // Validate if it looks like a TON address
      if (qrData.match(/^[UEk][Qf][A-Za-z0-9_-]{46}$/)) {
        setPayerAddress(qrData);
        toast({
          title: "Address Scanned",
          description: "Payer wallet address added successfully",
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
    }, { text: "Scan payer's wallet QR code" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createInvoice.mutateAsync({
        title,
        amount: String(amount),
        description: description || null,
        fromAddress: walletAddress,
        toAddress: payerAddress || null,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      toast({
        title: "Invoice Created!",
        description: `${title} has been created successfully.`,
      });

      setTitle("");
      setAmount("");
      setDescription("");
      setPayerAddress("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create invoice",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyInvoiceLink = (id: string) => {
    navigator.clipboard.writeText(`https://tonpay.app/invoice/${id}`);
    toast({
      title: "Link Copied",
      description: "Invoice payment link copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
            Invoices
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Create and manage payment requests
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-create-invoice">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Request payment from a customer
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-title">Invoice Title</Label>
                <Input
                  id="invoice-title"
                  placeholder="Service or product name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  data-testid="input-invoice-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-amount">Amount (TON)</Label>
                <Input
                  id="invoice-amount"
                  type="number"
                  step="0.1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  data-testid="input-invoice-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-description">Description</Label>
                <Textarea
                  id="invoice-description"
                  placeholder="What is this invoice for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-invoice-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-address">Payer Address (Optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="payer-address"
                      placeholder="Leave empty for anyone to pay"
                      value={payerAddress}
                      onChange={(e) => setPayerAddress(e.target.value)}
                      className="font-mono"
                      data-testid="input-payer-address"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleScanQr}
                    data-testid="button-scan-qr-payer"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Specify a payer to restrict who can pay this invoice
                </p>
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-invoice">
                Create Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center text-destructive">
            Failed to load invoices. Please try again.
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Receipt}
              title="No Invoices Yet"
              description="Create your first invoice to request payment from customers or clients."
              actionLabel="Create Invoice"
              onAction={() => setOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover-elevate" data-testid={`card-invoice-${invoice.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{invoice.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {invoice.dueDate && `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-mono font-semibold text-2xl">{invoice.amount} TON</span>
                </div>
                {invoice.description && (
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => setShowQR(invoice.id)}
                    data-testid={`button-show-qr-${invoice.id}`}
                  >
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => copyInvoiceLink(invoice.id)}
                    data-testid={`button-copy-link-${invoice.id}`}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to pay the invoice
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-md">
              <QRCodeSVG
                value={`https://tonpay.app/invoice/${showQR}`}
                size={256}
                level="H"
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => copyInvoiceLink(showQR!)}
              data-testid="button-copy-qr-link"
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
