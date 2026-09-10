import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshFinancialSummary,
  GaneshSankalpamRecord,
} from '../types/ganesh';

const STORAGE_KEYS = {
  CONTRIBUTIONS: 'bps_ganesh_contributions_v1',
  EXPENSES: 'bps_ganesh_expenses_v1',
  SANKALPAMS: 'bps_ganesh_sankalpams_v1',
  SETTINGS: 'bps_ganesh_settings_v1',
};

// Target budget configured by Festival Committee
export const GANESH_TARGET_BUDGET = 350000;
export const GANESH_UPI_ID = 'harish.reddy5@axl';
export const GANESH_ACCOUNT_DETAILS = {
  accountName: 'Harish Reddy Guduru - BPS Ganesh Utsav Fund',
  bankName: 'Axis Bank / PhonePe UPI',
  accountNumber: 'N/A (UPI Direct Pay)',
  ifscCode: 'UTIB0000000',
  branch: 'Hyderabad',
  upiId: 'harish.reddy5@axl',
};

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

// Initial data compiled precisely from the 96 contributions + Jangid families split
const INITIAL_CONTRIBUTIONS: GaneshContributionRecord[] = [
  { id: 'c-1', slNo: 1, donorName: 'Karthik Behera', flatNo: 'B901', tower: 'B', amount: 5000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-2', slNo: 2, donorName: 'Noor Basha', flatNo: 'A1010', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-3', slNo: 3, donorName: 'T D Sravan Kumar', flatNo: 'B1106', tower: 'B', amount: 2151, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-4', slNo: 4, donorName: 'Palle Satyanarayana', flatNo: 'B809', tower: 'B', amount: 2223, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-5', slNo: 5, donorName: 'Dr Mir Suhail', flatNo: 'B501', tower: 'B', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-6', slNo: 6, donorName: 'GV Srinivas Rao', flatNo: 'A1102', tower: 'A', amount: 2001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-7', slNo: 7, donorName: 'Radha kishan', flatNo: 'A602', tower: 'A', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-8', slNo: 8, donorName: 'KVS Ravi Kumar', flatNo: 'A411', tower: 'A', amount: 5116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-9', slNo: 9, donorName: 'Nandita Supantha Chaudhuri', flatNo: 'A502', tower: 'A', amount: 2511, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-10', slNo: 10, donorName: 'T V Rao', flatNo: 'A810', tower: 'A', amount: 999, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-11', slNo: 11, donorName: 'B Lalit Kumar', flatNo: 'B708', tower: 'B', amount: 1100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-12', slNo: 12, donorName: 'C Venkateshwar Rao', flatNo: 'A1007', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-13', slNo: 13, donorName: 'Apala Anand', flatNo: 'B1506', tower: 'B', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-14', slNo: 14, donorName: 'Y Ashok Babu', flatNo: 'B1904', tower: 'B', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-15', slNo: 15, donorName: 'K V K Raja Shekhar', flatNo: 'A302', tower: 'A', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-16', slNo: 16, donorName: 'A Agasthya Rao', flatNo: 'A2007', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-17', slNo: 17, donorName: 'Prem Prakash Verma', flatNo: 'A1005', tower: 'A', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-18', slNo: 18, donorName: 'Anitha Rajashekar (Cash)', flatNo: 'B502', tower: 'B', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'Cash', verified: true, createdAt: '2026-08-25' },
  { id: 'c-19', slNo: 19, donorName: 'Ramesh & Sushmita', flatNo: 'A607', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-20', slNo: 20, donorName: 'Hema Sangamkar', flatNo: 'B1505', tower: 'B', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-21', slNo: 21, donorName: 'Anjana Satya Priya', flatNo: 'B601', tower: 'B', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-22', slNo: 22, donorName: 'Bhaskar K', flatNo: 'B1502', tower: 'B', amount: 2000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-23', slNo: 23, donorName: 'Mohammed Mashiuddin', flatNo: 'A2008', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-24', slNo: 24, donorName: 'Comsempet Srinivas', flatNo: 'B1006', tower: 'B', amount: 2259, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-25', slNo: 25, donorName: 'Amit Kumar Verma', flatNo: 'A1301', tower: 'A', amount: 1601, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-26', slNo: 26, donorName: 'Mohana Krishna', flatNo: 'A1503', tower: 'A', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-27', slNo: 27, donorName: 'P Vishnu Vardhan', flatNo: 'A1111', tower: 'A', amount: 2516, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-28', slNo: 28, donorName: 'T Bharat Bhushan', flatNo: 'B1906', tower: 'B', amount: 1600, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-29', slNo: 29, donorName: 'Shaik Mahaboob Subhani', flatNo: 'A1011', tower: 'A', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-30', slNo: 30, donorName: 'Narayana Venu Gopal', flatNo: 'A1409', tower: 'A', amount: 1409, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-31', slNo: 31, donorName: 'Ashwin Kumar', flatNo: 'B608', tower: 'B', amount: 5001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-32', slNo: 32, donorName: 'Kavya/ Harish Reddy', flatNo: 'B804', tower: 'B', amount: 3116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-33', slNo: 33, donorName: 'Chandra Shekhar Maheshwari', flatNo: 'B402', tower: 'B', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-34', slNo: 34, donorName: 'Dr Praneeth Reddy', flatNo: 'A508', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-35', slNo: 35, donorName: 'Deepak Srivastava/ Manjari', flatNo: 'B1811', tower: 'B', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-36', slNo: 36, donorName: 'Vijay/ Deepika Mallgi', flatNo: 'B308', tower: 'B', amount: 1100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-37', slNo: 37, donorName: 'Vinay Kumar Bang', flatNo: 'A1903', tower: 'A', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-38', slNo: 38, donorName: 'Ch Balraj Chakaraharty', flatNo: 'B801', tower: 'B', amount: 2516, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-39', slNo: 39, donorName: 'Praveen Lagishetty', flatNo: 'B506', tower: 'B', amount: 1500, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-40', slNo: 40, donorName: 'Abrar', flatNo: 'B1504', tower: 'B', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-41', slNo: 41, donorName: 'Bharath Bhushan D', flatNo: 'B609', tower: 'B', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-42', slNo: 42, donorName: 'Pandu Prajapati', flatNo: 'A1008', tower: 'A', amount: 1111, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-43', slNo: 43, donorName: 'KV Sasikanth', flatNo: 'A301', tower: 'A', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-44', slNo: 44, donorName: 'Rajesh Bihani', flatNo: 'B401', tower: 'B', amount: 2101, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-45', slNo: 45, donorName: 'Manikandan M', flatNo: 'A811', tower: 'A', amount: 2101, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-46', slNo: 46, donorName: 'Narender Rao Deshmukh', flatNo: 'B1909', tower: 'B', amount: 1500, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-47', slNo: 47, donorName: 'K Vidyasavathi/ P Prathap', flatNo: 'B309', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-48', slNo: 48, donorName: 'Dr Srikar/ Sai Shreya', flatNo: 'B1103', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-49', slNo: 49, donorName: 'Vidwan/ Rohini', flatNo: 'A611', tower: 'A', amount: 2000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-50', slNo: 50, donorName: 'Shakir Ahmed', flatNo: 'B910', tower: 'B', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-51', slNo: 51, donorName: 'Dr Priya', flatNo: 'B904', tower: 'B', amount: 1500, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-52', slNo: 52, donorName: 'RAJEEV KUMAR SHARMA', flatNo: 'B802', tower: 'B', amount: 1100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-53', slNo: 53, donorName: 'Rejani', flatNo: 'B1104', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-54', slNo: 54, donorName: 'Jagadish', flatNo: 'B709', tower: 'B', amount: 2001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  // 55: Jangid Families (5 flats @ ₹2,222.20 each)
  { id: 'c-55-1', slNo: 55, donorName: 'Jangid Families (Flat 1/5)', flatNo: 'B1802', tower: 'B', amount: 2222.2, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', notes: 'Jangid Families joint contribution (Total ₹11,111)', verified: true, createdAt: '2026-08-25' },
  { id: 'c-55-2', slNo: 55, donorName: 'Jangid Families (Flat 2/5)', flatNo: 'B1707', tower: 'B', amount: 2222.2, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', notes: 'Jangid Families joint contribution (Total ₹11,111)', verified: true, createdAt: '2026-08-25' },
  { id: 'c-55-3', slNo: 55, donorName: 'Jangid Families (Flat 3/5)', flatNo: 'B1807', tower: 'B', amount: 2222.2, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', notes: 'Jangid Families joint contribution (Total ₹11,111)', verified: true, createdAt: '2026-08-25' },
  { id: 'c-55-4', slNo: 55, donorName: 'Jangid Families (Flat 4/5)', flatNo: 'B1107', tower: 'B', amount: 2222.2, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', notes: 'Jangid Families joint contribution (Total ₹11,111)', verified: true, createdAt: '2026-08-25' },
  { id: 'c-55-5', slNo: 55, donorName: 'Jangid Families (Flat 5/5)', flatNo: 'B707', tower: 'B', amount: 2222.2, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', notes: 'Jangid Families joint contribution (Total ₹11,111)', verified: true, createdAt: '2026-08-25' },
  { id: 'c-56', slNo: 56, donorName: 'G Sandeep', flatNo: 'A401', tower: 'A', amount: 2000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-57', slNo: 57, donorName: 'Pradeep Kumar Rout', flatNo: 'B1804', tower: 'B', amount: 5111, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-58', slNo: 58, donorName: 'Shaik Rafee', flatNo: 'External', tower: 'Other', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-59', slNo: 59, donorName: 'Ankit Lat', flatNo: 'B1309', tower: 'B', amount: 2100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-60', slNo: 60, donorName: 'Bapi Raju Andey', flatNo: 'External', tower: 'Other', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-61', slNo: 61, donorName: 'Manoj', flatNo: 'B510', tower: 'B', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-62', slNo: 62, donorName: 'Koluguru Rajani', flatNo: 'B706', tower: 'B', amount: 3000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-63', slNo: 63, donorName: 'P Rajashekhar', flatNo: 'A802', tower: 'A', amount: 5116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-64', slNo: 64, donorName: 'Sreeramulu Basapogu', flatNo: 'B1602', tower: 'B', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-65', slNo: 65, donorName: 'Sabitha / Sekhar', flatNo: 'B410', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-66', slNo: 66, donorName: 'T Sulochan', flatNo: 'B1609', tower: 'B', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-67', slNo: 67, donorName: 'Suresh', flatNo: 'A711', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-68', slNo: 68, donorName: 'Samrat/ Salini', flatNo: 'B1606', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-69', slNo: 69, donorName: 'Rekha Satish', flatNo: 'External', tower: 'Other', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-70', slNo: 70, donorName: 'Ashutosh Hiral', flatNo: 'B1402', tower: 'B', amount: 1100, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-71', slNo: 71, donorName: 'P Sridhar', flatNo: 'B1409', tower: 'B', amount: 5116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-72', slNo: 72, donorName: 'Saileela/ Raghu', flatNo: 'A1101', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-73', slNo: 73, donorName: 'Pandiri Deepak', flatNo: 'A1505', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-74', slNo: 74, donorName: 'Lakshmi Chandrakala', flatNo: 'B1709', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-75', slNo: 75, donorName: 'Valige Krishna Murthy', flatNo: 'A1705', tower: 'A', amount: 2501, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-76', slNo: 76, donorName: 'Volam Sainath', flatNo: 'A1003', tower: 'A', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-77', slNo: 77, donorName: 'Kamireddy HariPrasad', flatNo: 'A701', tower: 'A', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-78', slNo: 78, donorName: 'N Waseem Ahmed', flatNo: 'A604', tower: 'A', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-79', slNo: 79, donorName: 'Dr Altaf', flatNo: 'A1810', tower: 'A', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-80', slNo: 80, donorName: 'Sunil Kumar Pakanati', flatNo: 'B1801', tower: 'B', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-81', slNo: 81, donorName: 'Ramakanth Reddy Allu', flatNo: 'External', tower: 'Other', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-82', slNo: 82, donorName: 'Dr Pullaparaju', flatNo: 'A2010', tower: 'A', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-83', slNo: 83, donorName: 'S Nagarjuna', flatNo: 'External', tower: 'Other', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-84', slNo: 84, donorName: 'Padamati Ravikanth Reddy', flatNo: 'External', tower: 'Other', amount: 1501, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-85', slNo: 85, donorName: 'Sathineni Pushpalatha', flatNo: 'External', tower: 'Other', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-86', slNo: 86, donorName: 'Kore Shruthi', flatNo: 'External', tower: 'Other', amount: 1500, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-87', slNo: 87, donorName: 'Nagaraju/ Deepa', flatNo: 'B1004', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-88', slNo: 88, donorName: 'SV Krishna Reddy', flatNo: 'B403', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-89', slNo: 89, donorName: 'Ravishankar Reddy', flatNo: 'B1009', tower: 'B', amount: 1000, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-90', slNo: 90, donorName: 'Chinni Gupta', flatNo: 'B404', tower: 'B', amount: 1516, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-91', slNo: 91, donorName: 'Dr. Sri Priya Rasthapuram', flatNo: 'A1610', tower: 'A', amount: 2116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-92', slNo: 92, donorName: 'Rajitha Santhosh Kotagiri', flatNo: 'B1202', tower: 'B', amount: 1116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-93', slNo: 93, donorName: 'Gayatri Yadav', flatNo: 'External', tower: 'Other', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-94', slNo: 94, donorName: 'Kongara Sunitha', flatNo: 'External', tower: 'Other', amount: 2001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-95', slNo: 95, donorName: 'Shivam Srivastava', flatNo: 'A704', tower: 'A', amount: 1001, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },
  { id: 'c-96', slNo: 96, donorName: 'Naresh Reddy', flatNo: 'B2102', tower: 'B', amount: 5116, contributionType: 'General Contribution', isSponsor: false, paymentMode: 'UPI', verified: true, createdAt: '2026-08-25' },

  // Preloaded Sponsors from Image 2
  {
    id: 'sp-1',
    slNo: 1,
    donorName: 'Nagoju Praveen',
    flatNo: 'B606',
    tower: 'B',
    amount: 3001,
    contributionType: 'Pooja Item',
    isSponsor: true,
    sponsorCategory: 'Pooja Item Sponsor',
    paymentMode: 'UPI',
    notes: 'Sponsored complete daily Pooja & Ritual samagri items for Day 1 to 3',
    verified: true,
    createdAt: '2026-08-26',
  },
  {
    id: 'sp-2',
    slNo: 2,
    donorName: 'Mahidhar',
    flatNo: 'A1701',
    tower: 'A',
    amount: 5116,
    contributionType: 'Mahaprasadam',
    isSponsor: true,
    sponsorCategory: 'Mahaprasadam Sponsor',
    paymentMode: 'UPI',
    notes: 'Sponsored Grand Evening Mahaprasadam for 500+ residents',
    verified: true,
    createdAt: '2026-08-26',
  },
  {
    id: 'sp-3',
    slNo: 3,
    donorName: 'Chandra Shekhar V',
    flatNo: 'B1609',
    tower: 'B',
    amount: 30000,
    contributionType: 'Pujari Dakshina',
    isSponsor: true,
    sponsorCategory: 'Pujari Sponsor',
    paymentMode: 'UPI',
    notes: 'Chief Priest Vedic Vidwan Dakshina & Complete Rituals Sponsor',
    verified: true,
    createdAt: '2026-08-26',
  },
];

const INITIAL_EXPENSES: GaneshExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'Eco-friendly Clay Ganesha Idol (8ft) & Advance',
    category: 'Idol & Visarjan',
    amount: 32000,
    paidTo: 'Sri Vinayaka Clay Arts, Dhoolpet',
    paymentMode: 'UPI',
    expenseDate: '2026-08-20',
    invoiceNo: 'INV-SV-8921',
    approvedBy: 'Festival Committee Head',
    notes: 'Advance & booking token for 8-foot clay idol with natural colors',
    status: 'Paid',
    createdAt: '2026-08-20',
  },
  {
    id: 'exp-2',
    title: 'Pandal Stage, Grand Arch & Waterproof Tent Setup',
    category: 'Pandal & Decoration',
    amount: 45000,
    paidTo: 'Shree Balaji Tent & Stage Decorators',
    paymentMode: 'Bank Transfer',
    expenseDate: '2026-08-24',
    invoiceNo: 'TENT-2026-44',
    approvedBy: 'Secretary RWA',
    notes: '3-tier waterproof pandal, stage carpet, flower arch framework',
    status: 'Paid',
    createdAt: '2026-08-24',
  },
  {
    id: 'exp-3',
    title: 'Priest Vedic Rituals, Homam & Samagri Advance',
    category: 'Priest & Puja Samagri',
    amount: 25000,
    paidTo: 'Pt. Ramamurthy Sharma (Chief Priest)',
    paymentMode: 'UPI',
    expenseDate: '2026-08-26',
    invoiceNo: 'PUJ-0012',
    approvedBy: 'Cultural Lead',
    notes: 'Prana Pratishtha, Ganapathi Homam, and daily Archana rituals dakshina',
    status: 'Paid',
    createdAt: '2026-08-26',
  },
  {
    id: 'exp-4',
    title: 'Sound System, Ambient Lights & Pandal Serial Bulbs',
    category: 'Sound & Lighting',
    amount: 22000,
    paidTo: 'Sai Sound & Focus Lighting Systems',
    paymentMode: 'Cash',
    expenseDate: '2026-08-27',
    invoiceNo: 'SL-7832',
    approvedBy: 'Tech & Sound Committee',
    notes: '5-day digital mixer, speakers, mic sets, and boundary LED strips',
    status: 'Paid',
    createdAt: '2026-08-27',
  },
  {
    id: 'exp-5',
    title: 'Mahaprasadam Provisions, Sweets & Laddu Ingredients',
    category: 'Mahaprasadam & Food',
    amount: 38500,
    paidTo: 'Sri Krishna Sweets & Grocery Mart',
    paymentMode: 'UPI',
    expenseDate: '2026-08-28',
    invoiceNo: 'SK-2026-092',
    approvedBy: 'Prasadam Committee',
    notes: 'Pure ghee, dry fruits, rava, sugar, eco paper plates & dona cups',
    status: 'Paid',
    createdAt: '2026-08-28',
  },
  {
    id: 'exp-6',
    title: 'Kids Sloka Recitation, Drawing & Fancy Dress Prizes',
    category: 'Cultural Events & Gifts',
    amount: 8500,
    paidTo: 'Wonderland Gifts & Trophies',
    paymentMode: 'UPI',
    expenseDate: '2026-08-29',
    invoiceNo: 'WGT-4410',
    approvedBy: 'Cultural Committee',
    notes: 'Momento trophies, medals, and art kits for 60+ child participants',
    status: 'Paid',
    createdAt: '2026-08-29',
  },
  {
    id: 'exp-7',
    title: 'Visarjan Dhol-Tasha Band, Crane & Security Escort (Planned)',
    category: 'Idol & Visarjan',
    amount: 28000,
    paidTo: 'Pune Dhol Tasha Pathak Hyderabad',
    paymentMode: 'Bank Transfer',
    expenseDate: '2026-09-02',
    invoiceNo: 'BAND-2026-09',
    approvedBy: 'Event Convenor',
    notes: 'Traditional immersion procession band, floral chariot, safety escort',
    status: 'Planned',
    createdAt: '2026-08-30',
  },
];

const INITIAL_SANKALPAMS: GaneshSankalpamRecord[] = [
  {
    id: 'snk-1',
    flatNo: 'B901',
    tower: 'B',
    primaryResidentName: 'Karthik Behera',
    contactMobile: '9848011223',
    gothram: 'Kashyapa (కశ్యప)',
    familyMembers: [
      { id: 'm-1', name: 'Karthik Behera', relationship: 'Self' },
      { id: 'm-2', name: 'Swati Behera', relationship: 'Spouse' },
      { id: 'm-3', name: 'Aarav Behera', relationship: 'Son' },
    ],
    preferredPujaDate: 'Day 1 - Vinayaka Chavithi',
    specialPrayers: 'Good health, academic success for children & family peace',
    prasadOptIn: true,
    submittedAt: '2026-08-27',
  },
  {
    id: 'snk-2',
    flatNo: 'A1701',
    tower: 'A',
    primaryResidentName: 'Mahidhar',
    contactMobile: '9989022334',
    gothram: 'Bharadwaja (భరద్వాజ)',
    familyMembers: [
      { id: 'm-4', name: 'Mahidhar', relationship: 'Self' },
      { id: 'm-5', name: 'Anuradha', relationship: 'Spouse' },
      { id: 'm-6', name: 'Rohan', relationship: 'Son' },
      { id: 'm-7', name: 'Suhani', relationship: 'Daughter' },
    ],
    preferredPujaDate: 'Day 3 - Mahaprasadam Special',
    specialPrayers: 'Career prosperity & wellbeing of community',
    prasadOptIn: true,
    submittedAt: '2026-08-28',
  },
  {
    id: 'snk-3',
    flatNo: 'B1609',
    tower: 'B',
    primaryResidentName: 'Chandra Shekhar V',
    contactMobile: '9849155667',
    gothram: 'Vasishta (వాశిష్ట)',
    familyMembers: [
      { id: 'm-8', name: 'Chandra Shekhar V', relationship: 'Self' },
      { id: 'm-9', name: 'Gayatri V', relationship: 'Spouse' },
      { id: 'm-10', name: 'Surya V', relationship: 'Son' },
    ],
    preferredPujaDate: 'Day 1 - Prana Pratishtha',
    specialPrayers: 'Sarva Vighna Nivarana & Spiritual Harmony',
    prasadOptIn: true,
    submittedAt: '2026-08-28',
  },
];

// Helper to determine Tower from Flat No
export function getTowerFromFlat(flatNo: string): 'A' | 'B' | 'Other' {
  if (!flatNo) return 'Other';
  const clean = flatNo.trim().toUpperCase();
  if (clean.startsWith('A')) return 'A';
  if (clean.startsWith('B')) return 'B';
  return 'Other';
}

// ----------------- STORAGE / SERVICE METHODS -----------------

export function getGaneshContributions(): GaneshContributionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(INITIAL_CONTRIBUTIONS));
      return INITIAL_CONTRIBUTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading Ganesh contributions:', err);
    return INITIAL_CONTRIBUTIONS;
  }
}

export function saveGaneshContributions(list: GaneshContributionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving Ganesh contributions:', err);
  }
}

export function addGaneshContribution(
  data: Omit<GaneshContributionRecord, 'id' | 'createdAt' | 'tower'> & { tower?: 'A' | 'B' | 'Other' }
): GaneshContributionRecord {
  const current = getGaneshContributions();
  const maxSl = current.reduce((max, item) => (item.slNo && item.slNo > max ? item.slNo : max), 0);
  const newRecord: GaneshContributionRecord = {
    ...data,
    id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    slNo: data.slNo || maxSl + 1,
    tower: data.tower || getTowerFromFlat(data.flatNo),
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newRecord, ...current];
  saveGaneshContributions(updated);
  return newRecord;
}

export function updateGaneshContribution(
  id: string,
  updates: Partial<GaneshContributionRecord>
): GaneshContributionRecord[] {
  const current = getGaneshContributions();
  const updated = current.map((item) => {
    if (item.id === id) {
      const flat = updates.flatNo !== undefined ? updates.flatNo : item.flatNo;
      return {
        ...item,
        ...updates,
        tower: getTowerFromFlat(flat),
      };
    }
    return item;
  });
  saveGaneshContributions(updated);
  return updated;
}

export function deleteGaneshContribution(id: string): GaneshContributionRecord[] {
  const current = getGaneshContributions();
  const updated = current.filter((item) => item.id !== id);
  saveGaneshContributions(updated);
  return updated;
}

// ----------------- EXPENSES -----------------

export function getGaneshExpenses(): GaneshExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading Ganesh expenses:', err);
    return INITIAL_EXPENSES;
  }
}

