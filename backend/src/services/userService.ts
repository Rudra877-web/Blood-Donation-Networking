import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { userSelect } from '../utils/userMapper';

/** Creates a user with its role-specific profile in a single transaction. */
export async function createUserWithProfile(input: any, status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' = 'PENDING') {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const common = { email: input.email, passwordHash, role: input.role, status: input.status ?? status, name: input.name, phone: input.phone };
  let profile: any = {};
  if (input.role === 'DONOR') {
    profile = {
      donor: {
        create: {
          bloodGroup: input.bloodGroup, address: input.address, city: input.city, latitude: input.latitude, longitude: input.longitude,
          weightKg: input.weightKg, medicalInfo: input.medicalInfo, lastDonationDate: input.lastDonationDate,
        },
      },
    };
  } else if (input.role === 'RECEIVER') {
    profile = { receiver: { create: { bloodGroup: input.bloodGroup, address: input.address, city: input.city } } };
  } else if (input.role === 'HOSPITAL') {
    profile = {
      hospital: {
        create: { licenseNo: input.licenseNo, address: input.address, city: input.city, latitude: input.latitude, longitude: input.longitude },
      },
    };
  } else if (input.role === 'ADMIN') {
    profile = { admin: { create: {} } };
  }
  return prisma.user.create({ data: { ...common, ...profile }, select: userSelect });
}
