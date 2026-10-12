import { z } from 'zod';
import { BloodGroup, Gender, Urgency, RequestStatus, DonationStatus, PatientStatus, AccountStatus, NotificationType } from '@prisma/client';

const optNum = (min: number, max: number) =>
  z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(min).max(max).optional());
const optStr = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(2000).optional());
const optDate = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.date().optional());

export const bloodGroup = z.nativeEnum(BloodGroup);
const name = z.string().trim().min(2, 'Name is too short').max(120);
const email = z.string().trim().toLowerCase().email('Invalid email address');
const phone = z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');
const lat = optNum(-90, 90);
const lng = optNum(-180, 180);

const base = { name, email, password, phone };

export const registerSchema = z.discriminatedUnion('role', [
  z.object({
    ...base, role: z.literal('DONOR'), bloodGroup, address: z.string().trim().min(3), city: z.string().trim().min(2),
    latitude: lat, longitude: lng, weightKg: optNum(20, 300), medicalInfo: optStr, lastDonationDate: optDate,
  }),
  z.object({ ...base, role: z.literal('RECEIVER'), bloodGroup, address: z.string().trim().min(3), city: z.string().trim().min(2) }),
  z.object({
    ...base, role: z.literal('HOSPITAL'), licenseNo: z.string().trim().min(3).max(50),
    address: z.string().trim().min(3), city: z.string().trim().min(2), latitude: lat, longitude: lng,
  }),
]);

export const adminCreateUserSchema = z.discriminatedUnion('role', [
  ...registerSchema.options.map((o) => o.extend({ status: z.nativeEnum(AccountStatus).optional() })),
] as any);

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(10), password });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });

export const donorProfileSchema = z.object({
  name: name.optional(), phone: phone.optional(), address: z.string().trim().min(3).optional(), city: z.string().trim().min(2).optional(),
  latitude: lat, longitude: lng, bloodGroup: bloodGroup.optional(),
  weightKg: optNum(20, 300), medicalInfo: z.string().trim().max(2000).optional(), lastDonationDate: optDate,
});
export const availabilitySchema = z.object({ availability: z.boolean() });
export const receiverProfileSchema = z.object({
  name: name.optional(), phone: phone.optional(), address: z.string().trim().min(3).optional(),
  city: z.string().trim().min(2).optional(), bloodGroup: bloodGroup.optional(),
});
export const hospitalProfileSchema = z.object({
  name: name.optional(), phone: phone.optional(), address: z.string().trim().min(3).optional(),
  city: z.string().trim().min(2).optional(), latitude: lat, longitude: lng,
});

export const adminUpdateUserSchema = z.object({
  name: name.optional(), phone: phone.optional(), email: email.optional(),
  bloodGroup: bloodGroup.optional(), address: z.string().trim().min(3).optional(), city: z.string().trim().min(2).optional(),
  latitude: lat, longitude: lng, licenseNo: z.string().trim().min(3).max(50).optional(),
  password: password.optional(),
});
export const userStatusSchema = z.object({ status: z.nativeEnum(AccountStatus), reason: optStr });
export const approveSchema = z.object({ approve: z.boolean().default(true), reason: optStr });

export const requestCreateSchema = z.object({
  patientName: z.string().trim().min(2).max(120),
  bloodGroup,
  units: z.coerce.number().int().min(1).max(20),
  hospitalId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
  city: z.string().trim().min(2),
  address: optStr,
  latitude: lat,
  longitude: lng,
  urgency: z.nativeEnum(Urgency).default('NORMAL'),
  requiredDate: z.coerce.date(),
  notes: optStr,
});
export const requestUpdateSchema = requestCreateSchema.partial();
export const requestStatusSchema = z.object({ status: z.nativeEnum(RequestStatus) });
export const respondSchema = z.object({ action: z.enum(['ACCEPT', 'REJECT']) });

export const donationCreateSchema = z.object({
  donorId: z.coerce.number().int().positive(),
  requestId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
  hospitalId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
  units: z.coerce.number().int().min(1).max(10).default(1),
  status: z.nativeEnum(DonationStatus).default('PENDING'),
  donationDate: optDate,
  notes: optStr,
});
export const donationStatusSchema = z.object({ status: z.nativeEnum(DonationStatus) });

export const inventorySchema = z.object({
  bloodGroup,
  units: z.coerce.number().int().min(0).max(10000),
  amountMl: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().min(0).optional()),
  status: z.enum(['AVAILABLE', 'RESERVED']).default('AVAILABLE'),
  collectionDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  hospitalId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
}).refine((d) => d.expiryDate > d.collectionDate, { message: 'Expiry date must be after collection date', path: ['expiryDate'] });

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Please write a short comment').max(1000),
  requestId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
});

export const patientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.nativeEnum(Gender),
  bloodGroup,
  diagnosis: z.string().trim().min(2).max(500),
  admissionDate: z.coerce.date(),
  status: z.nativeEnum(PatientStatus).default('ADMITTED'),
});

export const sendNotificationSchema = z.object({
  title: z.string().trim().min(2).max(150),
  message: z.string().trim().min(2).max(1000),
  audience: z.enum(['ALL', 'DONOR', 'RECEIVER', 'HOSPITAL', 'USER']),
  userId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().positive().optional()),
  type: z.nativeEnum(NotificationType).default('GENERAL'),
});

export const chatSchema = z.object({ message: z.string().trim().min(1).max(2000) });
