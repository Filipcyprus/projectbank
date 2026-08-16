/* ---------------------------------------------------------------------------
 * Receipt sharing.
 *
 * Uses the real Web Share API where the browser offers it (almost every
 * mobile browser, so this is genuine share-sheet behaviour, not a
 * simulation), and falls back to the clipboard everywhere else. There is no
 * server involved — the "receipt" is text generated from the transaction
 * already sitting in state.
 * ------------------------------------------------------------------------- */

export interface ReceiptDetails {
  title: string;
  amount: string;
  counterparty: string;
  reference?: string;
  date?: string;
  status?: string;
}

function formatReceipt(r: ReceiptDetails): string {
  const lines = [
    `Nisos receipt — ${r.title}`,
    `Amount: ${r.amount}`,
    `To/From: ${r.counterparty}`,
  ];
  if (r.reference) lines.push(`Reference: ${r.reference}`);
  if (r.date) lines.push(`Date: ${r.date}`);
  if (r.status) lines.push(`Status: ${r.status}`);
  lines.push('', 'Demo transaction — recorded on this device only, no money moved.');
  return lines.join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unavailable';

export async function shareReceipt(details: ReceiptDetails): Promise<ShareOutcome> {
  const text = formatReceipt(details);

  if (navigator.share) {
    try {
      await navigator.share({ title: `Nisos receipt — ${details.title}`, text });
      return 'shared';
    } catch (err) {
      // AbortError = the citizen closed the share sheet; not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Fall through to the clipboard for any other failure (e.g. no share target installed).
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }

  return 'unavailable';
}
