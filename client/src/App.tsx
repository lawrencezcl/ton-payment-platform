import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TelegramProvider } from "@/lib/telegram";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WalletConnector } from "@/components/wallet-connector";
import { useWebSocket } from "@/lib/websocket";
import Dashboard from "@/pages/dashboard";
import SendPayment from "@/pages/send-payment";
import Bills from "@/pages/bills";
import Invoices from "@/pages/invoices";
import Merchant from "@/pages/merchant";
import Transactions from "@/pages/transactions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/send" component={SendPayment} />
      <Route path="/bills" component={Bills} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/merchant" component={Merchant} />
      <Route path="/transactions" component={Transactions} />
    </Switch>
  );
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string>();
  useWebSocket(walletAddress);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const manifestUrl = import.meta.env.VITE_TON_MANIFEST_URL || 
    `${window.location.origin}/tonconnect-manifest.json`;

  return (
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <TelegramProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between p-3 sm:p-4 border-b gap-2 sm:gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <WalletConnector onConnect={setWalletAddress} />
                  </header>
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </TelegramProvider>
      </TonConnectUIProvider>
    </QueryClientProvider>
  );
}
