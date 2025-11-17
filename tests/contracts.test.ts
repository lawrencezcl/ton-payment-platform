import { describe, it, expect, beforeEach } from 'vitest';
import { Address, toNano, fromNano } from '@ton/core';
import { 
  createInvoiceContract,
  createBillSplitContract,
  createGiftContract,
  createMerchantPaymentContract,
  INVOICE_CODE,
  BILL_SPLIT_CODE,
  GIFT_CODE,
  MERCHANT_PAYMENT_CODE
} from '../contracts/contract-utils';

describe('TON Payment Contracts', () => {
  const testAddress = Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t5');
  const testAmount = toNano('1.5');
  const testExpiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  describe('Invoice Contract', () => {
    it('should create invoice contract with correct parameters', () => {
      const invoice = createInvoiceContract({
        amount: testAmount,
        recipient: testAddress,
        description: 'Test invoice',
        expirationTime: testExpiration,
        allowedPayer: testAddress
      });

      expect(invoice).toBeDefined();
      expect(invoice.amount).toBe(testAmount);
      expect(invoice.recipient.equals(testAddress)).toBe(true);
      expect(invoice.description).toBe('Test invoice');
      expect(invoice.expirationTime).toBe(testExpiration);
      expect(invoice.allowedPayer?.equals(testAddress)).toBe(true);
    });

    it('should handle invoice without allowed payer', () => {
      const invoice = createInvoiceContract({
        amount: testAmount,
        recipient: testAddress,
        description: 'Open invoice',
        expirationTime: testExpiration
      });

      expect(invoice.allowedPayer).toBeUndefined();
    });

    it('should validate invoice amount is positive', () => {
      expect(() => {
        createInvoiceContract({
          amount: toNano('0'),
          recipient: testAddress,
          description: 'Invalid invoice',
          expirationTime: testExpiration
        });
      }).toThrow('Amount must be positive');
    });

    it('should validate expiration time is in the future', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      expect(() => {
        createInvoiceContract({
          amount: testAmount,
          recipient: testAddress,
          description: 'Expired invoice',
          expirationTime: pastTime
        });
      }).toThrow('Expiration time must be in the future');
    });
  });

  describe('Bill Split Contract', () => {
    const participants = [
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t5'),
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t6'),
      Address.parse('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t7')
    ];

    it('should create bill split contract with multiple participants', () => {
      const totalAmount = toNano('3.0');
      const billSplit = createBillSplitContract({
        totalAmount,
        participants,
        description: 'Dinner bill split',
        expirationTime: testExpiration
      });

      expect(billSplit).toBeDefined();
      expect(billSplit.totalAmount).toBe(totalAmount);
      expect(billSplit.participants.length).toBe(3);
      expect(billSplit.perPersonAmount).toBe(toNano('1.0'));
      expect(billSplit.description).toBe('Dinner bill split');
    });

    it('should calculate per-person amount correctly', () => {
      const totalAmount = toNano('4.5');
      const billSplit = createBillSplitContract({
        totalAmount,
        participants,
        description: 'Taxi fare split',
        expirationTime: testExpiration
      });

      expect(billSplit.perPersonAmount).toBe(toNano('1.5'));
    });

    it('should validate total amount is divisible by participants', () => {
      const totalAmount = toNano('3.334'); // Not evenly divisible
      
      expect(() => {
        createBillSplitContract({
          totalAmount,
          participants,
          description: 'Uneven split',
          expirationTime: testExpiration
        });
      }).toThrow('Total amount must be evenly divisible by number of participants');
    });

    it('should require at least 2 participants', () => {
      expect(() => {
        createBillSplitContract({
          totalAmount: toNano('1.0'),
          participants: [testAddress],
          description: 'Single participant',
          expirationTime: testExpiration
        });
      }).toThrow('At least 2 participants required');
    });
  });

  describe('Gift Contract', () => {
    const secretHash = 'd47e71cbdf287db348faa38b862847c28563a13f3abdb19e7af4b33f30e11a4e'; // SHA-256 of 'birthday-secret-2024'
    
    it('should create gift contract with secret hash', () => {
      const gift = createGiftContract({
        amount: testAmount,
        recipient: testAddress,
        secretHash,
        expirationTime: testExpiration,
        description: 'Birthday gift'
      });

      expect(gift).toBeDefined();
      expect(gift.amount).toBe(testAmount);
      expect(gift.recipient.equals(testAddress)).toBe(true);
      expect(gift.secretHash).toBe(secretHash);
      expect(gift.description).toBe('Birthday gift');
      expect(gift.isClaimed).toBe(false);
    });

    it('should validate secret hash format', () => {
      const invalidHash = 'invalid-hash';
      
      expect(() => {
        createGiftContract({
          amount: testAmount,
          recipient: testAddress,
          secretHash: invalidHash,
          expirationTime: testExpiration
        });
      }).toThrow('Secret hash must be a valid SHA256 hash');
    });

    it('should handle gift without description', () => {
      const gift = createGiftContract({
        amount: testAmount,
        recipient: testAddress,
        secretHash,
        expirationTime: testExpiration
      });

      expect(gift.description).toBe('');
    });
  });

  describe('Merchant Payment Contract', () => {
    it('should create merchant payment contract', () => {
      const merchantPayment = createMerchantPaymentContract({
        amount: testAmount,
        merchantAddress: testAddress,
        orderId: 'ORDER-123',
        description: 'Product purchase',
        expirationTime: testExpiration
      });

      expect(merchantPayment).toBeDefined();
      expect(merchantPayment.amount).toBe(testAmount);
      expect(merchantPayment.merchantAddress.equals(testAddress)).toBe(true);
      expect(merchantPayment.orderId).toBe('ORDER-123');
      expect(merchantPayment.description).toBe('Product purchase');
      expect(merchantPayment.isPaid).toBe(false);
    });

    it('should validate order ID format', () => {
      const invalidOrderId = '';
      
      expect(() => {
        createMerchantPaymentContract({
          amount: testAmount,
          merchantAddress: testAddress,
          orderId: invalidOrderId,
          description: 'Invalid order',
          expirationTime: testExpiration
        });
      }).toThrow('Order ID cannot be empty');
    });

    it('should handle merchant payment without description', () => {
      const merchantPayment = createMerchantPaymentContract({
        amount: testAmount,
        merchantAddress: testAddress,
        orderId: 'ORDER-456',
        expirationTime: testExpiration
      });

      expect(merchantPayment.description).toBe('');
    });
  });

  describe('Contract Code Validation', () => {
    it('should have valid contract codes defined', () => {
      expect(INVOICE_CODE).toBeDefined();
      expect(INVOICE_CODE.length).toBeGreaterThan(0);
      
      expect(BILL_SPLIT_CODE).toBeDefined();
      expect(BILL_SPLIT_CODE.length).toBeGreaterThan(0);
      
      expect(GIFT_CODE).toBeDefined();
      expect(GIFT_CODE.length).toBeGreaterThan(0);
      
      expect(MERCHANT_PAYMENT_CODE).toBeDefined();
      expect(MERCHANT_PAYMENT_CODE.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Deployment Validation', () => {
    it('should generate valid contract addresses', () => {
      const invoice = createInvoiceContract({
        amount: testAmount,
        recipient: testAddress,
        description: 'Test deployment',
        expirationTime: testExpiration
      });

      expect(invoice.address).toBeDefined();
      expect(invoice.address.toString()).toMatch(/^EQ/); // TON addresses start with EQ or UQ
    });

    it('should generate unique addresses for different contracts', () => {
      const invoice1 = createInvoiceContract({
        amount: testAmount,
        recipient: testAddress,
        description: 'Invoice 1',
        expirationTime: testExpiration
      });

      const invoice2 = createInvoiceContract({
        amount: testAmount,
        recipient: testAddress,
        description: 'Invoice 2',
        expirationTime: testExpiration + 3600
      });

      expect(invoice1.address.toString()).not.toBe(invoice2.address.toString());
    });
  });
});