import { Transaction, TransactionType, Category, PaymentMethod } from '@/types/finance';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  customFilename?: string
): void {
  const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
  
  const csvRows = transactions.map((t) => [
    `"${t.date}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    t.amount.toFixed(2),
    `"${t.paymentMethod}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = customFilename || `cadence_transactions_${dateStamp}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVToTransactions(csvText: string): Partial<Transaction>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Partial<Transaction>[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanValues = values.map((val) => val.replace(/^"|"$/g, '').trim());

    if (cleanValues.length >= 4) {
      const date = cleanValues[0] || new Date().toISOString().split('T')[0];
      const title = cleanValues[1] || 'Imported Transaction';
      const type = (cleanValues[2]?.toLowerCase() === 'income' ? 'income' : 'expense') as TransactionType;
      const category = cleanValues[3] as Category;
      const amount = parseFloat(cleanValues[4]) || 0;
      const paymentMethod = (cleanValues[5] || 'Bank Transfer') as PaymentMethod;
      const notes = cleanValues[6] || 'Imported from CSV';

      results.push({
        id: `tx-imp-${Date.now()}-${i}`,
        title,
        amount: Math.abs(amount),
        type,
        category,
        date,
        paymentMethod,
        notes,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
