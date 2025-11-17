import { vi } from 'vitest';

// Mock TON Connect and blockchain dependencies
global.Buffer = require('buffer').Buffer;

// Mock TON Connect UI
vi.mock('@tonconnect/ui-react', () => ({
  TonConnectUIProvider: ({ children }: { children: React.ReactNode }) => children,
  useTonConnectUI: () => [{
    connected: true,
    wallet: {
      account: {
        address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t5',
        chain: '-239'
      }
    },
    sendTransaction: vi.fn().mockResolvedValue({ boc: 'mock_boc' })
  }]
}));

// Mock TON Core
vi.mock('@ton/core', () => {
  const mockAddress = (address: string) => ({
    toString: () => address,
    equals: (other: any) => address === other.toString()
  });

  const mockCell = (hashValue: string) => ({
    hash: () => hashValue
  });

  const createBuilder = () => {
    const builder = {
      storeUint: (value: bigint, bits: number) => builder,
      storeAddress: (address: any) => builder,
      storeStringTail: (str: string) => builder,
      storeRef: (cell: any) => builder,
      endCell: () => mockCell('mock_cell_hash')
    };
    return builder;
  };

  return {
    Address: {
      parse: mockAddress
    },
    toNano: (amount: string) => BigInt(Math.floor(parseFloat(amount) * 1e9)),
    fromNano: (amount: bigint) => (Number(amount) / 1e9).toString(),
    beginCell: createBuilder,
    Cell: {
      fromBase64: (base64: string) => mockCell('mock_code_hash')
    },
    contractAddress: (workchain: number, { code, data }: any) => {
      // Generate a unique TON address based on code and data
      const codeHash = code.hash().slice(0, 8);
      const dataHash = data.hash().slice(0, 8);
      const uniqueId = Math.random().toString(36).substr(2, 8); // Add randomness for uniqueness
      return mockAddress(`EQ${codeHash}${dataHash}${uniqueId}00000000000000000000000000000000`);
    }
  };
});

// Mock TON Ton
vi.mock('@ton/ton', () => ({
  TonClient: vi.fn().mockImplementation(() => ({
    open: vi.fn().mockReturnValue({
      sendTransfer: vi.fn().mockResolvedValue('mock_hash'),
      getBalance: vi.fn().mockResolvedValue(BigInt(1000000000))
    }),
    getContractState: vi.fn().mockResolvedValue({ balance: BigInt(1000000000) })
  }))
}));

// Mock TON Crypto
vi.mock('@ton/crypto', () => ({
  sha256: (data: string) => 'mock_sha256_hash'
}));

// Mock WebSocket
class MockWebSocket {
  constructor(url: string) {
    this.url = url;
  }
  url: string;
  send = vi.fn();
  close = vi.fn();
  onopen = vi.fn();
  onmessage = vi.fn();
  onclose = vi.fn();
  onerror = vi.fn();
}

global.WebSocket = MockWebSocket as any;

// Mock fetch for API calls
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/ton-price')) {
    return Promise.resolve({
      json: () => Promise.resolve({ price: 5.25 })
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  });
});

// Mock console methods to reduce noise in tests (but allow debug output)
global.console = {
  ...console,
  log: console.log, // Keep console.log for debugging
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error // Keep console.error for debugging
};