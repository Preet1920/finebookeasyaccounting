export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum View {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  REPORTS = 'REPORTS',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  MSB_HOME = 'MSB_HOME',
  MSB_BOOK_LIST = 'MSB_BOOK_LIST',
  GENERAL_BOOK_LIST = 'GENERAL_BOOK_LIST',
}

export enum TransactionCategory {
  GENERAL = 'GENERAL',
  MSB = 'MSB',
}

export enum BookType {
  GENERAL = 'GENERAL',
  MSB = 'MSB',
}

export enum MSBPaymentType {
  DIGITAL = 'DIGITAL',
  CASH = 'CASH',
}

export enum MSBDigitalMethod {
  BANK = 'BANK',
  UPI = 'UPI',
}

export type MSBTransactionStatus = 'PENDING' | 'PAID';

export interface MSBDetails {
  senderName: string;
  senderPhone: string;
  paymentType: MSBPaymentType;
  digitalMethod?: MSBDigitalMethod;
  bankDetails?: {
    accountNumber: string;
    holderName: string; // This is the receiver's name for bank transfers
    receiverPhone: string;
    ifsc: string;
    bankName: string;
    bankLocation: string;
    pan?: string;
  };
  upiDetails?: {
    upiId: string;
    receiverName: string;
    receiverPhone: string;
  };
  cashDetails?: {
    receiverName: string;
    receiverPhone: string;
    tokenCode: string;
  };
  sourceAmount: number; // e.g., 1000 CAD
  sourceCurrency: string;
  exchangeRate: number; // e.g., 60
  receivingAmount: number; // e.g., 60000 INR
  receivingCurrency: string;
  status: MSBTransactionStatus;
}


export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  lastModified?: string;
  category: TransactionCategory;
  msbDetails?: MSBDetails;
}

export interface Book {
  id: string;
  name: string;
  currency: string;
  transactions: Transaction[];
  type: BookType;
}

export interface User {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    password: // In a real app, this would be a hash, not a plaintext string.
string;
    books: Book[];
}