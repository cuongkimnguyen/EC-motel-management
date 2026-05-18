// Backend integration point: Replace mock implementations with real API calls
// e.g., import axios from 'axios'
; const API_BASE = '/api/expenses';

import { Expense, ExpenseFilters, ExpenseFormData } from './types';
import { mockExpenses } from './mockExpenses';

let expensesStore: Expense[] = [...mockExpenses];

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return 'exp-' + Date.now().toString(36);
}

function generateCode(): string {
  const num = expensesStore.length + 1;
  return `CP-2024-${String(num).padStart(3, '0')}`;
}

export async function getExpenses(filters?: Partial<ExpenseFilters>): Promise<Expense[]> {
  await delay();
  let result = [...expensesStore];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.expenseCode.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q)
    );
  }
  if (filters?.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters?.paymentStatus) {
    result = result.filter((e) => e.paymentStatus === filters.paymentStatus);
  }
  if (filters?.buildingName && filters.buildingName !== 'Tất cả') {
    result = result.filter((e) => e.buildingName === filters.buildingName);
  }
  if (filters?.fromDate) {
    result = result.filter((e) => e.expenseDate >= filters.fromDate!);
  }
  if (filters?.toDate) {
    result = result.filter((e) => e.expenseDate <= filters.toDate!);
  }

  return result.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  await delay(200);
  return expensesStore.find((e) => e.id === id) ?? null;
}

export async function createExpense(payload: ExpenseFormData): Promise<Expense> {
  await delay();
  const now = new Date().toISOString();
  const newExpense: Expense = {
    id: generateId(),
    expenseCode: generateCode(),
    title: payload.title,
    category: payload.category as Expense['category'],
    amount: parseFloat(payload.amount),
    expenseDate: payload.expenseDate,
    paymentStatus: payload.paymentStatus as Expense['paymentStatus'],
    paymentMethod: payload.paymentMethod as Expense['paymentMethod'],
    buildingName: payload.buildingName || 'Khu A',
    note: payload.note,
    attachmentCount: 0,
    createdBy: 'Nguyễn Văn Chủ',
    createdAt: now,
    updatedAt: now,
    isRecurring: payload.isRecurring,
  };
  expensesStore = [newExpense, ...expensesStore];
  return newExpense;
}

export async function updateExpense(id: string, payload: ExpenseFormData): Promise<Expense> {
  await delay();
  const idx = expensesStore.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Expense not found');
  const updated: Expense = {
    ...expensesStore[idx],
    title: payload.title,
    category: payload.category as Expense['category'],
    amount: parseFloat(payload.amount),
    expenseDate: payload.expenseDate,
    paymentStatus: payload.paymentStatus as Expense['paymentStatus'],
    paymentMethod: payload.paymentMethod as Expense['paymentMethod'],
    buildingName: payload.buildingName || expensesStore[idx].buildingName,
    note: payload.note,
    isRecurring: payload.isRecurring,
    updatedAt: new Date().toISOString(),
  };
  expensesStore = expensesStore.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function deleteExpense(id: string): Promise<void> {
  await delay();
  expensesStore = expensesStore.filter((e) => e.id !== id);
}

export async function markExpensePaid(id: string): Promise<Expense> {
  await delay(300);
  const idx = expensesStore.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Expense not found');
  const updated: Expense = {
    ...expensesStore[idx],
    paymentStatus: 'Đã thanh toán',
    updatedAt: new Date().toISOString(),
  };
  expensesStore = expensesStore.map((e) => (e.id === id ? updated : e));
  return updated;
}