export function saveGaneshExpenses(list: GaneshExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving Ganesh expenses:', err);
  }
}

export function addGaneshExpense(
  data: Omit<GaneshExpenseRecord, 'id' | 'createdAt'>
): GaneshExpenseRecord {
  const current = getGaneshExpenses();
  const newRecord: GaneshExpenseRecord = {
    ...data,
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newRecord, ...current];
  saveGaneshExpenses(updated);
  return newRecord;
}

export function updateGaneshExpense(
  id: string,
  updates: Partial<GaneshExpenseRecord>
): GaneshExpenseRecord[] {
  const current = getGaneshExpenses();
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveGaneshExpenses(updated);
  return updated;
}

export function deleteGaneshExpense(id: string): GaneshExpenseRecord[] {
  const current = getGaneshExpenses();
  const updated = current.filter((item) => item.id !== id);
  saveGaneshExpenses(updated);
  return updated;
}

// ----------------- SANKALPAMS -----------------

export function getGaneshSankalpams(): GaneshSankalpamRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SANKALPAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SANKALPAMS, JSON.stringify(INITIAL_SANKALPAMS));
      return INITIAL_SANKALPAMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading Ganesh sankalpams:', err);
    return INITIAL_SANKALPAMS;
  }
}

export function saveGaneshSankalpams(list: GaneshSankalpamRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SANKALPAMS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving Ganesh sankalpams:', err);
  }
}

