import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, LogOut, CheckCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/lib/api-hooks";
import { useTelegram } from "@/lib/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletConnectorProps {
  onConnect?: (address: string) => void;
}

const STORAGE_KEY = "ton_wallet_address";

export function WalletConnector({ onConnect }: WalletConnectorProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const { toast } = useToast();
  const { user: tgUser, isReady: tgReady } = useTelegram();
  
  // Use react-query for wallet data
  const { data: walletData, refetch } = useWallet(address);
  const balance = walletData?.balance ? parseFloat(walletData.balance).toFixed(1) : "0.0";

  useEffect(() => {
    const savedAddress = localStorage.getItem(STORAGE_KEY);
    if (savedAddress) {
      setAddress(savedAddress);
      setConnected(true);
      onConnect?.(savedAddress);
    }
  }, [onConnect]);

  const handleConnect = async () => {
    try {
      const fullAddress = "UQD" + Math.random().toString(36).substring(2, 20).toUpperCase();
      
      await apiRequest('POST', '/api/wallets', {
        address: fullAddress,
      });

      setAddress(fullAddress);
      setConnected(true);
      localStorage.setItem(STORAGE_KEY, fullAddress);
      onConnect?.(fullAddress);
      
      // Refetch wallet data to get fresh balance
      setTimeout(() => refetch(), 500);
      
      toast({
        title: "Wallet Connected",
        description: "Your TON wallet has been connected successfully.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setAddress("");
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  if (!connected) {
    return (
      <Button 
        onClick={handleConnect} 
        variant="default"
        className="gap-2"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {tgUser && (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={tgUser.photoUrl} alt={tgUser.firstName} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">
              {tgUser.firstName} {tgUser.lastName || ""}
            </span>
            {tgUser.username && (
              <span className="text-xs text-muted-foreground">@{tgUser.username}</span>
            )}
          </div>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-wallet-menu">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="flex flex-col items-start">
                <span className="font-mono text-xs">{address.slice(0, 8)}...{address.slice(-6)}</span>
                <span className="text-xs text-muted-foreground">{balance} TON</span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {tgUser && (
            <>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>
                    {tgUser.firstName} {tgUser.lastName || ""}
                  </span>
                  {tgUser.username && (
                    <span className="text-xs font-normal text-muted-foreground">@{tgUser.username}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={copyAddress} data-testid="button-copy-address">
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect} data-testid="button-disconnect">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
