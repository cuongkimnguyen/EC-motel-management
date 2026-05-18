// Backend integration point: Replace with API types from your backend schema

export type ExpenseCategory =
  | 'Điện nước' |'Internet' |'Vệ sinh' |'Sửa chữa' |'Mua sắm' |'Lương / quản lý' |'Chi phí khác';

export type ExpensePaymentStatus =
  | 'Đã thanh toán' |'Chưa thanh toán' |'Chờ xử lý';

export type ExpensePaymentMethod =
  | 'Tiền mặt' |'Chuyển khoản' |'Khác';

export interface Expense {
  id: string;
  expenseCode: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string; // ISO date string
  paymentStatus: ExpensePaymentStatus;
  paymentMethod: ExpensePaymentMethod;
  buildingName: string;
  note: string;
  attachmentCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isRecurring?: boolean;
  receiptImage?: string;
}

export interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | '';
  paymentStatus: ExpensePaymentStatus | '';
  buildingName: string;
  fromDate: string;
  toDate: string;
}

export interface ExpenseFormData {
  title: string;
  category: ExpenseCategory | '';
  amount: string;
  expenseDate: string;
  paymentStatus: ExpensePaymentStatus | '';
  paymentMethod: ExpensePaymentMethod | '';
  buildingName: string;
  note: string;
  isRecurring: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Điện nước',
  'Internet',
  'Vệ sinh',
  'Sửa chữa',
  'Mua sắm',
  'Lương / quản lý',
  'Chi phí khác',
];

export const EXPENSE_PAYMENT_STATUSES: ExpensePaymentStatus[] = [
  'Đã thanh toán',
  'Chưa thanh toán',
  'Chờ xử lý',
];

export const EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'Tiền mặt',
  'Chuyển khoản',
  'Khác',
];

export const BUILDINGS = ['Tất cả', 'Khu A', 'Khu B', 'Khu C', 'Khu D'];
