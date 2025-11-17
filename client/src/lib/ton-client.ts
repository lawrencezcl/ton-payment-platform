// TON testnet endpoint
const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

export async function getTonBalance(address: string): Promise<string> {
  try {
    // Call TON Center API to get balance
    const response = await fetch(TESTNET_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "1",
        jsonrpc: "2.0",
        method: "getAddressBalance",
        params: {
          address: address,
        },
      }),
    });

    const data = await response.json();
    
    if (data.result) {
      // Convert nanoton to TON (1 TON = 1,000,000,000 nanoton)
      const tonBalance = Number(data.result) / 1_000_000_000;
      return tonBalance.toFixed(2);
    }
    
    return "0.00";
  } catch (error) {
    console.error("Failed to fetch TON balance:", error);
    return "0.00";
  }
}
