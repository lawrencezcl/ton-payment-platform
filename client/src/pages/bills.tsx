import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { Plus, Split, Users, CheckCircle, Loader2, QrCode, X } from "lucide-react";
import { useBills, useCreateBill, useBillParticipants } from "@/lib/api-hooks";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Bill } from "@shared/schema";

function BillCard({ bill, walletAddress }: { bill: Bill; walletAddress: string }) {
  const { data: participants = [], isLoading, error } = useBillParticipants(bill.id);
  
  // Find the user's participant record to get their share
  const userParticipant = participants.find(p => p.address === walletAddress);
  const share = userParticipant 
    ? parseFloat(userParticipant.share).toFixed(2) 
    : "—";
  
  return (
    <Card className="hover-elevate" data-testid={`card-bill-${bill.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{bill.title}</CardTitle>
            <CardDescription className="mt-1">
              {bill.description}
            </CardDescription>
          </div>
          <Badge variant={bill.status === "active" ? "default" : "secondary"}>
            {bill.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="font-mono font-semibold">{bill.totalAmount} TON</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Participants</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : error ? (
            <span className="text-xs text-destructive">Error</span>
          ) : (
            <span className="font-mono font-semibold">{participants.length}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Share</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="font-mono font-semibold text-primary">{share} TON</span>
          )}
        </div>
        <Button className="w-full gap-2 min-h-[48px]" variant="outline" data-testid={`button-settle-${bill.id}`}>
          <CheckCircle className="h-4 w-4" />
          Settle Up
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Bills() {
  const walletAddress = localStorage.getItem("ton_wallet_address") || "";
  const { data: bills = [], isLoading, error } = useBills(walletAddress);
  const createBill = useCreateBill();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const { toast } = useToast();
  const { scanQrCode } = useQrScanner();

  const handleScanQr = () => {
    scanQrCode((qrData) => {
      // Validate if it looks like a TON address
      if (qrData.match(/^[UEk][Qf][A-Za-z0-9_-]{46}$/)) {
        // Check if address already added
        if (participants.includes(qrData)) {
          toast({
            title: "Already Added",
            description: "This participant is already in the list",
            variant: "destructive",
          });
          return false; // Keep scanner open
        }
        
        setParticipants([...participants, qrData]);
        toast({
          title: "Participant Added",
          description: "Wallet address added to participants",
        });
        return false; // Keep scanner open for more participants
      } else {
        toast({
          title: "Invalid QR Code",
          description: "Please scan a valid TON wallet address",
          variant: "destructive",
        });
        return false; // Keep scanner open
      }
    }, { text: "Scan participant's wallet QR code" });
  };

  const removeParticipant = (address: string) => {
    setParticipants(participants.filter(p => p !== address));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalParticipants = participants.length + 1; // +1 for creator
    try {
      await createBill.mutateAsync({
        title,
        totalAmount: amount,
        description: `Split among ${totalParticipants} participants`,
        createdBy: walletAddress,
        participants, // Send participants array to API
      });

      toast({
        title: "Bill Created!",
        description: `${title} has been created successfully.`,
      });

      setTitle("");
      setAmount("");
      setParticipants([]);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create bill",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
            Bill Splitting
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Split expenses with friends easily
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto min-h-[48px]" data-testid="button-create-bill">
              <Plus className="h-4 w-4" />
              Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
              <DialogDescription>
                Split an expense with your friends
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bill-title">Bill Title</Label>
                <Input
                  id="bill-title"
                  placeholder="Dinner, Trip, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  data-testid="input-bill-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill-amount">Total Amount (TON)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  step="0.1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  data-testid="input-bill-amount"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Participants ({participants.length + 1})</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleScanQr}
                    className="gap-2"
                    data-testid="button-scan-participant"
                  >
                    <QrCode className="h-4 w-4" />
                    Scan QR
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono flex-1 truncate">
                      You ({walletAddress.slice(0, 8)}...)
                    </span>
                    <Badge variant="secondary" className="text-xs">Creator</Badge>
                  </div>
                  {participants.map((address, index) => (
                    <div
                      key={address}
                      className="flex items-center gap-2 p-2 bg-muted rounded-md"
                      data-testid={`participant-${index}`}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono flex-1 truncate">
                        {address.slice(0, 8)}...{address.slice(-6)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeParticipant(address)}
                        data-testid={`button-remove-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan QR codes to add participants. Each person pays {participants.length > 0 ? `${(parseFloat(amount || "0") / (participants.length + 1)).toFixed(2)} TON` : "an equal share"}.
                </p>
              </div>
              <Button type="submit" className="w-full min-h-[48px]" data-testid="button-submit-bill">
                Create Bill
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
            Failed to load bills. Please try again.
          </CardContent>
        </Card>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Split}
              title="No Bills Yet"
              description="Create your first bill to split expenses with friends and manage shared costs."
              actionLabel="Create Bill"
              onAction={() => setOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} walletAddress={walletAddress} />
          ))}
        </div>
      )}
    </div>
  );
}
