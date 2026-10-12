import { PrismaClient, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password@123';
const days = (n: number) => new Date(Date.now() + n * 86400000);

async function main() {
  console.log('Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.requestAlert.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.bloodInventory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const mk = (email: string, role: any, name: string, phone: string, status: any = 'ACTIVE') => ({ email, passwordHash, role, name, phone, status });

  await prisma.user.create({ data: { ...mk('admin@bdns.test', 'ADMIN', 'System Admin', '9000000000'), admin: { create: {} } } });

  // Hospitals (Gandhinagar / Ahmedabad area coordinates)
  const hospitalsData = [
    { email: 'hospital1@bdns.test', name: 'City Care Hospital', lic: 'GJ/HOS/2021/0101', city: 'Gandhinagar', address: 'Sector 11, Gandhinagar', lat: 23.2237, lng: 72.6497 },
    { email: 'hospital2@bdns.test', name: 'Lifeline Medical Centre', lic: 'GJ/HOS/2020/0202', city: 'Ahmedabad', address: 'Navrangpura, Ahmedabad', lat: 23.0395, lng: 72.5601 },
    { email: 'hospital3@bdns.test', name: 'Sunrise General Hospital', lic: 'GJ/HOS/2019/0303', city: 'Ahmedabad', address: 'Satellite, Ahmedabad', lat: 23.0258, lng: 72.5073 },
  ];
  const hospitals = [];
  for (const [i, h] of hospitalsData.entries()) {
    const u = await prisma.user.create({
      data: { ...mk(h.email, 'HOSPITAL', h.name, `0792300010${i}`), hospital: { create: { licenseNo: h.lic, address: h.address, city: h.city, latitude: h.lat, longitude: h.lng } } },
      include: { hospital: true },
    });
    hospitals.push(u.hospital!);
  }
  await prisma.user.create({ data: { ...mk('hospital.pending@bdns.test', 'HOSPITAL', 'Pending Clinic', '0792300099', 'PENDING'), hospital: { create: { licenseNo: 'GJ/HOS/2026/0999', address: 'Sector 21', city: 'Gandhinagar', latitude: 23.2156, longitude: 72.6369 } } } });

  // Donors
  const donorsData: [string, string, BloodGroup, string, number, number, number | null][] = [
    ['donor1@bdns.test', 'Aarav Patel', 'O_NEG', 'Gandhinagar', 23.2156, 72.6369, 120],
    ['donor2@bdns.test', 'Diya Shah', 'A_POS', 'Gandhinagar', 23.2300, 72.6600, 150],
    ['donor3@bdns.test', 'Vihaan Mehta', 'B_POS', 'Ahmedabad', 23.0300, 72.5800, 200],
    ['donor4@bdns.test', 'Isha Desai', 'O_POS', 'Ahmedabad', 23.0500, 72.5400, 20],  // recently donated -> not eligible
    ['donor5@bdns.test', 'Kabir Joshi', 'AB_POS', 'Ahmedabad', 23.0100, 72.5200, null],
    ['donor6@bdns.test', 'Anaya Trivedi', 'A_NEG', 'Gandhinagar', 23.2000, 72.6300, 95],
    ['donor7@bdns.test', 'Reyansh Modi', 'O_POS', 'Gandhinagar', 23.2400, 72.6700, 300],
  ];
  const donors = [];
  for (const [email, name, bg, city, lat, lng, since] of donorsData) {
    const u = await prisma.user.create({
      data: {
        ...mk(email, 'DONOR', name, '98250' + String(10000 + donors.length * 111).slice(0, 5)),
        donor: { create: { bloodGroup: bg, address: `${city} (demo address)`, city, latitude: lat, longitude: lng, weightKg: 60 + donors.length * 3, medicalInfo: 'No known conditions', lastDonationDate: since ? days(-since) : null, availability: email !== 'donor7@bdns.test' } },
      },
      include: { donor: true },
    });
    donors.push(u.donor!);
  }
  await prisma.user.create({ data: { ...mk('donor.pending@bdns.test', 'DONOR', 'Pending Donor', '9825099999', 'PENDING'), donor: { create: { bloodGroup: 'B_NEG', address: 'Demo', city: 'Gandhinagar' } } } });

  // Receivers
  const receivers = [];
  for (const [i, [email, name, bg, city]] of ([
    ['receiver1@bdns.test', 'Rohan Gupta', 'A_POS', 'Gandhinagar'],
    ['receiver2@bdns.test', 'Meera Nair', 'O_POS', 'Ahmedabad'],
    ['receiver3@bdns.test', 'Sanjay Rao', 'AB_POS', 'Ahmedabad'],
  ] as [string, string, BloodGroup, string][]).entries()) {
    const u = await prisma.user.create({
      data: { ...mk(email, 'RECEIVER', name, `9712000${100 + i}`), receiver: { create: { bloodGroup: bg, address: `${city} (demo address)`, city } } },
      include: { receiver: true },
    });
    receivers.push(u.receiver!);
  }

  // Patients
  const patientRows: [number, string, number, any, BloodGroup, string, number, any][] = [
    [0, 'Ramesh Kumar', 54, 'MALE', 'A_POS', 'Post-surgery anaemia', -3, 'UNDER_TREATMENT'],
    [0, 'Sita Devi', 32, 'FEMALE', 'O_NEG', 'Postpartum haemorrhage', -1, 'ADMITTED'],
    [1, 'Imran Sheikh', 41, 'MALE', 'B_POS', 'Accident trauma', -5, 'UNDER_TREATMENT'],
    [1, 'Tara Singh', 9, 'FEMALE', 'AB_POS', 'Thalassemia', -10, 'ADMITTED'],
    [2, 'John Dsouza', 67, 'MALE', 'O_POS', 'Cardiac surgery', -2, 'DISCHARGED'],
  ];
  for (const [h, name, age, gender, bg, diagnosis, adm, status] of patientRows) {
    await prisma.patient.create({ data: { hospitalId: hospitals[h].id, name, age, gender, bloodGroup: bg, diagnosis, admissionDate: days(adm), status } });
  }

  // Inventory (one fresh batch per group, plus one expired + one reserved batch)
  const stock: Record<string, number> = { A_POS: 14, A_NEG: 4, B_POS: 11, B_NEG: 3, O_POS: 18, O_NEG: 2, AB_POS: 6, AB_NEG: 1 };
  for (const [g, units] of Object.entries(stock)) {
    await prisma.bloodInventory.create({ data: { bloodGroup: g as BloodGroup, units, amountMl: units * 450, collectionDate: days(-7), expiryDate: days(35), hospitalId: hospitals[0].id } });
  }
  await prisma.bloodInventory.create({ data: { bloodGroup: 'B_POS', units: 3, amountMl: 1350, collectionDate: days(-60), expiryDate: days(-5) } });
  await prisma.bloodInventory.create({ data: { bloodGroup: 'O_POS', units: 4, amountMl: 1800, status: 'RESERVED', collectionDate: days(-3), expiryDate: days(39), hospitalId: hospitals[1].id } });

  // Requests
  const r1 = await prisma.bloodRequest.create({
    data: { receiverId: receivers[0].id, hospitalId: hospitals[0].id, patientName: 'Ramesh Kumar', bloodGroup: 'A_POS', units: 2, urgency: 'URGENT', status: 'MATCHED', hospitalApproved: true, approvedAt: days(-1), requiredDate: days(1), city: 'Gandhinagar', notes: 'Scheduled surgery', searchRadiusKm: 10, lastExpandedAt: new Date() },
  });
  const r2 = await prisma.bloodRequest.create({
    data: { receiverId: receivers[1].id, hospitalId: hospitals[1].id, patientName: 'Imran Sheikh', bloodGroup: 'B_POS', units: 1, urgency: 'CRITICAL', status: 'PENDING', requiredDate: days(0), city: 'Ahmedabad', searchRadiusKm: 10, lastExpandedAt: new Date() },
  });
  await prisma.bloodRequest.create({
    data: { receiverId: receivers[2].id, hospitalId: hospitals[1].id, patientName: 'Tara Singh', bloodGroup: 'AB_POS', units: 1, urgency: 'NORMAL', status: 'COMPLETED', hospitalApproved: true, approvedAt: days(-9), completedAt: days(-7), requiredDate: days(-8), city: 'Ahmedabad', searchRadiusKm: 10 },
  });
  await prisma.bloodRequest.create({
    data: { receiverId: receivers[0].id, patientName: 'Sita Devi', bloodGroup: 'O_NEG', units: 2, urgency: 'CRITICAL', status: 'CANCELLED', requiredDate: days(-2), city: 'Gandhinagar', searchRadiusKm: 10 },
  });

  // Alerts + donations
  await prisma.requestAlert.createMany({
    data: [
      { requestId: r1.id, donorId: donors[1].id, distanceKm: 3.2, status: 'ACCEPTED' },
      { requestId: r1.id, donorId: donors[0].id, distanceKm: 1.4, status: 'REJECTED' },
      { requestId: r1.id, donorId: donors[5].id, distanceKm: 4.9, status: 'NOTIFIED' },
      { requestId: r2.id, donorId: donors[2].id, distanceKm: 5.6, status: 'NOTIFIED' },
      { requestId: r2.id, donorId: donors[0].id, distanceKm: 34.1, status: 'NOTIFIED', wave: 2 },
    ],
  });
  await prisma.donation.createMany({
    data: [
      { donorId: donors[1].id, requestId: r1.id, hospitalId: hospitals[0].id, units: 1, status: 'CONFIRMED' },
      { donorId: donors[4].id, hospitalId: hospitals[1].id, units: 1, status: 'COMPLETED', donationDate: days(-7), notes: 'Thalassemia patient' },
      { donorId: donors[0].id, hospitalId: hospitals[0].id, units: 1, status: 'COMPLETED', donationDate: days(-120) },
      { donorId: donors[3].id, hospitalId: hospitals[2].id, units: 1, status: 'COMPLETED', donationDate: days(-20) },
    ],
  });

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const idOf = (email: string) => users.find((u) => u.email === email)!.id;
  await prisma.notification.createMany({
    data: [
      { userId: idOf('donor3@bdns.test'), type: 'BLOOD_REQUEST_ALERT', title: 'CRITICAL blood request: B+', message: '1 unit(s) of B+ needed in Ahmedabad (5.6 km from you).', data: { requestId: r2.id } },
      { userId: idOf('donor6@bdns.test'), type: 'BLOOD_REQUEST_ALERT', title: 'URGENT blood request: A+', message: '2 unit(s) of A+ needed in Gandhinagar (4.9 km from you).', data: { requestId: r1.id } },
      { userId: idOf('receiver1@bdns.test'), type: 'DONOR_ACCEPTED', title: 'A donor accepted your request', message: 'Diya Shah accepted the A+ request for Ramesh Kumar.', data: { requestId: r1.id } },
      { userId: idOf('receiver1@bdns.test'), type: 'HOSPITAL_APPROVED', title: 'Hospital approved your request', message: 'Your A+ request for Ramesh Kumar was approved.', data: { requestId: r1.id } },
      { userId: idOf('hospital2@bdns.test'), type: 'GENERAL', title: 'New blood request', message: 'CRITICAL request for 1 unit(s) of B+ needs your review.', data: { requestId: r2.id } },
      { userId: idOf('admin@bdns.test'), type: 'GENERAL', title: 'New registration pending', message: 'Pending Donor (DONOR) is waiting for approval.' },
    ],
  });

  await prisma.feedback.createMany({
    data: [
      { userId: idOf('receiver3@bdns.test'), requestId: undefined, rating: 5, comment: 'Found a donor within hours. Fantastic platform!' },
      { userId: idOf('receiver1@bdns.test'), rating: 4, comment: 'Very helpful, chat with the donor was easy.' },
      { userId: idOf('donor5@bdns.test'), rating: 5, comment: 'Simple to donate and track my history.' },
      { userId: idOf('hospital2@bdns.test'), rating: 4, comment: 'Reduces the time we spend arranging donors.' },
    ],
  });

  await prisma.chatMessage.createMany({
    data: [
      { requestId: r1.id, senderId: idOf('receiver1@bdns.test'), message: 'Thank you for accepting! Surgery is tomorrow morning.' },
      { requestId: r1.id, senderId: idOf('donor2@bdns.test'), message: 'Happy to help. I will reach City Care Hospital at 9 AM.' },
    ],
  });

  await prisma.systemLog.createMany({
    data: [
      { userId: idOf('admin@bdns.test'), action: 'LOGIN', entity: 'User', details: 'Seeded demo activity' },
      { userId: idOf('admin@bdns.test'), action: 'REGISTRATION_APPROVED', entity: 'User', details: 'Seeded demo activity' },
      { userId: idOf('receiver1@bdns.test'), action: 'REQUEST_CREATE', entity: 'BloodRequest', entityId: r1.id },
      { userId: idOf('donor2@bdns.test'), action: 'DONOR_ACCEPT', entity: 'BloodRequest', entityId: r1.id },
    ],
  });

  console.log('Seed complete. Demo password for every account:', DEMO_PASSWORD);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
