import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { Plus, Split, Users, CheckCircle, Loader2 } from "lucide-react";
import { useBills, useCreateBill } from "@/lib/api-hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Bills() {
  const walletAddress = localStorage.getItem("ton_wallet_address") || "";
  const { data: bills = [], isLoading, error } = useBills(walletAddress);
  const createBill = useCreateBill();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [participantCount, setParticipantCount] = useState("2");
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createBill.mutateAsync({
        title,
        totalAmount: amount,
        description: `Split among ${participantCount} participants`,
        createdBy: walletAddress,
      });

      toast({
        title: "Bill Created!",
        description: `${title} has been created successfully.`,
      });

      setTitle("");
      setAmount("");
      setParticipantCount("2");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
            Bill Splitting
          </h1>
          <p className="text-muted-foreground mt-1">
            Split expenses with friends easily
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-bill">
              <Plus className="h-4 w-4" />
              Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                <Label htmlFor="participants">Number of Participants</Label>
                <Input
                  id="participants"
                  type="number"
                  min="2"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(e.target.value)}
                  required
                  data-testid="input-participants"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-bill">
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
        <div className="grid gap-4 md:grid-cols-2">
          {bills.map((bill) => {
            const share = (parseFloat(bill.totalAmount) / 4).toFixed(1);
            return (
              <Card key={bill.id} className="hover-elevate" data-testid={`card-bill-${bill.id}`}>
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
                    <span className="text-sm text-muted-foreground">Your Share</span>
                    <span className="font-mono font-semibold text-primary">{share} TON</span>
                  </div>
                  <Button className="w-full gap-2" variant="outline" data-testid={`button-settle-${bill.id}`}>
                    <CheckCircle className="h-4 w-4" />
                    Settle Up
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
