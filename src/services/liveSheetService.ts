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
export const GOOGLE_SHEET_CONTRIBUTIONS_STORAGE_KEY = 'bps_ganesh_contributions_sheet_url';
export const DEFAULT_CONTRIBUTIONS_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ExhYq2D0bCV2R8J9IJpRcAER9LGPBkVZ/gviz/tq?tqx=out:csv&gid=960844894';

export function getContributionsSheetUrl(): string {
  return localStorage.getItem(GOOGLE_SHEET_CONTRIBUTIONS_STORAGE_KEY) || DEFAULT_CONTRIBUTIONS_SHEET_URL;
}

export function setContributionsSheetUrl(url: string): void {
  localStorage.setItem(GOOGLE_SHEET_CONTRIBUTIONS_STORAGE_KEY, url.trim());
}

export const GOOGLE_SHEET_GOTHRAM_STORAGE_KEY = 'bps_ganesh_gothram_sheet_url';
export const DEFAULT_GOTHRAM_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1LKO614ka9F_G9B2OG-wqsZCT9Bk-c2COc1mpFPFT-M4/gviz/tq?tqx=out:csv&gid=984412802';

export function getGothramSheetUrl(): string {
  return localStorage.getItem(GOOGLE_SHEET_GOTHRAM_STORAGE_KEY) || DEFAULT_GOTHRAM_SHEET_URL;
}

export function setGothramSheetUrl(url: string): void {
  localStorage.setItem(GOOGLE_SHEET_GOTHRAM_STORAGE_KEY, url.trim());
}

export const MASTER_PORTAL_STORAGE_KEY = 'bps_ganesh_master_portal_url';
export const DEFAULT_MASTER_PORTAL_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/19wJOLle-co42OSM083JZWSrD_IIAOy6wUmoWsRVeM1M/edit?usp=sharing';

export function getMasterPortalSheetUrl(): string {
  return localStorage.getItem(MASTER_PORTAL_STORAGE_KEY) || DEFAULT_MASTER_PORTAL_SPREADSHEET_URL;
}

export function setMasterPortalSheetUrl(url: string): void {
  localStorage.setItem(MASTER_PORTAL_STORAGE_KEY, url.trim());
}

