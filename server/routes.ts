import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertWalletSchema,
  insertTransactionSchema,
  insertBillSchema,
  insertBillWithParticipantsSchema,
  insertBillParticipantSchema,
  insertInvoiceSchema,
  insertMerchantPaymentSchema,
} from "@shared/schema";
import { z } from "zod";
import { validateTelegramInitData, parseTelegramUser } from "./telegram";

// Mock TON price (in real app, fetch from API)
const TON_PRICE_USD = 5.2;

interface WebSocketClient extends WebSocket {
  address?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient) => {
    clients.add(ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'register' && data.address) {
          ws.address = data.address;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (event: string, data: any) => {
    const message = JSON.stringify({ event, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // TON price endpoint
  app.get("/api/ton-price", (req: Request, res: Response) => {
    res.json({ 
      usd: TON_PRICE_USD,
      eur: TON_PRICE_USD * 0.92,
      timestamp: new Date().toISOString()
    });
  });

  // Telegram auth endpoint
  app.post("/api/auth/telegram", async (req: Request, res: Response) => {
    try {
      const { initData } = req.body;
      
      if (!initData) {
        return res.status(400).json({ error: "Missing initData" });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
        }
        console.warn("TELEGRAM_BOT_TOKEN not set - allowing in development mode only");
        const user = parseTelegramUser(initData);
        return res.json({ valid: true, user });
      }

      // Validate with 5-minute window to prevent replay attacks
      const isValid = validateTelegramInitData(initData, botToken, 300);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid or expired Telegram data" });
      }

      const user = parseTelegramUser(initData);
      res.json({ valid: true, user });
    } catch (error: any) {
      console.error("Telegram auth error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet endpoints
  app.post("/api/wallets", async (req: Request, res: Response) => {
    try {
      const schema = insertWalletSchema.omit({ balance: true });
      const data = schema.parse(req.body);
      
      // Check if wallet already exists
      const existing = await storage.getWallet(data.address);
      if (existing) {
        return res.json(existing);
      }
      
      // Create new wallet with default balance
      const wallet = await storage.createWallet({
        ...data,
        balance: "100.0",
      });
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.get("/api/wallets/:address", async (req: Request, res: Response) => {
    const wallet = await storage.getWallet(req.params.address);
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    res.json(wallet);
  });

  app.patch("/api/wallets/:address/balance", async (req: Request, res: Response) => {
    try {
      const { balance } = req.body;
      const wallet = await storage.updateWalletBalance(req.params.address, balance);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Transaction endpoints
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(data);
      
      // Update wallet balances for confirmed transactions
      if (transaction.status === 'confirmed') {
        const fromWallet = await storage.getWallet(transaction.fromAddress);
        const toWallet = await storage.getWallet(transaction.toAddress);
        
        if (fromWallet) {
          const newBalance = (parseFloat(fromWallet.balance) - parseFloat(transaction.amount)).toString();
          await storage.updateWalletBalance(transaction.fromAddress, newBalance);
        }
        
        if (toWallet) {
          const newBalance = (parseFloat(toWallet.balance) + parseFloat(transaction.amount)).toString();
          await storage.updateWalletBalance(transaction.toAddress, newBalance);
        }
      }
      
      // Broadcast to connected clients
      broadcast('transaction:created', transaction);
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.get("/api/transactions/address/:address", async (req: Request, res: Response) => {
    const transactions = await storage.getTransactionsByAddress(req.params.address);
    res.json(transactions);
  });

  app.patch("/api/transactions/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, hash } = req.body;
      const transaction = await storage.updateTransactionStatus(req.params.id, status, hash);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Broadcast status update
      broadcast('transaction:updated', transaction);
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Bill endpoints
  app.post("/api/bills", async (req: Request, res: Response) => {
    try {
      const data = insertBillWithParticipantsSchema.parse(req.body);
      const { participants, ...billData } = data;
      
      const bill = await storage.createBill(billData);
      
      // Create participant records
      if (participants && participants.length > 0) {
        const totalParticipants = participants.length + 1; // +1 for creator
        const shareAmount = (parseFloat(bill.totalAmount) / totalParticipants).toString();
        
        // Create participant record for each address
        for (const address of participants) {
          await storage.createBillParticipant({
            billId: bill.id,
            address,
            share: shareAmount,
          });
        }
        
        // Create participant record for creator
        await storage.createBillParticipant({
          billId: bill.id,
          address: bill.createdBy,
          share: shareAmount,
        });
      }
      
      broadcast('bill:created', bill);
      
      res.json(bill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create bill" });
    }
  });

  app.get("/api/bills/:id", async (req: Request, res: Response) => {
    const bill = await storage.getBill(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json(bill);
  });

  app.get("/api/bills/creator/:address", async (req: Request, res: Response) => {
    const bills = await storage.getBillsByCreator(req.params.address);
    res.json(bills);
  });

  app.patch("/api/bills/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const bill = await storage.updateBillStatus(req.params.id, status);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      broadcast('bill:updated', bill);
      
      res.json(bill);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bill" });
    }
  });

  // Bill participant endpoints
  app.post("/api/bill-participants", async (req: Request, res: Response) => {
    try {
      const data = insertBillParticipantSchema.parse(req.body);
      const participant = await storage.createBillParticipant(data);
      res.json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add participant" });
    }
  });

  app.get("/api/bill-participants/bill/:billId", async (req: Request, res: Response) => {
    const participants = await storage.getBillParticipants(req.params.billId);
    res.json(participants);
  });

  app.patch("/api/bill-participants/:id/pay", async (req: Request, res: Response) => {
    try {
      const participant = await storage.markParticipantPaid(req.params.id);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Update wallet balances
      const bill = await storage.getBill(participant.billId);
      if (bill) {
        // Debit participant's wallet
        const participantWallet = await storage.getWallet(participant.address);
        if (participantWallet) {
          const newBalance = (parseFloat(participantWallet.balance) - parseFloat(participant.share)).toString();
          await storage.updateWalletBalance(participant.address, newBalance);
        }

        // Credit bill creator's wallet
        const creatorWallet = await storage.getWallet(bill.createdBy);
        if (creatorWallet) {
          const newBalance = (parseFloat(creatorWallet.balance) + parseFloat(participant.share)).toString();
          await storage.updateWalletBalance(bill.createdBy, newBalance);
        }

        // Check if all participants have paid
        const allParticipants = await storage.getBillParticipants(participant.billId);
        const allPaid = allParticipants.every(p => p.paid);
        if (allPaid) {
          await storage.updateBillStatus(participant.billId, 'settled');
        }
      }

      broadcast('participant:paid', participant);
      
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as paid" });
    }
  });

  // Invoice endpoints
  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(data);
      
      broadcast('invoice:created', invoice);
      
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.get("/api/invoices/address/:address", async (req: Request, res: Response) => {
    const invoices = await storage.getInvoicesByAddress(req.params.address);
    res.json(invoices);
  });

  app.patch("/api/invoices/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, payerAddress } = req.body;
      const paidAt = status === 'paid' ? new Date() : undefined;
      const invoice = await storage.updateInvoiceStatus(req.params.id, status, paidAt);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Update wallet balances when invoice is paid
      if (status === 'paid' && payerAddress) {
        // Debit payer's wallet
        const payerWallet = await storage.getWallet(payerAddress);
        if (payerWallet) {
          const newBalance = (parseFloat(payerWallet.balance) - parseFloat(invoice.amount)).toString();
          await storage.updateWalletBalance(payerAddress, newBalance);
        }

        // Credit invoice creator's wallet
        const creatorWallet = await storage.getWallet(invoice.fromAddress);
        if (creatorWallet) {
          const newBalance = (parseFloat(creatorWallet.balance) + parseFloat(invoice.amount)).toString();
          await storage.updateWalletBalance(invoice.fromAddress, newBalance);
        }
      }

      broadcast('invoice:updated', invoice);
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Merchant payment endpoints
  app.post("/api/merchant-payments", async (req: Request, res: Response) => {
    try {
      const data = insertMerchantPaymentSchema.parse(req.body);
      const payment = await storage.createMerchantPayment(data);
      
      broadcast('merchant:created', payment);
      
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create merchant payment" });
    }
  });

  app.get("/api/merchant-payments/:id", async (req: Request, res: Response) => {
    const payment = await storage.getMerchantPayment(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  });

  app.patch("/api/merchant-payments/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const payment = await storage.updateMerchantPaymentStatus(req.params.id, status);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      broadcast('merchant:updated', payment);
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  return httpServer;
}
