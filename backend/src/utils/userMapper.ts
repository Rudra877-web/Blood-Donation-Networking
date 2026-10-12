/** Safe user shape returned by the API (never includes passwordHash). */
export const userSelect = {
  id: true, email: true, role: true, status: true, name: true, phone: true, lastLoginAt: true, createdAt: true,
  donor: true, receiver: true, hospital: true, admin: true,
} as const;