export function addOrUpdateGaneshSankalpam(
  data: Omit<GaneshSankalpamRecord, 'id' | 'submittedAt' | 'tower'> & { id?: string; tower?: 'A' | 'B' | 'Other' }
): GaneshSankalpamRecord {
  const current = getGaneshSankalpams();
  const tower = data.tower || getTowerFromFlat(data.flatNo);

  if (data.id) {
    const updated = current.map((item) =>
      item.id === data.id
        ? {
            ...item,
            ...data,
            tower,
            submittedAt: item.submittedAt || new Date().toISOString().split('T')[0],
          }
        : item
    );
    saveGaneshSankalpams(updated);
    return updated.find((i) => i.id === data.id)!;
  }

  // Check if flat already registered, update existing if so
  const existingIdx = current.findIndex(
    (item) => item.flatNo.toUpperCase().trim() === data.flatNo.toUpperCase().trim()
  );

  if (existingIdx >= 0) {
    const updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...data,
      tower,
      submittedAt: new Date().toISOString().split('T')[0],
    };
    saveGaneshSankalpams(updated);
    return updated[existingIdx];
  }

  const newRecord: GaneshSankalpamRecord = {
    ...data,
    id: `snk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    tower,
    submittedAt: new Date().toISOString().split('T')[0],
  };

  const updated = [newRecord, ...current];
  saveGaneshSankalpams(updated);
  return newRecord;
}

export function deleteGaneshSankalpam(id: string): GaneshSankalpamRecord[] {
  const current = getGaneshSankalpams();
  const updated = current.filter((item) => item.id !== id);
  saveGaneshSankalpams(updated);
  return updated;
}

// ----------------- FINANCIAL SUMMARY CALCULATOR -----------------

export function calculateGaneshSummary(): GaneshFinancialSummary {
  const contributions = getGaneshContributions();
  const expenses = getGaneshExpenses();
  const sankalpams = getGaneshSankalpams();

  let totalGeneral = 0;
  let totalSponsors = 0;
  let sCount = 0;
  let cCount = 0;

  let towerAAmt = 0;
  let towerBAmt = 0;
  let towerACnt = 0;
  let towerBCnt = 0;

  for (const item of contributions) {
    const amt = Number(item.amount) || 0;
    if (item.isSponsor) {
      totalSponsors += amt;
      sCount += 1;
    } else {
      totalGeneral += amt;
      cCount += 1;
    }

    if (item.tower === 'A') {
      towerAAmt += amt;
      towerACnt += 1;
    } else if (item.tower === 'B') {
      towerBAmt += amt;
      towerBCnt += 1;
    }
  }

  const totalCollections = totalGeneral + totalSponsors;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = totalCollections - totalExpenses;

  return {
    targetBudget: GANESH_TARGET_BUDGET,
    totalContributions: totalGeneral,
    totalSponsorships: totalSponsors,
    totalCollections,
    totalExpenses,
    netBalance,
    totalContributorsCount: cCount,
    totalSponsorsCount: sCount,
    towerAAmount: towerAAmt,
    towerBAmount: towerBAmt,
    towerACount: towerACnt,
    towerBCount: towerBCnt,
    sankalpamCount: sankalpams.length,
  };
}

// ----------------- EXPORT TO CSV -----------------

export function exportGaneshCollectionsCSV(data: GaneshContributionRecord[]): string {
  const headers = ['SI No', 'Donor Name', 'Flat No', 'Tower', 'Type', 'Sponsor Category', 'Amount (INR)', 'Payment Mode', 'Notes', 'Date'];
  const rows = data.map((item, idx) => [
    item.slNo || idx + 1,
    `"${(item.donorName || '').replace(/"/g, '""')}"`,
    `"${item.flatNo || ''}"`,
    item.tower || 'Other',
    item.isSponsor ? 'Sponsor' : 'General Contribution',
    `"${(item.sponsorCategory || '').replace(/"/g, '""')}"`,
    item.amount,
    item.paymentMode || 'UPI',
    `"${(item.notes || '').replace(/"/g, '""')}"`,
    item.createdAt || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportGaneshExpensesCSV(data: GaneshExpenseRecord[]): string {
  const headers = ['Expense Item', 'Category', 'Amount (INR)', 'Paid To / Vendor', 'Payment Mode', 'Expense Date', 'Invoice No', 'Status', 'Approved By', 'Notes'];
  const rows = data.map((item) => [
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${item.category || ''}"`,
    item.amount,
    `"${(item.paidTo || '').replace(/"/g, '""')}"`,
    item.paymentMode || 'UPI',
    item.expenseDate || '',
    `"${item.invoiceNo || ''}"`,
    item.status || 'Paid',
    `"${item.approvedBy || ''}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportGaneshSankalpamCSV(data: GaneshSankalpamRecord[]): string {
  const headers = ['Flat No', 'Tower', 'Primary Resident', 'Gothram', 'Family Members'];
  const rows = data.map((item) => [
    `"${item.flatNo}"`,
    item.tower,
    `"${item.primaryResidentName.replace(/"/g, '""')}"`,
    `"${item.gothram.replace(/"/g, '""')}"`,
    `"${item.familyMembers.map((m) => `${m.name}${m.relationship ? ` (${m.relationship})` : ''}${m.nakshatram ? ` [${m.nakshatram}]` : ''}`).join('; ').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
