import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  balance: decimal("balance", { precision: 18, scale: 9 }).notNull().default("0"),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  type: text("type").notNull(), // 'send', 'receive', 'split', 'invoice', 'merchant'
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'failed'
  description: text("description"),
  hash: text("hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 9 }).notNull(),
  createdBy: text("created_by").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'settled', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billParticipants = pgTable("bill_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull(),
  address: text("address").notNull(),
  share: decimal("share", { precision: 18, scale: 9 }).notNull(),
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address"),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'expired', 'cancelled'
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const merchantPayments = pgTable("merchant_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantName: text("merchant_name").notNull(),
  merchantAddress: text("merchant_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  description: text("description"),
  paymentLink: text("payment_link").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const gifts = pgTable("gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  senderAddress: text("sender_address").notNull(),
  recipientAddress: text("recipient_address"),
  secretHash: text("secret_hash").notNull(),
  description: text("description"),
  isClaimed: boolean("is_claimed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),
});

// Insert schemas
export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  connectedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  totalAmount: z.string().regex(/^\d+(\.\d+)?$/),
});

export const insertBillWithParticipantsSchema = insertBillSchema.extend({
  participants: z.array(z.string()).optional(),
});

export const insertBillParticipantSchema = createInsertSchema(billParticipants).omit({
  id: true,
  paid: true,
  paidAt: true,
}).extend({
  share: z.string().regex(/^\d+(\.\d+)?$/),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  status: true,
  paidAt: true,
  dueDate: true,
  expiresAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  dueDate: z.preprocess((val) => {
    if (!val) return null;
    return val instanceof Date ? val : new Date(val as string);
  }, z.date().nullable().optional()),
  expiresAt: z.preprocess((val) => {
    if (!val) return null;
    return val instanceof Date ? val : new Date(val as string);
  }, z.date().nullable().optional()),
});

export const insertMerchantPaymentSchema = createInsertSchema(merchantPayments).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export const insertGiftSchema = createInsertSchema(gifts).omit({
  id: true,
  createdAt: true,
  isClaimed: true,
  claimedAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

// Types
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertBill = z.infer<typeof insertBillSchema>;
export type InsertBillWithParticipants = z.infer<typeof insertBillWithParticipantsSchema>;
export type Bill = typeof bills.$inferSelect;

export type InsertBillParticipant = z.infer<typeof insertBillParticipantSchema>;
export type BillParticipant = typeof billParticipants.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertMerchantPayment = z.infer<typeof insertMerchantPaymentSchema>;
export type MerchantPayment = typeof merchantPayments.$inferSelect;

export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Gift = typeof gifts.$inferSelect;
