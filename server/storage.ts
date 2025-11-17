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
  wallets,
  transactions,
  bills,
  billParticipants,
  invoices,
  merchantPayments,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, or, desc } from "drizzle-orm";

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
      balance: insertWallet.balance || "0",
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
      status: insertTransaction.status || "pending",
      description: insertTransaction.description || null,
      hash: insertTransaction.hash || null,
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
      description: insertBill.description || null,
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
      toAddress: insertInvoice.toAddress || null,
      description: insertInvoice.description || null,
      dueDate: insertInvoice.dueDate || null,
      expiresAt: insertInvoice.expiresAt || null,
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
      description: insertPayment.description || null,
      expiresAt: insertPayment.expiresAt || null,
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

// Database storage implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  // Wallet operations
  async getWallet(address: string): Promise<Wallet | undefined> {
    const result = await this.db.select().from(wallets).where(eq(wallets.address, address));
    return result[0];
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const result = await this.db.insert(wallets).values(insertWallet).returning();
    return result[0];
  }

  async updateWalletBalance(address: string, balance: string): Promise<Wallet | undefined> {
    const result = await this.db.update(wallets)
      .set({ balance })
      .where(eq(wallets.address, address))
      .returning();
    return result[0];
  }

  // Transaction operations
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await this.db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    const result = await this.db.select().from(transactions)
      .where(or(eq(transactions.fromAddress, address), eq(transactions.toAddress, address)))
      .orderBy(desc(transactions.createdAt));
    return result;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  async updateTransactionStatus(id: string, status: string, hash?: string): Promise<Transaction | undefined> {
    const updateData: any = { status };
    if (hash) {
      updateData.hash = hash;
    }
    const result = await this.db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  // Bill operations
  async getBill(id: string): Promise<Bill | undefined> {
    const result = await this.db.select().from(bills).where(eq(bills.id, id));
    return result[0];
  }

  async getBillsByCreator(address: string): Promise<Bill[]> {
    const result = await this.db.select().from(bills)
      .where(eq(bills.createdBy, address))
      .orderBy(desc(bills.createdAt));
    return result;
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const result = await this.db.insert(bills).values({
      ...insertBill,
      status: "active",
    }).returning();
    return result[0];
  }

  async updateBillStatus(id: string, status: string): Promise<Bill | undefined> {
    const result = await this.db.update(bills)
      .set({ status })
      .where(eq(bills.id, id))
      .returning();
    return result[0];
  }

  // Bill participant operations
  async getBillParticipants(billId: string): Promise<BillParticipant[]> {
    const result = await this.db.select().from(billParticipants)
      .where(eq(billParticipants.billId, billId));
    return result;
  }

  async createBillParticipant(insertParticipant: InsertBillParticipant): Promise<BillParticipant> {
    const result = await this.db.insert(billParticipants).values({
      ...insertParticipant,
      paid: false,
      paidAt: null,
    }).returning();
    return result[0];
  }

  async markParticipantPaid(id: string): Promise<BillParticipant | undefined> {
    const result = await this.db.update(billParticipants)
      .set({ paid: true, paidAt: new Date() })
      .where(eq(billParticipants.id, id))
      .returning();
    return result[0];
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoicesByAddress(address: string): Promise<Invoice[]> {
    const result = await this.db.select().from(invoices)
      .where(eq(invoices.fromAddress, address))
      .orderBy(desc(invoices.createdAt));
    return result;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values({
      ...insertInvoice,
      status: "pending",
      paidAt: null,
    }).returning();
    return result[0];
  }

  async updateInvoiceStatus(id: string, status: string, paidAt?: Date): Promise<Invoice | undefined> {
    const updateData: any = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }
    const result = await this.db.update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  // Merchant payment operations
  async getMerchantPayment(id: string): Promise<MerchantPayment | undefined> {
    const result = await this.db.select().from(merchantPayments).where(eq(merchantPayments.id, id));
    return result[0];
  }

  async createMerchantPayment(insertPayment: InsertMerchantPayment): Promise<MerchantPayment> {
    const result = await this.db.insert(merchantPayments).values({
      ...insertPayment,
      status: "pending",
    }).returning();
    return result[0];
  }

  async updateMerchantPaymentStatus(id: string, status: string): Promise<MerchantPayment | undefined> {
    const result = await this.db.update(merchantPayments)
      .set({ status })
      .where(eq(merchantPayments.id, id))
      .returning();
    return result[0];
  }
}

export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