export const GOOGLE_SHEET_CONTRIBUTIONS_CSV_URL = DEFAULT_CONTRIBUTIONS_SHEET_URL;
export const GOOGLE_SHEET_GOTHRAM_CSV_URL = DEFAULT_GOTHRAM_SHEET_URL;

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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const targetUrl = normalizeGoogleSheetCsvUrl(getContributionsSheetUrl());
    const res = await fetch(targetUrl, {
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const targetUrl = normalizeGoogleSheetCsvUrl(getGothramSheetUrl());
    const res = await fetch(targetUrl, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Failed to fetch gothram sheet: ${res.statusText}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length <= 1) return [];

    // Locate columns dynamically from header
    let headerIdx = 0;
    let blockCol = 1;
    let flatCol = 2;
    let dateCol = 3;
    let gothramCol = 4;
    let countCol = 5;
    let namesCol = 6;

    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const r = rows[i].map((c) => c.toLowerCase().trim());
      const b = r.findIndex((c) => c.includes('block') || c.includes('tower'));
      const f = r.findIndex((c) => c.includes('flat') || c.includes('unit'));
      const g = r.findIndex((c) => c.includes('gothram') || c.includes('gotra'));
      const cnt = r.findIndex((c) => c.includes('count'));
      const n = r.findIndex((c) => (c.includes('name') || c.includes('member')) && !c.includes('count'));
      const d = r.findIndex((c) => c.includes('date') || c.includes('pooja') || c.includes('day'));

      if (f !== -1 && g !== -1) {
        headerIdx = i;
        if (b !== -1) blockCol = b;
        flatCol = f;
        gothramCol = g;
        if (cnt !== -1) countCol = cnt;
        if (n !== -1) namesCol = n;
        if (d !== -1) dateCol = d;
        break;
      }
    }

    const records: GaneshSankalpamRecord[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;

      const timestamp = row[0] || '';
      const rawBlock = (row[blockCol] || '').toUpperCase().trim();
      let rawFlat = (row[flatCol] || '').toUpperCase().trim();
      const poojaDate = (row[dateCol] || '').trim();
      const rawGothram = (row[gothramCol] || '').trim();
      const rawCount = (row[countCol] || '').trim();
      const rawNames = (row[namesCol] || '').trim();

      if (!rawFlat && !rawGothram && !rawNames) continue;

      let cleanFlat = rawFlat.replace(/[\s-]/g, '').replace(/^FLAT/i, '');
      let cleanBlock = rawBlock.replace(/[\s-]/g, '').replace(/^BLOCK/i, '').replace(/^TOWER/i, '');

      if (!cleanFlat && cleanBlock) {
        cleanFlat = cleanBlock;
      } else if (cleanBlock && !cleanFlat.startsWith('A') && !cleanFlat.startsWith('B')) {
        cleanFlat = `${cleanBlock}${cleanFlat}`;
      }

      const tower: 'A' | 'B' | 'Other' = cleanFlat.startsWith('A')
        ? 'A'
        : cleanFlat.startsWith('B')
          ? 'B'
          : 'Other';

      // Parse member names (splitting by newlines, commas, semicolons)
      const rawNamesList = rawNames
        .split(/[\n\r,;]+/)
        .map((n) => n.trim().replace(/^and\s+/i, '').replace(/^[0-9]+[.)]\s*/, ''))
        .filter((n) => n.length > 0 && isNaN(Number(n)));

      const familyMembers = rawNamesList.map((name, idx) => ({
        id: `fam-${i}-${idx}`,
        name,
      }));

      const parsedCount = parseInt(rawCount, 10);
      const effectiveCount = !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : familyMembers.length;
      const primaryName = familyMembers.length > 0 ? familyMembers[0].name : `Flat ${cleanFlat}`;

      records.push({
        id: `gothram-${i}`,
        flatNo: cleanFlat,
        tower,
        primaryResidentName: primaryName,
        gothram: rawGothram || 'General / Shiva-Vishnu',
        familyMembers,
        membersCount: effectiveCount,
        preferredPujaDate: poojaDate || undefined,
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
    title: 'Eco-Friendly Clay Ganesh Idol Advance',
    category: 'Idol & Visarjan',
    amount: 22500,
    paidTo: 'Dhoolpet Murti Arts',
    paymentMode: 'UPI',
    expenseDate: '2026-09-06',
    invoiceNo: 'REC-304',
    status: 'Paid',
    notes: '8-feet traditional clay idol booking',
    createdAt: '2026-09-06T10:00:00.000Z',
  },
  {
    id: 'exp-2',
    title: 'Mahaprasadam cook Advance',
    category: 'Mahaprasadam & Food',
    amount: 5000,
    paidTo: 'mallela pentaiah',
    paymentMode: 'UPI',
    expenseDate: '2026-09-10',
    invoiceNo: '',
    status: 'Pending Reimbursement',
    notes: 'balance need to pay',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'exp-3',
    title: 'Band ganesh entry',
    category: 'Sound & Lighting',
    amount: 3000,
    paidTo: 'band',
    paymentMode: 'UPI',
    expenseDate: '2026-09-10',
    invoiceNo: '',
    status: 'Paid',
    notes: '3members',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'exp-4',
    title: 'ganesh entry (fruits, pooja items, flowers, sweets etc)',
    category: 'Priest & Puja Samagri',
    amount: 752,
    paidTo: 'pooja items store',
    paymentMode: 'UPI',
    expenseDate: '2026-09-10',
    invoiceNo: '',
    status: 'Paid',
    notes: 'fruits kanduva flowers sweets',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'exp-5',
    title: 'ganesh entry fire crackers',
    category: 'Sound & Lighting',
    amount: 4600,
    paidTo: 'shanti fire works',
    paymentMode: 'UPI',
    expenseDate: '2026-09-10',
    invoiceNo: '',
    status: 'Paid',
    notes: '5items, 60shot, 30shot, 2shot, 5000wala, pots',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
];

export const GOOGLE_SHEET_EXPENSES_STORAGE_KEY = 'bps_ganesh_expense_sheet_url';
export const DEFAULT_EXPENSE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/19wJOLle-co42OSM083JZWSrD_IIAOy6wUmoWsRVeM1M/gviz/tq?tqx=out:csv&sheet=Expenses';

export function getExpenseSheetUrl(): string {
  const stored = localStorage.getItem(GOOGLE_SHEET_EXPENSES_STORAGE_KEY);
  if (
    !stored ||
    stored.includes('1S1jLDNtDtoen4xCufk3z5ks-kEHDtfWGvjDMpjN0I0g') ||
    stored.includes('script.google.com') ||
    stored.includes('AKfycbxsn0bLVTyEm5R8bR4N')
  ) {
    localStorage.setItem(GOOGLE_SHEET_EXPENSES_STORAGE_KEY, DEFAULT_EXPENSE_SHEET_URL);
    return DEFAULT_EXPENSE_SHEET_URL;
  }
  return stored;
}

export function setExpenseSheetUrl(url: string): void {
  localStorage.setItem(GOOGLE_SHEET_EXPENSES_STORAGE_KEY, url.trim());
}

/**
 * Normalizes any Google Sheet URL (Sharing link, Edit link, or PubHTML)
 * into a direct downloadable CSV URL.
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string, defaultTab?: string): string {
  if (!rawUrl || !rawUrl.trim() || rawUrl.includes('script.google.com')) {
    if (defaultTab) {
      return `https://docs.google.com/spreadsheets/d/${MASTER_PORTAL_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(defaultTab)}`;
    }
    return '';
  }
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

    const sheetParamMatch = trimmed.match(/[?&]sheet=([^&#]+)/);
    if (sheetParamMatch && sheetParamMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetParamMatch[1]}`;
    }

    if (sheetId === MASTER_PORTAL_SPREADSHEET_ID && defaultTab) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(defaultTab)}`;
    }

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
  const csvUrl = normalizeGoogleSheetCsvUrl(customUrl, 'Expenses');

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

    // 1. Robust Header Row Detection (Avoid Top KPI / Total Cards)
    let headerIdx = -1;
    for (let r = 0; r < rows.length; r++) {
      const rowLower = rows[r].map((c) => c.toLowerCase().trim());
      if (
        rowLower.some((c) => c === 'expense title' || c === 'title') ||
        (rowLower.some((c) => c === 'category') &&
          rowLower.some((c) => c.includes('vendor') || c.includes('paid')))
      ) {
        headerIdx = r;
        break;
      }
    }

    // Default indices if headers row isn't explicit
    let titleIdx = 1;
    let categoryIdx = 2;
    let amountIdx = 3;
    let paidToIdx = 4;
    let modeIdx = 5;
    let dateIdx = 6;
    let statusIdx = 7;
    let invoiceIdx = 8;
    let notesIdx = 9;

    if (headerIdx !== -1) {
      const h = rows[headerIdx].map((c) => c.toLowerCase().trim());
      const findCol = (keywords: string[]) =>
        h.findIndex((c) =>
          keywords.some(
            (k) => c === k || (c.includes(k) && !c.includes('total'))
          )
        );

      const t = findCol(['expense title', 'title', 'particulars', 'item', 'description']);
      if (t !== -1) titleIdx = t;

      const cat = findCol(['category', 'head', 'type']);
      if (cat !== -1) categoryIdx = cat;

      const amt = findCol(['amount', 'cost', 'price', 'rs', 'inr']);
      if (amt !== -1) amountIdx = amt;

      const p = findCol(['vendor / paid to', 'vendor', 'paid to', 'payee', 'name']);
      if (p !== -1) paidToIdx = p;

      const m = findCol(['payment mode', 'mode', 'method']);
      if (m !== -1) modeIdx = m;

      const d = findCol(['expense date', 'date', 'time', 'timestamp']);
      if (d !== -1) dateIdx = d;

      const s = findCol(['status', 'state']);
      if (s !== -1) statusIdx = s;

      const inv = findCol(['invoice no', 'invoice', 'bill', 'receipt', 'voucher', 'inv']);
      if (inv !== -1) invoiceIdx = inv;

      const n = findCol(['notes', 'note', 'remarks', 'comment', 'approved']);
      if (n !== -1) notesIdx = n;
    }

    const validExpenses: GaneshExpenseRecord[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const title = (row[titleIdx] || row[1] || '').trim();
      if (
        !title ||
        title.toLowerCase().startsWith('total') ||
        title.includes('₹35,852') ||
        title.toLowerCase() === 'grand total'
      ) {
        continue;
      }

      // Check Category
      const rawCategory = (row[categoryIdx] || row[2] || '').trim();
      if (rawCategory.toLowerCase().includes('total')) {
        continue;
      }

      // Parse Amount
      const rawAmt = (row[amountIdx] || row[3] || '').replace(/[^0-9.]/g, '');
      const amount = parseFloat(rawAmt) || 0;
      if (amount <= 0) continue;

      // Category parsing
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
      } else if (catLower.includes('celebration')) {
        category = 'Celebrations';
      } else if (catLower.includes('misc') || catLower.includes('contingency') || catLower.includes('other')) {
        category = 'Misc & Contingency';
      }

      // Payment Mode
      const rawMode = (row[modeIdx] || row[5] || '').toLowerCase();
      let paymentMode: GaneshPaymentMode = 'UPI';
      if (rawMode.includes('cash')) paymentMode = 'Cash';
      else if (rawMode.includes('bank') || rawMode.includes('neft') || rawMode.includes('rtgs') || rawMode.includes('transfer')) paymentMode = 'Bank Transfer';
      else if (rawMode.includes('cheque') || rawMode.includes('check')) paymentMode = 'Cheque';

      // Date
      const rawDate = (row[dateIdx] || row[6] || '').trim() || new Date().toISOString().split('T')[0];

      // Status
      const rawStatus = (row[statusIdx] || row[7] || '').trim().toLowerCase();
      let status: 'Paid' | 'Pending Reimbursement' | 'Planned' = 'Paid';
      if (rawStatus.includes('reimburse') || rawStatus.includes('pending')) {
        status = 'Pending Reimbursement';
      } else if (rawStatus.includes('plan')) {
        status = 'Planned';
      }

      const paidTo = (row[paidToIdx] || row[4] || '').trim() || 'Vendor';
      const invoiceNo = (row[invoiceIdx] || row[8] || '').trim();
      const notes = (row[notesIdx] || row[9] || '').trim();

      validExpenses.push({
        id: `live-exp-${i}`,
        title: title.trim(),
        category,
        amount,
        paidTo,
        paymentMode,
        expenseDate: rawDate,
        invoiceNo: invoiceNo && invoiceNo !== '-' ? invoiceNo : undefined,
        status,
        notes: notes && notes !== '-' ? notes : undefined,
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

export function addGaneshExpense(expense: Omit<GaneshExpenseRecord, 'id'> | Omit<GaneshExpenseRecord, 'id' | 'createdAt'>): GaneshExpenseRecord {
  const current = getGaneshExpenses();
  const newRec: GaneshExpenseRecord = {
    ...expense,
    id: `exp-${Date.now()}`,
    createdAt: ('createdAt' in expense && expense.createdAt) ? expense.createdAt : new Date().toISOString(),
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
  const webhookUrl = getExpensesAppsScriptUrl();
  if (!webhookUrl) return;

  try {
    const payload = {
      action: 'saveExpense',
      invoiceNo: expense.invoiceNo || `INV-${Date.now()}`,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      paidTo: expense.paidTo || '',
      paymentMode: expense.paymentMode || 'UPI',
      expenseDate: expense.expenseDate || new Date().toISOString().split('T')[0],
      status: expense.status || 'Paid',
      notes: expense.notes || '',
      approvedBy: expense.approvedBy || '',
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
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
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwWButnA4pf1IuiHaIl_gidgFn7ToiPFIQaOpcBAn_KvdwfJyA6MNk2uV3H66p-h2gb/exec';

export function getAppsScriptUrl(): string {
  return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || DEFAULT_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(url: string): void {
  localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
}

export const CULTURAL_APPS_SCRIPT_STORAGE_KEY = 'bps_ganesh_cultural_apps_script_url';
export const DEFAULT_CULTURAL_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwWButnA4pf1IuiHaIl_gidgFn7ToiPFIQaOpcBAn_KvdwfJyA6MNk2uV3H66p-h2gb/exec';
export const EXPENSES_APPS_SCRIPT_STORAGE_KEY = 'bps_ganesh_expenses_apps_script_url';
export const DEFAULT_EXPENSES_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwWButnA4pf1IuiHaIl_gidgFn7ToiPFIQaOpcBAn_KvdwfJyA6MNk2uV3H66p-h2gb/exec';

export function getCulturalAppsScriptUrl(): string {
  const stored = localStorage.getItem(CULTURAL_APPS_SCRIPT_STORAGE_KEY);
  if (!stored || stored.includes('AKfycbxRGpinnY0Smkl1C2_') || stored.includes('AKfycbw1JOhnsIXKfitrckZv') || stored.includes('AKfycbyK_c-t9brIJicFnVr')) {
    localStorage.setItem(CULTURAL_APPS_SCRIPT_STORAGE_KEY, DEFAULT_CULTURAL_APPS_SCRIPT_URL);
    return DEFAULT_CULTURAL_APPS_SCRIPT_URL;
  }
  return stored;
}

export function setCulturalAppsScriptUrl(url: string): void {
  localStorage.setItem(CULTURAL_APPS_SCRIPT_STORAGE_KEY, url.trim());
}

export function getExpensesAppsScriptUrl(): string {
  const stored = localStorage.getItem(EXPENSES_APPS_SCRIPT_STORAGE_KEY);
  if (!stored || stored.includes('AKfycbxRGpinnY0Smkl1C2_') || stored.includes('AKfycbyK_c-t9brIJicFnVr') || stored.includes('AKfycbw1JOhnsIXKfitrckZv')) {
    localStorage.setItem(EXPENSES_APPS_SCRIPT_STORAGE_KEY, DEFAULT_EXPENSES_APPS_SCRIPT_URL);
    return DEFAULT_EXPENSES_APPS_SCRIPT_URL;
  }
  return stored;
}

export function setExpensesAppsScriptUrl(url: string): void {
  localStorage.setItem(EXPENSES_APPS_SCRIPT_STORAGE_KEY, url.trim());
}

export async function submitGothramToGoogleSheet(sankalpam: Omit<GaneshSankalpamRecord, 'id' | 'submittedAt' | 'tower'>): Promise<{ success: boolean; message: string }> {
  // Gothram Pooja is managed exclusively via the official Google Form (no Apps Script)
  addGaneshSankalpam(sankalpam);
  return {
    success: true,
    message: 'Saved locally. Responses are synced live from the Google Form sheet.',
  };
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

// ============================================================================
// 6. BPS GANESH UTSAV 2026 - MASTER PORTAL LIVE GOOGLE SHEET SYNC
// ============================================================================
export const MASTER_PORTAL_SPREADSHEET_ID = '19wJOLle-co42OSM083JZWSrD_IIAOy6wUmoWsRVeM1M';
export const MASTER_PORTAL_URL = 'https://docs.google.com/spreadsheets/d/19wJOLle-co42OSM083JZWSrD_IIAOy6wUmoWsRVeM1M/edit?usp=sharing';

export function getMasterSheetCsvUrl(tabName: 'Events' | 'Event Team' | 'Cultural' | 'Prasadam' | 'Expenses'): string {
  return `https://docs.google.com/spreadsheets/d/${MASTER_PORTAL_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

export interface LiveMasterEventItem {
  id: string;
  dayNumber: number;
  dateStr?: string;
  dayLabel: string;
  dateKey: 'sep14' | 'sep15' | 'sep16' | 'sep17' | 'sep18' | 'sep19';
  month: string;
  day: string;
  title: string;
  category: 'Rituals & Pooja' | 'Event Team';
  timeSlot: string;
  location: string;
  description: string;
  rituals?: string[];
  spocName?: string;
  spocPhone?: string;
}

export interface LiveMasterTeamItem {
  teamName: string;
  teamPurpose: string;
  spocName: string;
  flatNo: string;
  tower: string;
  phone: string;
}

export interface LiveMasterCulturalItem {
  id: string;
  date: string;
  timeSlot: string;
  durationMins?: string;
  performanceTitle: string;
  performers: string;
  flatNo: string;
  actCategory: string;
  description: string;
}

export interface LiveMasterPrasadamItem {
  dayNumber: number;
  date: string;
  occasionTitle: string;
  mealType: string;
  menuItems: string;
  specialHighlight?: string;
  sponsorName?: string;
}

export function getEventDateMeta(dayNum: number): {
  dateKey: 'sep14' | 'sep15' | 'sep16' | 'sep17' | 'sep18' | 'sep19';
  month: string;
  day: string;
  dayLabel: string;
} {
  switch (dayNum) {
    case 1:
      return { dateKey: 'sep14', month: 'SEP', day: '14', dayLabel: 'Day 1 • Mon, 14th Sep' };
    case 2:
      return { dateKey: 'sep15', month: 'SEP', day: '15', dayLabel: 'Day 2 • Tue, 15th Sep' };
    case 3:
      return { dateKey: 'sep16', month: 'SEP', day: '16', dayLabel: 'Day 3 • Wed, 16th Sep' };
    case 4:
      return { dateKey: 'sep17', month: 'SEP', day: '17', dayLabel: 'Day 4 • Thu, 17th Sep' };
    case 5:
      return { dateKey: 'sep18', month: 'SEP', day: '18', dayLabel: 'Day 5 • Fri, 18th Sep' };
    case 6:
      return { dateKey: 'sep19', month: 'SEP', day: '19', dayLabel: 'Day 6 • Sat, 19th Sep' };
    default:
      return { dateKey: 'sep14', month: 'SEP', day: '14', dayLabel: `Day ${dayNum}` };
  }
}

/**
 * Fetches and parses live Events from the Master Portal sheet
 */
export async function fetchLiveMasterEvents(): Promise<LiveMasterEventItem[]> {
  try {
    const res = await fetch(getMasterSheetCsvUrl('Events'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    const items: LiveMasterEventItem[] = [];
    let startParsing = false;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row || row.length < 4) continue;

      const col0 = (row[0] || '').trim().toLowerCase();
      const col2 = (row[2] || '').trim().toLowerCase();
      const col3 = (row[3] || '').trim().toLowerCase();

      if (col0.includes('day number') || col2.includes('day label') || col3.includes('event title')) {
        startParsing = true;
        continue;
      }

      if (startParsing) {
        const rawDay = (row[0] || '').trim();
        const dayMatch = rawDay.match(/\d+/);
        const dayNum = dayMatch ? parseInt(dayMatch[0], 10) : 1;
        const dateStr = (row[1] || '').trim();

        const title = (row[3] || '').trim();
        if (!title || title.toLowerCase().includes('schedule') || title.toLowerCase().includes('utsav')) {
          continue;
        }

        const rawCat = (row[4] || '').trim().toLowerCase();
        const category: 'Rituals & Pooja' | 'Event Team' =
          rawCat.includes('ritual') || rawCat.includes('pooja') ? 'Rituals & Pooja' : 'Event Team';

        const timeSlot = (row[5] || '').trim();
        const location = (row[6] || 'Main Ganesh Mandap').trim();
        const description = (row[7] || '').trim();
        const rawRituals = (row[8] || '').trim();
        const rituals = rawRituals
          ? rawRituals.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
          : undefined;

        const rawSpoc = (row[9] || '').trim();
        const spocName = rawSpoc && rawSpoc !== '-' ? rawSpoc : undefined;
        const rawPhone = (row[10] || '').trim();
        const spocPhone = rawPhone && rawPhone !== '-' ? rawPhone : undefined;

        const meta = getEventDateMeta(dayNum);

        items.push({
          id: `live-event-d${dayNum}-${rIdx}`,
          dayNumber: dayNum,
          dateStr,
          dayLabel: meta.dayLabel,
          dateKey: meta.dateKey,
          month: meta.month,
          day: meta.day,
          title,
          category,
          timeSlot,
          location,
          description,
          rituals,
          spocName,
          spocPhone,
        });
      }
    }
    return items;
  } catch (err) {
    console.warn('Could not fetch live Master Events from Google Sheets, using fallback:', err);
    return [];
  }
}

/**
 * Fetches and parses live Prasadam menu from the Master Portal sheet
 */
export async function fetchLiveMasterPrasadam(): Promise<LiveMasterPrasadamItem[]> {
  try {
    const res = await fetch(getMasterSheetCsvUrl('Prasadam'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    const items: LiveMasterPrasadamItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;
      const dayMatch = (row[0] || '').match(/\d+/);
      const dayNum = dayMatch ? parseInt(dayMatch[0], 10) : i;

      items.push({
        dayNumber: dayNum,
        date: (row[1] || '').trim(),
        occasionTitle: (row[2] || '').trim(),
        mealType: (row[3] || 'Night Dinner (9:00 PM onwards)').trim(),
        menuItems: (row[4] || '').trim(),
        specialHighlight: (row[5] || '').trim(),
        sponsorName: (row[6] || '').trim(),
      });
    }
    return items;
  } catch (err) {
    console.warn('Could not fetch live Prasadam from Google Sheets:', err);
    return [];
  }
}

export interface LiveMasterTeamGroup {
  name: string;
  purpose: string;
  spocs: {
    name: string;
    flatNo: string;
    tower: string;
    phone?: string;
  }[];
}

/**
 * Fetches and parses live Event Teams & SPOC directory from the Master Portal sheet
 */
export async function fetchLiveMasterTeams(): Promise<LiveMasterTeamGroup[]> {
  try {
    const res = await fetch(getMasterSheetCsvUrl('Event Team'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    let startParsing = false;
    const teamMap: Record<string, LiveMasterTeamGroup> = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const col0 = (row[0] || '').trim().toLowerCase();
      const col2 = (row[2] || '').trim().toLowerCase();

      if (col0.includes('team name') || col2.includes('spoc name')) {
        startParsing = true;
        continue;
      }

      if (startParsing) {
        const teamName = (row[0] || '').trim();
        if (!teamName || teamName.toLowerCase().includes('directory') || teamName.toLowerCase().includes('utsav')) {
          continue;
        }

        const teamPurpose = (row[1] || '').trim();
        const spocName = (row[2] || '').trim();
        const flatNo = (row[3] || '').trim();
        const tower = (row[4] || '').trim();
        const rawPhone = (row[5] || '').trim();
        const phone = rawPhone && rawPhone !== '-' ? rawPhone : undefined;

        if (!teamMap[teamName]) {
          teamMap[teamName] = {
            name: teamName,
            purpose: teamPurpose,
            spocs: [],
          };
        }

        if (spocName) {
          teamMap[teamName].spocs.push({
            name: spocName,
            flatNo,
            tower,
            phone,
          });
        }
      }
    }

    return Object.values(teamMap);
  } catch (err) {
    console.warn('Could not fetch live Event Team from Google Sheets:', err);
    return [];
  }
}

/**
 * Fetches and parses live Cultural performances from the Master Portal sheet
 */
export async function fetchLiveMasterCultural(): Promise<LiveMasterCulturalItem[]> {
  try {
    const res = await fetch(getMasterSheetCsvUrl('Cultural'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    let startParsing = false;
    const items: LiveMasterCulturalItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const col0 = (row[0] || '').trim().toLowerCase();
      const col1 = (row[1] || '').trim().toLowerCase();
      const col2 = (row[2] || '').trim().toLowerCase();

      if (
        col0.includes('date') ||
        col1.includes('time') ||
        col2.includes('performance title') ||
        col2.includes('title')
      ) {
        startParsing = true;
        continue;
      }

      if (startParsing) {
        const date = (row[0] || '').trim();
        const timeSlot = (row[1] || '').trim();
        const performanceTitle = (row[2] || '').trim();

        if (
          !performanceTitle ||
          performanceTitle.toLowerCase().includes('utsav') ||
          performanceTitle.toLowerCase().includes('schedule')
        ) {
          continue;
        }

        const rawDuration = (row[3] || '').trim();
        const durationMins = rawDuration ? `${rawDuration} Mins` : undefined;
        const performers = (row[4] || '').trim();
        const flatNo = (row[5] || '').trim();
        const actCategory = (row[6] || '').trim();
        const description = (row[7] || '').trim();

        items.push({
          id: `live-cultural-${i}`,
          date,
          timeSlot,
          durationMins,
          performanceTitle,
          performers,
          flatNo,
          actCategory: actCategory || 'Cultural Performance',
          description,
        });
      }
    }
    return items;
  } catch (err) {
    console.warn('Could not fetch live Cultural from Google Sheets:', err);
    return [];
  }
}

export interface CulturalRegistrationEntry {
  id: string;
  fullName: string;
  flatNo: string;
  mobile: string;
  actType: string;
  preferredDate: string;
  duration?: string;
  actDescription?: string;
  registeredAt: string;
}

/**
 * Submits a cultural performance registration entry to both local storage and Google Sheets webhook
 */
export async function submitCulturalEntryToGoogleSheet(
  entry: Omit<CulturalRegistrationEntry, 'id' | 'registeredAt'>
): Promise<{ success: boolean; message: string; entry: CulturalRegistrationEntry }> {
  const newEntry: CulturalRegistrationEntry = {
    ...entry,
    id: `cultural-reg-${Date.now()}`,
    registeredAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem('bps_cultural_registrations') || '[]');
    localStorage.setItem('bps_cultural_registrations', JSON.stringify([newEntry, ...existing]));
  } catch (e) {
    console.warn('Failed saving cultural registration locally', e);
  }

  const webhookUrl = getCulturalAppsScriptUrl();
  if (!webhookUrl) {
    return {
      success: true,
      message: 'Registration saved locally. You can also share details with the Cultural SPOC.',
      entry: newEntry,
    };
  }

  try {
    const payload = {
      action: 'saveCulturalEntry',
      timestamp: new Date().toLocaleString('en-US'),
      fullName: entry.fullName,
      flatNo: entry.flatNo,
      mobile: entry.mobile,
      actType: entry.actType,
      preferredDate: entry.preferredDate,
      duration: entry.duration || '15 mins',
      description: entry.actDescription || '',
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Submitted directly to Google Sheet and Cultural Committee!',
      entry: newEntry,
    };
  } catch (err) {
    console.warn('Failed posting cultural registration to webhook:', err);
    return {
      success: true,
      message: 'Saved locally. You can also share details with the Cultural Committee on WhatsApp.',
      entry: newEntry,
    };
  }
}

// ============================================================================
// 7. TODAY'S COMBINED SCHEDULE (EVENTS & CULTURAL MERGE + TIME SORTING)
// ============================================================================

export interface TodayCombinedScheduleItem {
  id: string;
  source: 'event' | 'cultural' | 'both';
  title: string;
  timeSlot: string;
  startTimeMinutes: number;
  category: string;
  location?: string;
  description: string;
  performers?: string;
  durationMins?: string;
  rituals?: string[];
  spocName?: string;
  spocPhone?: string;
  iconType: 'pooja' | 'cultural' | 'prasadam' | 'activity' | 'event';
}

/**
 * Robustly parses time string to minutes from midnight (0-1440) for chronological sorting.
 * e.g. "7:30 PM - 8:30 PM" -> 1170, "08:30 PM" -> 1230, "9:15 PM onwards" -> 1275, "6:00 AM" -> 360
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3].toLowerCase();

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function getScheduleIconType(item: { title: string; category?: string; actCategory?: string; source?: string }): 'pooja' | 'cultural' | 'prasadam' | 'activity' | 'event' {
  const text = `${item.title} ${item.category || ''} ${item.actCategory || ''}`.toLowerCase();
  if (text.includes('pooja') || text.includes('aarti') || text.includes('havan') || text.includes('sthapana') || text.includes('visarjan') || text.includes('rituals')) {
    return 'pooja';
  }
  if (text.includes('prasadam') || text.includes('dinner') || text.includes('food') || text.includes('lunch') || text.includes('meal') || text.includes('fellowship')) {
    return 'prasadam';
  }
  if (text.includes('dance') || text.includes('song') || text.includes('singing') || text.includes('music') || text.includes('cultural') || text.includes('drama') || text.includes('skit') || text.includes('performance') || text.includes('vocal')) {
    return 'cultural';
  }
  if (text.includes('chair') || text.includes('quiz') || text.includes('game') || text.includes('activity') || text.includes('competition') || text.includes('children') || text.includes('rangoli')) {
    return 'activity';
  }
  return 'event';
}

function normalizeDateMatch(dateStr1: string, dateStr2: string): boolean {
  if (!dateStr1 || !dateStr2) return false;
  const clean1 = dateStr1.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = dateStr2.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean1 === clean2) return true;
  if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

  const extractDayMonth = (d: string) => {
    const m = d.match(/(\d{4})-(\d{2})-(\d{2})/) || d.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (m) {
      if (m[1].length === 4) return `${m[2]}-${m[3]}`;
      return `${m[2]}-${m[1]}`;
    }
    const num = d.match(/\d+/);
    return num ? num[0] : '';
  };
  return extractDayMonth(dateStr1) === extractDayMonth(dateStr2);
}

/**
 * Fetches and combines Events & Cultural performances for a given date (defaults to Today / Day 1: 2026-09-14)
 * and sorts all schedule items chronologically by time.
 */
export async function fetchTodayCombinedSchedule(targetDate?: string): Promise<{
  dateLabel: string;
  targetDate: string;
  dayNumber: number;
  items: TodayCombinedScheduleItem[];
}> {
  try {
    const [events, culturalList] = await Promise.all([
      fetchLiveMasterEvents(),
      fetchLiveMasterCultural(),
    ]);

    let effectiveDate = targetDate || new Date().toISOString().split('T')[0];

    // Find matching events for this date
    let matchedEvents = events.filter((e) => {
      if (e.dateStr && normalizeDateMatch(e.dateStr, effectiveDate)) return true;
      if (e.dateKey && normalizeDateMatch(e.dateKey, effectiveDate)) return true;
      return false;
    });

    let matchedCultural = culturalList.filter((c) => {
      return normalizeDateMatch(c.date, effectiveDate);
    });

    // If today is outside festival dates or no events matched, fallback to Day 1 (2026-09-14)
    if (matchedEvents.length === 0 && matchedCultural.length === 0) {
      effectiveDate = '2026-09-14';
      matchedEvents = events.filter((e) => e.dayNumber === 1 || (e.dateStr && e.dateStr.includes('14')));
      matchedCultural = culturalList.filter((c) => c.date.includes('14') || c.date.includes('2026-09-14'));
    }

    const dayNum = matchedEvents[0]?.dayNumber || 1;
    const dateLabel = matchedEvents[0]?.dayLabel || 'Day 1 • Mon, 14th Sep';

    const combined: TodayCombinedScheduleItem[] = [];
    const usedCulturalIds = new Set<string>();

    // 1. Process Events and cross-reference with Cultural items
    for (const evt of matchedEvents) {
      const normEvtTitle = evt.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Look for a cultural match
      const cultMatch = matchedCultural.find((c) => {
        const normCultTitle = c.performanceTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normEvtTitle.includes(normCultTitle) || normCultTitle.includes(normEvtTitle);
      });

      if (cultMatch) {
        usedCulturalIds.add(cultMatch.id);
        const timeSlot = cultMatch.timeSlot || evt.timeSlot;
        combined.push({
          id: `combined-${evt.id}-${cultMatch.id}`,
          source: 'both',
          title: cultMatch.performanceTitle || evt.title,
          timeSlot,
          startTimeMinutes: parseTimeToMinutes(timeSlot),
          category: cultMatch.actCategory || evt.category,
          location: evt.location || 'Mandap Stage',
          description: cultMatch.description || evt.description,
          performers: cultMatch.performers,
          durationMins: cultMatch.durationMins,
          rituals: evt.rituals,
          spocName: evt.spocName,
          spocPhone: evt.spocPhone,
          iconType: getScheduleIconType({ title: evt.title, category: evt.category, actCategory: cultMatch.actCategory }),
        });
      } else {
        combined.push({
          id: evt.id,
          source: 'event',
          title: evt.title,
          timeSlot: evt.timeSlot,
          startTimeMinutes: parseTimeToMinutes(evt.timeSlot),
          category: evt.category,
          location: evt.location,
          description: evt.description,
          rituals: evt.rituals,
          spocName: evt.spocName,
          spocPhone: evt.spocPhone,
          iconType: getScheduleIconType({ title: evt.title, category: evt.category }),
        });
      }
    }

    // 2. Add remaining standalone Cultural performances
    for (const cult of matchedCultural) {
      if (!usedCulturalIds.has(cult.id)) {
        combined.push({
          id: cult.id,
          source: 'cultural',
          title: cult.performanceTitle,
          timeSlot: cult.timeSlot,
          startTimeMinutes: parseTimeToMinutes(cult.timeSlot),
          category: cult.actCategory || 'Cultural Performance',
          location: 'Mandap Stage',
          description: cult.description,
          performers: cult.performers,
          durationMins: cult.durationMins,
          iconType: getScheduleIconType({ title: cult.performanceTitle, actCategory: cult.actCategory }),
        });
      }
    }

    // 3. Sort by startTimeMinutes chronologically ascending
    combined.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);

    return {
      dateLabel,
      targetDate: effectiveDate,
      dayNumber: dayNum,
      items: combined,
    };
  } catch (err) {
    console.warn('Error fetching today combined schedule:', err);
    return {
      dateLabel: 'Day 1 • Mon, 14th Sep',
      targetDate: '2026-09-14',
      dayNumber: 1,
      items: [
        {
          id: 'fb-1',
          source: 'event',
          title: 'Sandhya Pooja & Maha Aarti',
          timeSlot: '7:30 PM - 8:30 PM',
          startTimeMinutes: 19 * 60 + 30,
          category: 'Rituals & Pooja',
          location: 'Main Ganesh Mandap',
          description: 'Evening sandhya deepa aarti & community pushpanjali.',
          iconType: 'pooja',
        },
        {
          id: 'fb-2',
          source: 'cultural',
          title: 'Classical Dance Performance – Ladies',
          timeSlot: '8:30 PM - 8:50 PM',
          startTimeMinutes: 20 * 60 + 30,
          category: 'Classical Dance',
          performers: 'Society Ladies',
          durationMins: '10 Mins',
          location: 'Mandap Stage',
          description: 'Traditional Bharatanatyam opening performance.',
          iconType: 'cultural',
        },
        {
          id: 'fb-3',
          source: 'cultural',
          title: 'Devotional Song Performance – Pradeep & Manjari Mam',
          timeSlot: '8:50 PM - 9:15 PM',
          startTimeMinutes: 20 * 60 + 50,
          category: 'Vocal Performance',
          performers: 'Pradeep & Manjari Mam',
          durationMins: '15 Mins',
          location: 'Mandap Stage',
          description: 'Ganesh devotional keerthanas & bhajan recital.',
          iconType: 'cultural',
        },
        {
          id: 'fb-4',
          source: 'event',
          title: 'Community Dinner & Fellowship',
          timeSlot: '9:15 PM onwards',
          startTimeMinutes: 21 * 60 + 15,
          category: 'Mahaprasadam',
          location: 'Community Dining Area',
          description: 'Delicious hot dinner & community prasadam for all towers.',
          iconType: 'prasadam',
        },
        {
          id: 'fb-5',
          source: 'event',
          title: 'Children Musical Chairs Activity',
          timeSlot: '9:45 PM onwards',
          startTimeMinutes: 21 * 60 + 45,
          category: 'Fun & Games',
          location: 'Central Podium',
          description: 'Fun musical chair game for kids with festive prizes.',
          iconType: 'activity',
        },
      ],
    };
  }
}
