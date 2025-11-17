import express, { type Request, Response } from "express";
import cors from "cors";

const app = express();

// Configure CORS for TON Connect and external APIs
app.use(cors({
  origin: [
    'https://tonpayment-gosoe2vy5-lawrencezcls-projects.vercel.app',
    'https://tonpayment-pink.vercel.app',
    'https://tonpayment-50aasxniy-lawrencezcls-projects.vercel.app',
    'https://tonpayment-5pwd8zsp5-lawrencezcls-projects.vercel.app',
    'https://tonpayment-qrxo00a3v-lawrencezcls-projects.vercel.app',
    'https://connect.token.im',
    'https://tc.architecton.su',
    'https://app.tonkeeper.com',
    'https://wallet.tonhub.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// TON price endpoint
app.get("/api/ton-price", (req: Request, res: Response) => {
  try {
    console.log('TON price API called');
    const TON_PRICE_USD = 5.2;
    const response = { 
      usd: TON_PRICE_USD,
      eur: TON_PRICE_USD * 0.92,
      timestamp: new Date().toISOString()
    };
    console.log('TON price response:', response);
    res.json(response);
  } catch (error) {
    console.error('TON price API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// TON Connect manifest endpoint
app.get("/tonconnect-manifest.json", (req: Request, res: Response) => {
  try {
    console.log('TON Connect manifest requested');
    const manifest = {
      url: "https://tonpayment-qrxo00a3v-lawrencezcls-projects.vercel.app",
      name: "TON Payment Platform",
      iconUrl: "https://tonpayment-qrxo00a3v-lawrencezcls-projects.vercel.app/icon.svg"
    };
    console.log('TON Connect manifest response:', manifest);
    res.json(manifest);
  } catch (error) {
    console.error('TON Connect manifest error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default app;