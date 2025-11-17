import { TonClient, Address } from "@ton/ton";

// TON testnet endpoint
const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export const tonClient = new TonClient({
  endpoint: TESTNET_ENDPOINT,
});

export async function getTonBalance(address: string): Promise<string> {
  try {
    const addr = Address.parse(address);
    const balance = await tonClient.getBalance(addr);
    
    // Convert nanoton to TON (1 TON = 1,000,000,000 nanoton)
    const tonBalance = Number(balance) / 1_000_000_000;
    return tonBalance.toFixed(2);
  } catch (error) {
    console.error("Failed to fetch TON balance:", error);
    return "0.00";
  }
}
