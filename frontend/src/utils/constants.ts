export const BLOOD_GROUPS = [
  { value: 'A_POS', label: 'A+' }, { value: 'A_NEG', label: 'A-' },
  { value: 'B_POS', label: 'B+' }, { value: 'B_NEG', label: 'B-' },
  { value: 'O_POS', label: 'O+' }, { value: 'O_NEG', label: 'O-' },
  { value: 'AB_POS', label: 'AB+' }, { value: 'AB_NEG', label: 'AB-' },
];
export const bg = (v?: string | null) => (v ? v.replace('_POS', '+').replace('_NEG', '-') : '-');

export const URGENCIES = ['NORMAL', 'URGENT', 'CRITICAL'];
export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'MATCHED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
export const DONATION_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'DECLINED'];
export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'];
export const PATIENT_STATUSES = ['ADMITTED', 'UNDER_TREATMENT', 'DISCHARGED'];

export const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin', DONOR: '/donor', RECEIVER: '/receiver', HOSPITAL: '/hospital',
};
