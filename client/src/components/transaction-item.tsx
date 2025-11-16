import { ArrowUpRight, ArrowDownLeft, Split, Receipt, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionItemProps {
  type: string;
  description: string;
  amount: string;
  status: string;
  timestamp: string;
  from?: string;
  to?: string;
}

export function TransactionItem({ type, description, amount, status, timestamp, from, to }: TransactionItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'split':
        return <Split className="h-5 w-5 text-blue-500" />;
      case 'invoice':
        return <Receipt className="h-5 w-5 text-purple-500" />;
      case 'merchant':
        return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      default:
        return <ArrowUpRight className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const isNegative = type === 'send';

  return (
    <div className="flex items-center justify-between p-4 hover-elevate rounded-md border" data-testid="item-transaction">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{timestamp}</p>
            <Badge variant={getStatusColor()} className="text-xs">
              {status}
            </Badge>
          </div>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className={`font-mono font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
          {isNegative ? '-' : '+'}{amount} TON
        </p>
      </div>
    </div>
  );
}
