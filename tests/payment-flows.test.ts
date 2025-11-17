import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Address, toNano, fromNano } from '@ton/core';
import { 
  createInvoiceContract,
  createBillSplitContract,
  createGiftContract,
  createMerchantPaymentContract
} from '../contracts/contract-utils';
import { 
  createInvoice,
  createBillSplit,
  createGift,
  createMerchantPayment,
  getInvoice,
  getBillSplit,
  getGift,
  getMerchantPayment,
  payInvoice,
  payBillSplit,
  claimGift,
  payMerchantPayment
} from '../server/storage';

// Mock TON Connect and blockchain interactions
vi.mock('@tonconnect/ui', () => ({
  useTonConnectUI: () => [{
    sendTransaction: vi.fn().mockResolvedValue({ boc: 'mock_boc' })
  }]
}));

vi.mock('@ton/ton', () => ({
  TonClient: vi.fn().mockImplementation(() => ({
    open: vi.fn().mockReturnValue({
      sendTransfer: vi.fn().mockResolvedValue('mock_hash')
    })
  }))
}));

describe('Payment Flow Integration Tests', () => {
  const testAddress = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t5');
  const testAmount = toNano('1.5');
  const testExpiration = Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    // Reset any mocks or state before each test
    vi.clearAllMocks();
  });

  describe('Invoice Payment Flow', () => {
    it('should create and pay an invoice successfully', async () => {
      // Create invoice
      const invoice = await createInvoice({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        description: 'Test invoice payment',
        expirationTime: testExpiration,
        allowedPayer: testAddress.toString()
      });

      expect(invoice).toBeDefined();
      expect(invoice.amount).toBe(fromNano(testAmount));
      expect(invoice.recipientAddress).toBe(testAddress.toString());
      expect(invoice.status).toBe('pending');

      // Pay invoice
      const paymentResult = await payInvoice(invoice.id, {
        payerAddress: testAddress.toString(),
        amount: fromNano(testAmount)
      });

      expect(paymentResult.success).toBe(true);
      
      // Verify invoice is paid
      const updatedInvoice = await getInvoice(invoice.id);
      expect(updatedInvoice.status).toBe('paid');
    });

    it('should reject payment for expired invoice', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      
      const invoice = await createInvoice({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        description: 'Expired invoice',
        expirationTime: expiredTime
      });

      // Attempt to pay expired invoice
      const paymentResult = await payInvoice(invoice.id, {
        payerAddress: testAddress.toString(),
        amount: fromNano(testAmount)
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('expired');
    });

    it('should reject payment from unauthorized payer', async () => {
      const allowedPayer = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t6');
      const unauthorizedPayer = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t7');

      const invoice = await createInvoice({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        description: 'Restricted invoice',
        expirationTime: testExpiration,
        allowedPayer: allowedPayer.toString()
      });

      // Attempt to pay from unauthorized address
      const paymentResult = await payInvoice(invoice.id, {
        payerAddress: unauthorizedPayer.toString(),
        amount: fromNano(testAmount)
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('unauthorized');
    });
  });

  describe('Bill Split Payment Flow', () => {
    const participants = [
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t5'),
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t6'),
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t7')
    ];

    it('should create and complete a bill split successfully', async () => {
      const totalAmount = toNano('3.0');
      const perPersonAmount = fromNano(toNano('1.0'));

      // Create bill split
      const billSplit = await createBillSplit({
        totalAmount: fromNano(totalAmount),
        participants: participants.map(p => p.toString()),
        description: 'Dinner bill split',
        expirationTime: testExpiration
      });

      expect(billSplit).toBeDefined();
      expect(billSplit.totalAmount).toBe(fromNano(totalAmount));
      expect(billSplit.participants.length).toBe(3);
      expect(billSplit.status).toBe('active');

      // All participants pay their share
      for (let i = 0; i < participants.length; i++) {
        const paymentResult = await payBillSplit(billSplit.id, {
          participantAddress: participants[i].toString(),
          amount: perPersonAmount
        });

        expect(paymentResult.success).toBe(true);
      }

      // Verify bill split is settled
      const updatedBillSplit = await getBillSplit(billSplit.id);
      expect(updatedBillSplit.status).toBe('settled');
    });

    it('should track individual participant payments', async () => {
      const totalAmount = toNano('2.0');
      const perPersonAmount = fromNano(toNano('1.0'));

      const billSplit = await createBillSplit({
        totalAmount: fromNano(totalAmount),
        participants: participants.slice(0, 2).map(p => p.toString()),
        description: 'Two person split',
        expirationTime: testExpiration
      });

      // First participant pays
      await payBillSplit(billSplit.id, {
        participantAddress: participants[0].toString(),
        amount: perPersonAmount
      });

      let updatedBillSplit = await getBillSplit(billSplit.id);
      expect(updatedBillSplit.paidParticipants.length).toBe(1);
      expect(updatedBillSplit.status).toBe('active');

      // Second participant pays
      await payBillSplit(billSplit.id, {
        participantAddress: participants[1].toString(),
        amount: perPersonAmount
      });

      updatedBillSplit = await getBillSplit(billSplit.id);
      expect(updatedBillSplit.paidParticipants.length).toBe(2);
      expect(updatedBillSplit.status).toBe('settled');
    });

    it('should reject payment from non-participant', async () => {
      const nonParticipant = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t8');
      const totalAmount = toNano('2.0');

      const billSplit = await createBillSplit({
        totalAmount: fromNano(totalAmount),
        participants: participants.slice(0, 2).map(p => p.toString()),
        description: 'Two person split',
        expirationTime: testExpiration
      });

      const paymentResult = await payBillSplit(billSplit.id, {
        participantAddress: nonParticipant.toString(),
        amount: fromNano(toNano('1.0'))
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('not a participant');
    });
  });

  describe('Gift Claim Flow', () => {
    const secret = 'birthday-secret-2024';
    const secretHash = 'd47e71cbdf287db348faa38b862847c28563a13f3abdb19e7af4b33f30e11a4e'; // SHA-256 of 'birthday-secret-2024'

    it('should create and claim a gift successfully', async () => {
      // Create gift
      const gift = await createGift({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        secretHash,
        description: 'Birthday gift',
        expirationTime: testExpiration
      });

      expect(gift).toBeDefined();
      expect(gift.amount).toBe(fromNano(testAmount));
      expect(gift.recipientAddress).toBe(testAddress.toString());
      expect(gift.isClaimed).toBe(false);

      // Claim gift with correct secret
      const claimResult = await claimGift(gift.id, {
        recipientAddress: testAddress.toString(),
        secret
      });

      expect(claimResult.success).toBe(true);
      
      // Verify gift is claimed
      const updatedGift = await getGift(gift.id);
      expect(updatedGift.isClaimed).toBe(true);
    });

    it('should reject gift claim with incorrect secret', async () => {
      const gift = await createGift({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        secretHash,
        description: 'Secret gift',
        expirationTime: testExpiration
      });

      const claimResult = await claimGift(gift.id, {
        recipientAddress: testAddress.toString(),
        secret: 'wrong-secret'
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toContain('Invalid secret');
    });

    it('should reject gift claim from unauthorized recipient', async () => {
      const unauthorizedRecipient = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t6');

      const gift = await createGift({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        secretHash,
        description: 'Personal gift',
        expirationTime: testExpiration
      });

      const claimResult = await claimGift(gift.id, {
        recipientAddress: unauthorizedRecipient.toString(),
        secret
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toContain('unauthorized');
    });

    it('should handle expired gift refund', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      
      const gift = await createGift({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        secretHash,
        description: 'Expired gift',
        expirationTime: expiredTime
      });

      // Attempt to claim expired gift
      const claimResult = await claimGift(gift.id, {
        recipientAddress: testAddress.toString(),
        secret
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toContain('expired');
    });
  });

  describe('Merchant Payment Flow', () => {
    it('should create and complete a merchant payment successfully', async () => {
      // Create merchant payment
      const merchantPayment = await createMerchantPayment({
        amount: fromNano(testAmount),
        merchantAddress: testAddress.toString(),
        orderId: 'ORDER-12345',
        description: 'Product purchase',
        expirationTime: testExpiration
      });

      expect(merchantPayment).toBeDefined();
      expect(merchantPayment.amount).toBe(fromNano(testAmount));
      expect(merchantPayment.merchantAddress).toBe(testAddress.toString());
      expect(merchantPayment.orderId).toBe('ORDER-12345');
      expect(merchantPayment.isPaid).toBe(false);

      // Complete payment
      const paymentResult = await payMerchantPayment(merchantPayment.id, {
        customerAddress: testAddress.toString(),
        amount: fromNano(testAmount)
      });

      expect(paymentResult.success).toBe(true);
      
      // Verify payment is completed
      const updatedPayment = await getMerchantPayment(merchantPayment.id);
      expect(updatedPayment.isPaid).toBe(true);
    });

    it('should reject payment for expired merchant payment', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      
      const merchantPayment = await createMerchantPayment({
        amount: fromNano(testAmount),
        merchantAddress: testAddress.toString(),
        orderId: 'ORDER-EXPIRED',
        description: 'Expired order',
        expirationTime: expiredTime
      });

      const paymentResult = await payMerchantPayment(merchantPayment.id, {
        customerAddress: testAddress.toString(),
        amount: fromNano(testAmount)
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('expired');
    });

    it('should reject payment with incorrect amount', async () => {
      const merchantPayment = await createMerchantPayment({
        amount: fromNano(testAmount),
        merchantAddress: testAddress.toString(),
        orderId: 'ORDER-AMOUNT',
        description: 'Amount test',
        expirationTime: testExpiration
      });

      const incorrectAmount = fromNano(toNano('2.0')); // Different amount
      
      const paymentResult = await payMerchantPayment(merchantPayment.id, {
        customerAddress: testAddress.toString(),
        amount: incorrectAmount
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toContain('Incorrect amount');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing payment data gracefully', async () => {
      const result = await payInvoice('non-existent-id', {
        payerAddress: testAddress.toString(),
        amount: fromNano(testAmount)
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle invalid address formats', async () => {
      const result = await createInvoice({
        amount: fromNano(testAmount),
        recipientAddress: 'invalid-address',
        description: 'Test invoice',
        expirationTime: testExpiration
      });

      expect(result.error).toBeDefined();
    });

    it('should handle negative amounts', async () => {
      const result = await createInvoice({
        amount: '-1.0',
        recipientAddress: testAddress.toString(),
        description: 'Negative amount invoice',
        expirationTime: testExpiration
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('Concurrent Payment Safety', () => {
    it('should handle concurrent payments to the same invoice', async () => {
      const invoice = await createInvoice({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        description: 'Concurrent test invoice',
        expirationTime: testExpiration
      });

      // Attempt concurrent payments
      const [result1, result2] = await Promise.all([
        payInvoice(invoice.id, {
          payerAddress: testAddress.toString(),
          amount: fromNano(testAmount)
        }),
        payInvoice(invoice.id, {
          payerAddress: testAddress.toString(),
          amount: fromNano(testAmount)
        })
      ]);

      // Only one should succeed
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);
    });

    it('should handle concurrent gift claims', async () => {
      const secret = 'concurrent-secret';
      const secretHash = '15bb1c6128e5a5212331283734824592eb0a670c5572eb3a790d0d2fa70e67bf'; // SHA-256 of 'concurrent-secret'
      
      const gift = await createGift({
        amount: fromNano(testAmount),
        recipientAddress: testAddress.toString(),
        secretHash,
        description: 'Concurrent gift',
        expirationTime: testExpiration
      });

      // Attempt concurrent claims
      const [result1, result2] = await Promise.all([
        claimGift(gift.id, {
          recipientAddress: testAddress.toString(),
          secret
        }),
        claimGift(gift.id, {
          recipientAddress: testAddress.toString(),
          secret
        })
      ]);

      // Only one should succeed
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);
    });
  });
});