import { StatCard } from "@/components/stat-card";
import { TransactionItem } from "@/components/transaction-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Clock, Receipt, TrendingUp, Send, Plus, FileText, Split, Loader2, QrCode, Camera } from "lucide-react";
import { Link } from "wouter";
import { useWallet, useTransactions, useBills, useInvoices, useTonPrice } from "@/lib/api-hooks";
import { formatDistanceToNow } from "date-fns";
import { useState, useCallback } from "react";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { useToast } from "@/hooks/use-toast";
import { QrCodeComponent } from "@/components/qr-code-component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const walletAddress = localStorage.getItem("ton_wallet_address") || "";
  const { data: wallet, isLoading: walletLoading } = useWallet(walletAddress);
  const { data: transactions = [], isLoading: txLoading } = useTransactions(walletAddress);
  const { data: bills = [], isLoading: billsLoading } = useBills(walletAddress);
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(walletAddress);
  const { data: tonPrice } = useTonPrice();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const { scanQrCode, isScanning } = useQrScanner();
  const { toast } = useToast();

  const recentTransactions = transactions.slice(0, 3).map(tx => ({
    id: tx.id,
    type: tx.type,
    description: tx.description || "No description",
    amount: tx.amount,
    status: tx.status,
    timestamp: formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true }),
  }));

  const totalBillsAmount = bills
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

  const totalInvoicesAmount = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);

  const thisMonthTransactions = transactions
    .filter(tx => tx.status === 'confirmed')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const balance = wallet ? parseFloat(wallet.balance) : 0;
  const usdBalance = tonPrice && wallet ? (parseFloat(wallet.balance) * tonPrice.usd).toFixed(2) : "0.00";

  const handleScanQr = useCallback(() => {
    setShowQrScanner(true);
  }, []);

  const handleQrScanResult = useCallback((qrData: string) => {
    // Validate if it looks like a TON address
    if (qrData.match(/^[UEk][Qf][A-Za-z0-9_-]{46}$/)) {
      // Navigate to send payment with the scanned address
      window.location.href = `/send?address=${encodeURIComponent(qrData)}`;
      toast({
        title: "Address Scanned",
        description: "Opening send payment with scanned address",
      });
      setShowQrScanner(false);
      return true; // Close scanner
    } else if (qrData.startsWith('https://tonpay.app/pay/')) {
      // Handle payment links
      const address = qrData.split('/').pop();
      if (address) {
        window.location.href = `/send?address=${encodeURIComponent(address)}`;
        toast({
          title: "Payment Link Scanned",
          description: "Opening send payment with payment link",
        });
        setShowQrScanner(false);
        return true;
      }
    } else {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid TON wallet address or payment link",
        variant: "destructive",
      });
      return false; // Keep scanner open
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Welcome to your TON payment hub
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={walletLoading ? "..." : balance.toFixed(1)}
          subtitle={`≈ $${usdBalance} USD`}
          icon={Wallet}
          trend={{ value: "12.5%", positive: true }}
        />
        <StatCard
          title="Pending Bills"
          value={billsLoading ? "..." : bills.filter(b => b.status === 'active').length.toString()}
          subtitle={`${totalBillsAmount.toFixed(1)} TON total`}
          icon={Clock}
        />
        <StatCard
          title="Active Invoices"
          value={invoicesLoading ? "..." : invoices.filter(i => i.status === 'pending').length.toString()}
          subtitle={`${totalInvoicesAmount.toFixed(1)} TON pending`}
          icon={Receipt}
        />
        <StatCard
          title="This Month"
          value={txLoading ? "..." : thisMonthTransactions.toFixed(1)}
          subtitle="TON transacted"
          icon={TrendingUp}
          trend={{ value: "8.1%", positive: true }}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/send">
          <Button className="w-full gap-2 h-auto py-4 min-h-[60px]" data-testid="button-quick-send">
            <Send className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Send Payment</div>
              <div className="text-xs font-normal opacity-90">Transfer TON instantly</div>
            </div>
          </Button>
        </Link>
        <Button 
          variant="outline" 
          className="w-full gap-2 h-auto py-4 min-h-[60px]" 
          onClick={handleScanQr}
          disabled={isScanning}
          data-testid="button-quick-scan"
        >
          <Camera className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Scan QR</div>
            <div className="text-xs font-normal opacity-70">Scan to pay</div>
          </div>
        </Button>
        <Link href="/invoices">
          <Button variant="outline" className="w-full gap-2 h-auto py-4 min-h-[60px]" data-testid="button-quick-invoice">
            <FileText className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Create Invoice</div>
              <div className="text-xs font-normal opacity-70">Request payment</div>
            </div>
          </Button>
        </Link>
        <Link href="/bills">
          <Button variant="outline" className="w-full gap-2 h-auto py-4 min-h-[60px]" data-testid="button-quick-split">
            <Split className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Split Bill</div>
              <div className="text-xs font-normal opacity-70">Share expenses</div>
            </div>
          </Button>
        </Link>
        <Link href="/merchant">
          <Button variant="outline" className="w-full gap-2 h-auto py-4 min-h-[60px]" data-testid="button-quick-merchant">
            <Plus className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Merchant Link</div>
              <div className="text-xs font-normal opacity-70">Accept payments</div>
            </div>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest payment activity</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" data-testid="button-view-all-transactions">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {txLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} {...tx} />
            ))
          )}
        </CardContent>
      </Card>

      {/* QR Code Scanner Dialog */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan a TON wallet address or payment link to send payment
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
    </div>
  );
}
