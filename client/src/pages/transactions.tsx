import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionItem } from "@/components/transaction-item";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/lib/api-hooks";
import { formatDistanceToNow } from "date-fns";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const walletAddress = localStorage.getItem("ton_wallet_address") || "";
  const { data: transactions = [], isLoading, error } = useTransactions(walletAddress);

  const filteredTransactions = transactions
    .filter(tx => {
      const desc = tx.description || "";
      return desc.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .map(tx => ({
      id: tx.id,
      type: tx.type,
      description: tx.description || "No description",
      amount: tx.amount,
      status: tx.status,
      timestamp: formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true }),
      from: tx.fromAddress,
      to: tx.toAddress,
    }));

  const sentTransactions = filteredTransactions.filter(tx => tx.type === 'send');
  const receivedTransactions = filteredTransactions.filter(tx => tx.type === 'receive');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground" data-testid="text-page-title">
          Transactions
        </h1>
        <p className="text-muted-foreground mt-1">
          View all your payment history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All your payments and receipts</CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive">
              Failed to load transactions. Please try again.
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
                <TabsTrigger value="received" data-testid="tab-received">Received</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-2">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions found</p>
                ) : (
                  filteredTransactions.map(tx => (
                    <TransactionItem key={tx.id} {...tx} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-2">
                {sentTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sent transactions</p>
                ) : (
                  sentTransactions.map(tx => (
                    <TransactionItem key={tx.id} {...tx} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="received" className="space-y-2">
                {receivedTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No received transactions</p>
                ) : (
                  receivedTransactions.map(tx => (
                    <TransactionItem key={tx.id} {...tx} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
