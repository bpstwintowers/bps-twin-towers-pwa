import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshFinancialSummary,
  GaneshSankalpamRecord,
  GaneshContributionType,
  GaneshExpenseCategory,
  GaneshPaymentMode,
} from '../types/ganesh';

// Live Google Sheets Feeds
export const GOOGLE_SHEET_CONTRIBUTIONS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1ExhYq2D0bCV2R8J9IJpRcAER9LGPBkVZ/gviz/tq?tqx=out:csv&gid=960844894';

export const GOOGLE_SHEET_GOTHRAM_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1LKO614ka9F_G9B2OG-wqsZCT9Bk-c2COc1mpFPFT-M4/gviz/tq?tqx=out:csv&gid=984412802';

export const GOOGLE_FORM_STORAGE_KEY = 'bps_ganesh_google_form_url';
export const DEFAULT_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeUzxQUqAyLEj3e6xPCvy3b7s_DFBy4-vtEDSUtm87T2Aw29g/viewform?usp=dialog';

export function getGoogleFormUrl(): string {
  const stored = localStorage.getItem(GOOGLE_FORM_STORAGE_KEY);
  if (!stored || stored.includes('1FAIpQLSd7gqA2gW9z9P9n1H6eQe1e9Y9_q1')) {
    localStorage.setItem(GOOGLE_FORM_STORAGE_KEY, DEFAULT_GOOGLE_FORM_URL);
    return DEFAULT_GOOGLE_FORM_URL;
  }
  return stored;
}

export function setGoogleFormUrl(url: string): void {
  localStorage.setItem(GOOGLE_FORM_STORAGE_KEY, url.trim());
}

export const GANESH_UPI_ID = 'harish.reddy5@axl';

/**
 * Checks if a user's flat (e.g. 'B1802') matches a record's flat string,
 * which may contain multiple flats like 'B1802, B1707, B1807, B1107, B707'
 * or 'A101 & A102' or 'B-1802'.
 */
export function isFlatMatching(
  recordFlatStr: string | undefined | null,
  userFlat: string | undefined | null
): boolean {
  if (!recordFlatStr || !userFlat) return false;
  const target = userFlat.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!target || target === 'GUEST') return false;

  const cleanRecord = recordFlatStr.trim().toUpperCase().replace(/[\s-]/g, '');
  if (cleanRecord === target) return true;

  // Split by commas, slashes, ampersands, semicolons, pluses, or 'and'
  const parts = recordFlatStr
    .split(/[,;/+&]|\band\b/i)
    .map((p) => p.trim().toUpperCase().replace(/[\s-]/g, ''))
    .filter(Boolean);

  if (parts.includes(target)) return true;

  // Regex extract all flat tokens like A811, B1802
  const extracted = recordFlatStr.toUpperCase().match(/[AB]\s*\d+/g);
  if (extracted) {
    const normalizedExtracted = extracted.map((e) => e.replace(/[\s-]/g, ''));
    if (normalizedExtracted.includes(target)) return true;
  }

  return false;
}

