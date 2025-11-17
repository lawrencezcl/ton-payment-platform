import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, LogOut, CheckCircle, User, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTonAddress, useTonConnectUI, useTonWallet, useIsConnectionRestored } from "@tonconnect/ui-react";
import { useTelegram } from "@/lib/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTonBalance } from "@/lib/ton-client";
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

export function WalletConnector({ onConnect }: WalletConnectorProps) {
  const { toast } = useToast();
  const { user: tgUser } = useTelegram();
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const wallet = useTonWallet();
  const connectionRestored = useIsConnectionRestored();
  const [balance, setBalance] = useState("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    if (userFriendlyAddress) {
      onConnect?.(userFriendlyAddress);
      fetchBalance();
    }
  }, [userFriendlyAddress, onConnect]);

  useEffect(() => {
    if (userFriendlyAddress) {
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [userFriendlyAddress]);

  const fetchBalance = async () => {
    if (!userFriendlyAddress) return;
    setIsLoadingBalance(true);
    try {
      const tonBalance = await getTonBalance(userFriendlyAddress);
      setBalance(tonBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleConnect = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to open TON Connect modal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (userFriendlyAddress) {
      navigator.clipboard.writeText(userFriendlyAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard.",
      });
    }
  };

  if (!connectionRestored) {
    return (
      <Button variant="ghost" disabled className="gap-2">
        <Wallet className="h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    );
  }

  if (!userFriendlyAddress) {
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
                <span className="font-mono text-xs">
                  {userFriendlyAddress.slice(0, 6)}...{userFriendlyAddress.slice(-4)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isLoadingBalance ? "..." : `${balance} TON`}
                </span>
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
