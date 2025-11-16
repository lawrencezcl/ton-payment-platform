import { Home, Split, Send, Receipt, Clock, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    testId: "link-dashboard",
  },
  {
    title: "Bill Splitting",
    url: "/bills",
    icon: Split,
    testId: "link-bills",
  },
  {
    title: "Send Payment",
    url: "/send",
    icon: Send,
    testId: "link-send",
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
    testId: "link-invoices",
  },
  {
    title: "Merchant",
    url: "/merchant",
    icon: Wallet,
    testId: "link-merchant",
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Clock,
    testId: "link-transactions",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <span className="text-xl font-bold text-primary-foreground">💎</span>
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-sidebar-foreground">TON Pay</h1>
            <p className="text-xs text-muted-foreground">Web3 Payments</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Built for TON x Ignyte Hackathon
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