// Robust CSV Line & Cell Parser
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function getCachedContributions(): GaneshContributionRecord[] {
  try {
    const cached = localStorage.getItem('bps_ganesh_cached_contributions');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

export function getCachedGothram(): GaneshSankalpamRecord[] {
  try {
    const cached = localStorage.getItem('bps_ganesh_cached_gothram');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

// 1. Fetch & Parse Contributions & Sponsors from Google Sheet
export async function fetchLiveContributions(): Promise<GaneshContributionRecord[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GOOGLE_SHEET_CONTRIBUTIONS_CSV_URL, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.statusText}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    // Find header index
    let headerIdx = -1;
    let slNoCol = -1;
    let nameCol = -1;
    let flatCol = -1;
    let amountCol = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i].map((c) => c.toLowerCase());
      const nIdx = r.findIndex((c) => c.includes('name') || c.includes('resident'));
      const fIdx = r.findIndex((c) => c.includes('flat'));
      const aIdx = r.findIndex((c) => c.includes('amount') || c.includes('rs') || c.includes('₹'));
      const sIdx = r.findIndex((c) => c.includes('sl') || c.includes('no'));

      if (nIdx !== -1 && fIdx !== -1) {
        headerIdx = i;
        nameCol = nIdx;
        flatCol = fIdx;
        amountCol = aIdx !== -1 ? aIdx : fIdx + 1;
        slNoCol = sIdx !== -1 ? sIdx : 0;
        break;
      }
    }

    if (headerIdx === -1) {
      // Fallback standard columns: 2: Sl, 3: Name, 4: Flat, 5: Amount
      headerIdx = 0;
      slNoCol = 2;
      nameCol = 3;
      flatCol = 4;
      amountCol = 5;
    }

    const records: GaneshContributionRecord[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const rawName = row[nameCol] || '';
      const rawFlat = (row[flatCol] || '').toUpperCase();
      const rawAmt = row[amountCol] || '';
      const rawSlNo = row[slNoCol] || '';

      if (!rawName && !rawFlat) continue;
      if (/^(total|subtotal|grand total)$/i.test(rawName.trim())) continue;

      const numAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, '')) || 0;
      const parsedSlNo = parseInt(rawSlNo.replace(/[^0-9]/g, ''), 10) || records.length + 1;

      // Detect Sponsorship
      const isSponsor =
        /sponsor|sponser|idol|pujari|laddu|pooja item|mahaprasadam|flower/i.test(rawName);

      let sponsorCategory: string | undefined = undefined;
      let cleanName = rawName;

      const parenMatch = rawName.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const parenContent = parenMatch[1];
        if (/sponsor|sponser|idol|pujari|laddu|pooja|mahaprasadam/i.test(parenContent)) {
          sponsorCategory = parenContent
            .replace(/sponser/gi, 'Sponsor')
            .replace(/sponsorship/gi, 'Sponsor');
        }
        cleanName = rawName.replace(/\(([^)]+)\)/, '').trim();
      }

      let category: GaneshContributionType = 'General Contribution';
      if (isSponsor) {
        if (/idol/i.test(rawName)) category = 'Other';
        else if (/pujari/i.test(rawName)) category = 'Pujari Dakshina';
        else if (/laddu/i.test(rawName)) category = 'Laddu Auction';
        else if (/mahaprasadam|food/i.test(rawName)) category = 'Mahaprasadam';
        else if (/flower/i.test(rawName)) category = 'Flowers & Decoration';
        else category = 'Pooja Item';
      }

      const tower: 'A' | 'B' | 'Other' = rawFlat.startsWith('A')
        ? 'A'
        : rawFlat.startsWith('B')
          ? 'B'
          : 'Other';

      records.push({
        id: `live-contrib-${parsedSlNo}-${i}`,
        slNo: parsedSlNo,
        donorName: cleanName || rawName,
        flatNo: rawFlat,
        tower,
        amount: numAmt,
        contributionType: category,
        isSponsor,
        sponsorCategory,
        paymentMode: /cash/i.test(rawName) ? 'Cash' : 'UPI',
        verified: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Save to cache
    localStorage.setItem('bps_ganesh_cached_contributions', JSON.stringify(records));
    return records;
  } catch (err) {
    console.warn('Failed to fetch live contributions, falling back to cache:', err);
    const cached = localStorage.getItem('bps_ganesh_cached_contributions');
    if (cached) return JSON.parse(cached);
    return [];
  }
}

