// In-memory paid transaction cache
const paidCache = new Set<string>();

export function markAsPaid(transactionId: string) {
  paidCache.add(transactionId);
}

export function isPaid(transactionId: string): boolean {
  return paidCache.has(transactionId);
}
