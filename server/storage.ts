import {
  type Wallet,
  type InsertWallet,
  type Transaction,
  type InsertTransaction,
  type Bill,
  type InsertBill,
  type BillParticipant,
  type InsertBillParticipant,
  type Invoice,
  type InsertInvoice,
  type MerchantPayment,
  type InsertMerchantPayment,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Wallet operations
  getWallet(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(address: string, balance: string): Promise<Wallet | undefined>;

  // Transaction operations
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByAddress(address: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, hash?: string): Promise<Transaction | undefined>;

  // Bill operations
  getBill(id: string): Promise<Bill | undefined>;
  getBillsByCreator(address: string): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBillStatus(id: string, status: string): Promise<Bill | undefined>;

  // Bill participant operations
  getBillParticipants(billId: string): Promise<BillParticipant[]>;
  createBillParticipant(participant: InsertBillParticipant): Promise<BillParticipant>;
  markParticipantPaid(id: string): Promise<BillParticipant | undefined>;

  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByAddress(address: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string, paidAt?: Date): Promise<Invoice | undefined>;

  // Merchant payment operations
  getMerchantPayment(id: string): Promise<MerchantPayment | undefined>;
  createMerchantPayment(payment: InsertMerchantPayment): Promise<MerchantPayment>;
  updateMerchantPaymentStatus(id: string, status: string): Promise<MerchantPayment | undefined>;
}

export class MemStorage implements IStorage {
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private bills: Map<string, Bill>;
  private billParticipants: Map<string, BillParticipant>;
  private invoices: Map<string, Invoice>;
  private merchantPayments: Map<string, MerchantPayment>;

  constructor() {
    this.wallets = new Map();
    this.transactions = new Map();
    this.bills = new Map();
    this.billParticipants = new Map();
    this.invoices = new Map();
    this.merchantPayments = new Map();
  }

  // Wallet operations
  async getWallet(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(w => w.address === address);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = {
      ...insertWallet,
      id,
      connectedAt: new Date(),
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWalletBalance(address: string, balance: string): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(address);
    if (wallet) {
      wallet.balance = balance;
      this.wallets.set(wallet.id, wallet);
    }
    return wallet;
  }

  // Transaction operations
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.fromAddress === address || tx.toAddress === address)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string, hash?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      if (hash) {
        transaction.hash = hash;
      }
      this.transactions.set(id, transaction);
    }
    return transaction;
  }

  // Bill operations
  async getBill(id: string): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async getBillsByCreator(address: string): Promise<Bill[]> {
    return Array.from(this.bills.values())
      .filter(bill => bill.createdBy === address)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const id = randomUUID();
    const bill: Bill = {
      ...insertBill,
      id,
      status: "active",
      createdAt: new Date(),
    };
    this.bills.set(id, bill);
    return bill;
  }

  async updateBillStatus(id: string, status: string): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (bill) {
      bill.status = status;
      this.bills.set(id, bill);
    }
    return bill;
  }

  // Bill participant operations
  async getBillParticipants(billId: string): Promise<BillParticipant[]> {
    return Array.from(this.billParticipants.values())
      .filter(p => p.billId === billId);
  }

  async createBillParticipant(insertParticipant: InsertBillParticipant): Promise<BillParticipant> {
    const id = randomUUID();
    const participant: BillParticipant = {
      ...insertParticipant,
      id,
      paid: false,
      paidAt: null,
    };
    this.billParticipants.set(id, participant);
    return participant;
  }

  async markParticipantPaid(id: string): Promise<BillParticipant | undefined> {
    const participant = this.billParticipants.get(id);
    if (participant) {
      participant.paid = true;
      participant.paidAt = new Date();
      this.billParticipants.set(id, participant);
    }
    return participant;
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByAddress(address: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(inv => inv.fromAddress === address)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      status: "pending",
      paidAt: null,
      createdAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string, paidAt?: Date): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      invoice.status = status;
      if (paidAt) {
        invoice.paidAt = paidAt;
      }
      this.invoices.set(id, invoice);
    }
    return invoice;
  }

  // Merchant payment operations
  async getMerchantPayment(id: string): Promise<MerchantPayment | undefined> {
    return this.merchantPayments.get(id);
  }

  async createMerchantPayment(insertPayment: InsertMerchantPayment): Promise<MerchantPayment> {
    const id = randomUUID();
    const payment: MerchantPayment = {
      ...insertPayment,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.merchantPayments.set(id, payment);
    return payment;
  }

  async updateMerchantPaymentStatus(id: string, status: string): Promise<MerchantPayment | undefined> {
    const payment = this.merchantPayments.get(id);
    if (payment) {
      payment.status = status;
      this.merchantPayments.set(id, payment);
    }
    return payment;
  }
}

export const storage = new MemStorage();