// 2. Fetch & Parse Gothram Pooja Responses from Google Sheet
export async function fetchLiveGothramResponses(): Promise<GaneshSankalpamRecord[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GOOGLE_SHEET_GOTHRAM_CSV_URL, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Failed to fetch gothram sheet: ${res.statusText}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length <= 1) return [];

    const records: GaneshSankalpamRecord[] = [];

    // Header expected: Timestamp, Block, Flat Number, Pooja Date, Family Gothram, Count, Names
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3) continue;

      const timestamp = row[0] || '';
      const block = (row[1] || '').toUpperCase().trim();
      let flatNum = (row[2] || '').toUpperCase().trim();
      const poojaDate = row[3] || '';
      const gothram = row[4] || '';
      const memberNamesRaw = row[6] || '';

      if (!flatNum && !gothram && !memberNamesRaw) continue;

      // Ensure flat starts with Tower prefix (e.g. 1102 -> A1102)
      if (block && !flatNum.startsWith('A') && !flatNum.startsWith('B')) {
        flatNum = `${block}${flatNum}`;
      }

      const tower: 'A' | 'B' | 'Other' = flatNum.startsWith('A')
        ? 'A'
        : flatNum.startsWith('B')
          ? 'B'
          : 'Other';

      // Parse family members by newline, comma, or 'and'
      const rawNamesList = memberNamesRaw
        .split(/[\n\r,]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      const familyMembers = rawNamesList.map((name, idx) => ({
        id: `fam-${i}-${idx}`,
        name: name.replace(/^and\s+/i, '').trim(),
      }));

      const primaryName = familyMembers.length > 0 ? familyMembers[0].name : `Flat ${flatNum}`;

      records.push({
        id: `gothram-${i}`,
        flatNo: flatNum,
        tower,
        primaryResidentName: primaryName,
        gothram: gothram.trim() || 'General / Shiva-Vishnu',
        familyMembers,
        preferredPujaDate: poojaDate.trim() || undefined,
        submittedAt: timestamp || new Date().toISOString(),
      });
    }

    localStorage.setItem('bps_ganesh_cached_gothram', JSON.stringify(records));
    return records;
  } catch (err) {
    console.warn('Failed to fetch live gothram, falling back to cache:', err);
    const cached = localStorage.getItem('bps_ganesh_cached_gothram');
    if (cached) return JSON.parse(cached);
    return [];
  }
}

// 3. Local Expenses Management
const EXPENSES_STORAGE_KEY = 'bps_ganesh_live_expenses';

const DEFAULT_EXPENSES: GaneshExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'Pandal & Stage Decoration Setup',
    category: 'Pandal & Decoration',
    amount: 45000,
    paidTo: 'Sri Balaji Pandal Works',
    paymentMode: 'Bank Transfer',
    expenseDate: '2026-09-08',
    invoiceNo: 'INV-7701',
    status: 'Paid',
    notes: 'Advance 50% paid for 5 days shamiana & lighting',
    createdAt: '2026-09-08T10:00:00.000Z',
  },
  {
    id: 'exp-2',
    title: 'Eco-Friendly Clay Ganesh Idol Advance',
    category: 'Idol & Visarjan',
    amount: 18000,
    paidTo: 'Dhoolpet Murti Arts',
    paymentMode: 'UPI',
    expenseDate: '2026-09-06',
    invoiceNo: 'REC-304',
    status: 'Paid',
    notes: '8-feet traditional clay idol booking',
    createdAt: '2026-09-06T10:00:00.000Z',
  },
  {
    id: 'exp-3',
    title: 'Daily Archana Flowers & Garlands',
    category: 'Priest & Puja Samagri',
    amount: 12500,
    paidTo: 'Gudimalkapur Flower Market',
    paymentMode: 'Cash',
    expenseDate: '2026-09-09',
    invoiceNo: 'VCH-12',
    status: 'Paid',
    notes: 'Bulk booking for 5 festival days',
    createdAt: '2026-09-09T10:00:00.000Z',
  },
];

export const GOOGLE_SHEET_EXPENSES_STORAGE_KEY = 'bps_ganesh_expense_sheet_url';

export function getExpenseSheetUrl(): string {
  return localStorage.getItem(GOOGLE_SHEET_EXPENSES_STORAGE_KEY) || '';
}

