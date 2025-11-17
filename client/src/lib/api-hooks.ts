import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import type { Transaction, Bill, Invoice, Wallet, BillParticipant } from "@shared/schema";

// TON Price
export function useTonPrice() {
  return useQuery<{
    usd: number;
    eur: number;
    timestamp: string;
  }>({
    queryKey: ['/api/ton-price'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
    queryFn: async () => {
      const response = await fetch('/api/ton-price');
      if (!response.ok) throw new Error('Failed to fetch TON price');
      return response.json();
    },
  });
}

// Wallet
export function useWallet(address?: string) {
  return useQuery<Wallet>({
    queryKey: ['/api/wallets', address],
    enabled: !!address,
    queryFn: async () => {
      if (!address) throw new Error('No address');
      const response = await fetch(`/api/wallets/${address}`);
      if (!response.ok) throw new Error('Failed to fetch wallet');
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 3000, // Poll every 3 seconds for balance updates
  });
}

// Transactions
export function useTransactions(address?: string) {
  return useQuery<Transaction[]>({
    queryKey: ['/api/transactions', address],
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/transactions/address/${address}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });
}

export function useCreateTransaction() {
  return useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
  });
}

// Bills
export function useBills(address?: string) {
  return useQuery<Bill[]>({
    queryKey: ['/api/bills', address],
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/bills/creator/${address}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    },
  });
}

export function useCreateBill() {
  return useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/bills', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bill-participants'] });
    },
  });
}

export function useBillParticipants(billId?: string) {
  return useQuery<BillParticipant[]>({
    queryKey: ['/api/bill-participants', billId],
    enabled: !!billId,
    queryFn: async () => {
      if (!billId) return [];
      const response = await fetch(`/api/bill-participants/bill/${billId}`);
      if (!response.ok) throw new Error('Failed to fetch bill participants');
      return response.json();
    },
  });
}

// Invoices
export function useInvoices(address?: string) {
  return useQuery<Invoice[]>({
    queryKey: ['/api/invoices', address],
    enabled: !!address,
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/invoices/address/${address}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
  });
}

export function useCreateInvoice() {
  return useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/invoices', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
  });
}

// Merchant Payments
export function useCreateMerchantPayment() {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/merchant-payments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/merchant-payments'] });
    },
  });
}