export function setExpenseSheetUrl(url: string): void {
  localStorage.setItem(GOOGLE_SHEET_EXPENSES_STORAGE_KEY, url.trim());
}

/**
 * Normalizes any Google Sheet URL (Sharing link, Edit link, or PubHTML)
 * into a direct downloadable CSV URL.
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();

  // If already a tq/csv link
  if (trimmed.includes('tqx=out:csv') || trimmed.includes('output=csv')) {
    return trimmed;
  }

  // Published web link: /pubhtml -> /pub?output=csv
  if (trimmed.includes('/pubhtml')) {
    return trimmed.replace('/pubhtml', '/pub?output=csv');
  }

  // Standard sheet URL: /d/{sheetId}/edit#gid={gid}
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  return trimmed;
}

export function getCachedExpenses(): GaneshExpenseRecord[] {
  const data = localStorage.getItem(EXPENSES_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(DEFAULT_EXPENSES));
    return DEFAULT_EXPENSES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_EXPENSES;
  }
}

export function getGaneshExpenses(): GaneshExpenseRecord[] {
  return getCachedExpenses();
}

/**
 * 3. Fetch & Parse Live Expenses from Google Sheet
 */
export async function fetchLiveExpenses(): Promise<GaneshExpenseRecord[]> {
  const customUrl = getExpenseSheetUrl();
  if (!customUrl) {
    return getCachedExpenses();
  }

  const csvUrl = normalizeGoogleSheetCsvUrl(customUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(csvUrl, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Expense HTTP ${res.status}`);

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) return getCachedExpenses();

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const findIdx = (keywords: string[]) =>
      headers.findIndex((h) => keywords.some((k) => h.includes(k)));

    const titleIdx = findIdx(['title', 'item', 'description', 'particulars', 'expense']);
    const categoryIdx = findIdx(['category', 'type', 'head']);
    const amountIdx = findIdx(['amount', 'cost', 'price', 'rs', 'inr', 'total']);
    const paidToIdx = findIdx(['paid to', 'vendor', 'payee', 'name', 'recipient', 'beneficiary']);
    const modeIdx = findIdx(['mode', 'payment mode', 'method', 'via']);
    const dateIdx = findIdx(['date', 'time', 'timestamp']);
    const invoiceIdx = findIdx(['invoice', 'bill', 'receipt', 'voucher', 'ref']);
    const statusIdx = findIdx(['status', 'state']);
    const notesIdx = findIdx(['note', 'notes', 'remarks', 'comment', 'approved']);

    const validExpenses: GaneshExpenseRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const title = (titleIdx !== -1 ? row[titleIdx] : row[1]) || '';
      if (!title || title.trim() === '') continue;

      // Skip summary / total rows
      const lowerTitle = title.toLowerCase().trim();
      if (
        lowerTitle === 'total' ||
        lowerTitle === 'subtotal' ||
        lowerTitle === 'grand total' ||
        lowerTitle.startsWith('total ')
      ) {
        continue;
      }

      // Parse Amount
      const rawAmt = (amountIdx !== -1 ? row[amountIdx] : row[3]) || '0';
      const cleanAmtStr = rawAmt.replace(/[^0-9.]/g, '');
      const amount = parseFloat(cleanAmtStr) || 0;
      if (amount <= 0) continue;

      // Category parsing
      const rawCategory = (categoryIdx !== -1 ? row[categoryIdx] : row[2]) || '';
      let category: GaneshExpenseCategory = 'Misc & Contingency';
      const catLower = rawCategory.toLowerCase();
      if (catLower.includes('idol') || catLower.includes('visarjan') || catLower.includes('murti')) {
        category = 'Idol & Visarjan';
      } else if (catLower.includes('pandal') || catLower.includes('tent') || catLower.includes('decor') || catLower.includes('stage')) {
        category = 'Pandal & Decoration';
      } else if (catLower.includes('priest') || catLower.includes('pujari') || catLower.includes('samagri') || catLower.includes('flower') || catLower.includes('pooja')) {
        category = 'Priest & Puja Samagri';
      } else if (catLower.includes('prasad') || catLower.includes('food') || catLower.includes('anna') || catLower.includes('sweet') || catLower.includes('laddu')) {
        category = 'Mahaprasadam & Food';
      } else if (catLower.includes('sound') || catLower.includes('light') || catLower.includes('mic') || catLower.includes('dj') || catLower.includes('gen')) {
        category = 'Sound & Lighting';
      } else if (catLower.includes('cultural') || catLower.includes('event') || catLower.includes('gift') || catLower.includes('prize')) {
        category = 'Cultural Events & Gifts';
      } else if (catLower.includes('security') || catLower.includes('clean') || catLower.includes('guard')) {
        category = 'Security & Cleaning';
      }

      // Payment Mode
      const rawMode = (modeIdx !== -1 ? row[modeIdx] : '') || 'UPI';
      const modeLower = rawMode.toLowerCase();
      let paymentMode: GaneshPaymentMode = 'UPI';
      if (modeLower.includes('cash')) paymentMode = 'Cash';
      else if (modeLower.includes('bank') || modeLower.includes('neft') || modeLower.includes('rtgs') || modeLower.includes('transfer')) paymentMode = 'Bank Transfer';
      else if (modeLower.includes('cheque') || modeLower.includes('check')) paymentMode = 'Cheque';

      // Date
      const rawDate = (dateIdx !== -1 ? row[dateIdx] : '') || new Date().toISOString().split('T')[0];

      // Status
      const rawStatus = (statusIdx !== -1 ? row[statusIdx] : '') || 'Paid';
      let status: 'Paid' | 'Pending Reimbursement' | 'Planned' = 'Paid';
      if (rawStatus.toLowerCase().includes('reimburse') || rawStatus.toLowerCase().includes('pending')) {
        status = 'Pending Reimbursement';
      } else if (rawStatus.toLowerCase().includes('plan')) {
        status = 'Planned';
      }

      const paidTo = (paidToIdx !== -1 ? row[paidToIdx] : '') || 'Vendor';
      const invoiceNo = (invoiceIdx !== -1 ? row[invoiceIdx] : undefined);
      const notes = (notesIdx !== -1 ? row[notesIdx] : undefined);

      validExpenses.push({
        id: `live-exp-${i}`,
        title: title.trim(),
        category,
        amount,
        paidTo: paidTo.trim(),
        paymentMode,
        expenseDate: rawDate.trim(),
        invoiceNo: invoiceNo?.trim(),
        status,
        notes: notes?.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    if (validExpenses.length > 0) {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(validExpenses));
      return validExpenses;
    }
    return getCachedExpenses();
  } catch (err) {
    console.warn('Could not fetch live expenses sheet, using cached data:', err);
    return getCachedExpenses();
  }
}

export function addGaneshExpense(expense: Omit<GaneshExpenseRecord, 'id'>): GaneshExpenseRecord {
  const current = getGaneshExpenses();
  const newRec: GaneshExpenseRecord = {
    ...expense,
    id: `exp-${Date.now()}`,
  };
  const updated = [newRec, ...current];
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));

  syncExpenseToGoogleSheet(newRec);

  return newRec;
}

export function updateGaneshExpense(id: string, updatedFields: Partial<GaneshExpenseRecord>): GaneshExpenseRecord | null {
  const current = getGaneshExpenses();
  let updatedRec: GaneshExpenseRecord | null = null;
  const updated = current.map((e) => {
    if (e.id === id) {
      updatedRec = { ...e, ...updatedFields };
      return updatedRec;
    }
    return e;
  });
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));

  if (updatedRec) {
    syncExpenseToGoogleSheet(updatedRec);
  }

  return updatedRec;
}

export async function syncExpenseToGoogleSheet(expense: GaneshExpenseRecord): Promise<void> {
  const webhookUrl = getAppsScriptUrl();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveExpense',
        expenseId: expense.id,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        paidTo: expense.paidTo,
        paymentMode: expense.paymentMode,
        expenseDate: expense.expenseDate,
        invoiceNo: expense.invoiceNo || '',
        status: expense.status,
        notes: expense.notes || '',
        approvedBy: expense.approvedBy || '',
      }),
    });
  } catch (err) {
    console.warn('Could not sync expense to webhook:', err);
  }
}

export function deleteGaneshExpense(id: string): void {
  const current = getGaneshExpenses();
  const updated = current.filter((e) => e.id !== id);
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
}

export function addGaneshContribution(contribution: Omit<GaneshContributionRecord, 'id' | 'createdAt' | 'tower'>): GaneshContributionRecord {
  const cached = localStorage.getItem('bps_ganesh_cached_contributions');
  const current: GaneshContributionRecord[] = cached ? JSON.parse(cached) : [];
  const rawFlat = contribution.flatNo.toUpperCase();
  const tower = rawFlat.startsWith('A') ? 'A' : rawFlat.startsWith('B') ? 'B' : 'Other';

  const newRec: GaneshContributionRecord = {
    ...contribution,
    id: `custom-contrib-${Date.now()}`,
    tower,
    createdAt: new Date().toISOString(),
  };
  const updated = [newRec, ...current];
  localStorage.setItem('bps_ganesh_cached_contributions', JSON.stringify(updated));
  return newRec;
}

export const APPS_SCRIPT_STORAGE_KEY = 'bps_ganesh_apps_script_url';

export function getAppsScriptUrl(): string {
  return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || '';
}

export function setAppsScriptUrl(url: string): void {
  localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
}

export async function submitGothramToGoogleSheet(sankalpam: Omit<GaneshSankalpamRecord, 'id' | 'submittedAt' | 'tower'>): Promise<{ success: boolean; message: string }> {
  // 1. First save to local cache for immediate optimistic UI update
  addGaneshSankalpam(sankalpam);

  const webhookUrl = getAppsScriptUrl();
  const rawFlat = sankalpam.flatNo.toUpperCase().trim();
  const blockMatch = rawFlat.match(/^([AB])/i);
  const block = blockMatch ? blockMatch[1].toUpperCase() : 'A';
  const flatNumber = rawFlat.replace(/^[AB]/i, '').trim() || rawFlat;

  const membersText = sankalpam.familyMembers
    .map((m) => {
      let line = m.name;
      if (m.relationship && m.relationship !== 'Self') line += ` (${m.relationship})`;
      if (m.nakshatram) line += ` - ${m.nakshatram}`;
      return line;
    })
    .join('\n');

  const payload = {
    timestamp: new Date().toLocaleString('en-US'),
    block,
    flatNumber,
    poojaDate: sankalpam.preferredPujaDate || 'All Festival Days',
    gothram: sankalpam.gothram,
    count: sankalpam.familyMembers.length,
    names: membersText,
    primaryResident: sankalpam.primaryResidentName,
  };

  if (!webhookUrl) {
    return {
      success: true,
      message: 'Saved locally. (To sync with Google Sheets, add your Apps Script URL in Settings)',
    };
  }

  try {
    // Submit to Google Apps Script Web App
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Successfully submitted directly to Google Sheet!',
    };
  } catch (err) {
    console.error('Failed to post to Google Apps Script Webhook:', err);
    return {
      success: false,
      message: 'Failed to send to Google Sheet webhook, but saved locally.',
    };
  }
}

export function addGaneshSankalpam(sankalpam: Omit<GaneshSankalpamRecord, 'id' | 'submittedAt' | 'tower'>): GaneshSankalpamRecord {
  const cached = localStorage.getItem('bps_ganesh_cached_gothram');
  const current: GaneshSankalpamRecord[] = cached ? JSON.parse(cached) : [];
  const rawFlat = sankalpam.flatNo.toUpperCase();
  const tower = rawFlat.startsWith('A') ? 'A' : rawFlat.startsWith('B') ? 'B' : 'Other';

  const newRec: GaneshSankalpamRecord = {
    ...sankalpam,
    id: `custom-gothram-${Date.now()}`,
    tower,
    submittedAt: new Date().toISOString(),
  };
  const updated = [newRec, ...current];
  localStorage.setItem('bps_ganesh_cached_gothram', JSON.stringify(updated));
  return newRec;
}

// 4. Financial Calculations
export function calculateGaneshSummary(
  contributions: GaneshContributionRecord[],
  expenses: GaneshExpenseRecord[],
  sankalpams: GaneshSankalpamRecord[]
): GaneshFinancialSummary {
  const targetBudget = 350000;
  let totalCollections = 0;
  let totalContributions = 0;
  let totalSponsorships = 0;
  let towerAAmount = 0;
  let towerACount = 0;
  let towerBAmount = 0;
  let towerBCount = 0;
  let totalSponsorsCount = 0;

  contributions.forEach((c) => {
    totalCollections += c.amount || 0;
    if (c.isSponsor) {
      totalSponsorships += c.amount || 0;
      totalSponsorsCount++;
    } else {
      totalContributions += c.amount || 0;
    }
    if (c.tower === 'A') {
      towerAAmount += c.amount || 0;
      towerACount++;
    } else if (c.tower === 'B') {
      towerBAmount += c.amount || 0;
      towerBCount++;
    }
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBalance = totalCollections - totalExpenses;

  return {
    targetBudget,
    totalContributions,
    totalSponsorships,
    totalCollections,
    totalExpenses,
    netBalance,
    towerAAmount,
    towerACount,
    towerBAmount,
    towerBCount,
    totalContributorsCount: contributions.length,
    totalSponsorsCount,
    sankalpamCount: sankalpams.length,
  };
}

// 5. CSV Exporters
export function exportGaneshCollectionsCSV(contributions: GaneshContributionRecord[]): string {
  const headers = ['Sl No', 'Donor Name', 'Flat No', 'Tower', 'Amount (INR)', 'Type', 'Is Sponsor', 'Sponsor Category', 'Payment Mode', 'Verified'];
  const rows = contributions.map((c, idx) => [
    c.slNo || idx + 1,
    `"${c.donorName.replace(/"/g, '""')}"`,
    c.flatNo,
    c.tower,
    c.amount,
    `"${c.contributionType}"`,
    c.isSponsor ? 'Yes' : 'No',
    `"${(c.sponsorCategory || '').replace(/"/g, '""')}"`,
    c.paymentMode,
    c.verified ? 'Verified' : 'Pending',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportGaneshExpensesCSV(expenses: GaneshExpenseRecord[]): string {
  const headers = ['Invoice No', 'Expense Title', 'Category', 'Amount (INR)', 'Paid To', 'Payment Mode', 'Date', 'Status', 'Notes'];
  const rows = expenses.map((e) => [
    e.invoiceNo || 'N/A',
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    e.amount,
    `"${e.paidTo.replace(/"/g, '""')}"`,
    e.paymentMode,
    e.expenseDate,
    e.status,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportGaneshSankalpamCSV(sankalpams: GaneshSankalpamRecord[]): string {
  const headers = ['Sl No', 'Flat No', 'Tower', 'Family Gothram', 'Primary Resident', 'Puja Date Preference', 'Family Members'];
  const rows = sankalpams.map((s, idx) => [
    idx + 1,
    s.flatNo,
    s.tower,
    `"${s.gothram.replace(/"/g, '""')}"`,
    `"${s.primaryResidentName.replace(/"/g, '""')}"`,
    `"${(s.preferredPujaDate || '').replace(/"/g, '""')}"`,
    `"${s.familyMembers.map((m) => m.name).join('; ').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
