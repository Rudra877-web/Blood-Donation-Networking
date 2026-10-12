import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import * as S from '../validators/schemas';
import * as auth from '../controllers/authController';
import * as admin from '../controllers/adminController';
import * as donor from '../controllers/donorController';
import * as receiver from '../controllers/receiverController';
import * as hospital from '../controllers/hospitalController';
import * as request from '../controllers/requestController';
import * as donation from '../controllers/donationController';
import * as inventory from '../controllers/inventoryController';
import * as notification from '../controllers/notificationController';
import * as feedback from '../controllers/feedbackController';
import * as report from '../controllers/reportController';
import * as chat from '../controllers/chatController';

const r = Router();
const A = authorize('ADMIN'), D = authorize('DONOR'), R = authorize('RECEIVER'), H = authorize('HOSPITAL');

r.get('/health', (_q, s) => s.json({ success: true, message: 'OK', data: { time: new Date() } }));

// ---- Public ----
r.get('/public/availability', inventory.publicAvailability);
r.get('/public/stats', inventory.publicStats);

// ---- Auth ----
r.post('/auth/register', authLimiter, validate(S.registerSchema), auth.register);
r.post('/auth/login', authLimiter, validate(S.loginSchema), auth.login);
r.post('/auth/forgot-password', authLimiter, validate(S.forgotSchema), auth.forgotPassword);
r.post('/auth/reset-password', authLimiter, validate(S.resetSchema), auth.resetPassword);
r.post('/auth/logout', authenticate, auth.logout);
r.get('/auth/me', authenticate, auth.me);
r.put('/auth/change-password', authenticate, validate(S.changePasswordSchema), auth.changePassword);

// Everything below requires a valid, ACTIVE account
r.use(authenticate);

// ---- Admin ----
r.get('/admin/dashboard', A, admin.dashboard);
r.get('/admin/users', A, admin.listUsers);
r.post('/admin/users', A, validate(S.adminCreateUserSchema), admin.createUser);
r.get('/admin/users/:id', A, admin.getUser);
r.put('/admin/users/:id', A, validate(S.adminUpdateUserSchema), admin.updateUser);
r.delete('/admin/users/:id', A, admin.deleteUser);
r.put('/admin/users/:id/approve', A, validate(S.approveSchema), admin.approveUser);
r.put('/admin/users/:id/status', A, validate(S.userStatusSchema), admin.setUserStatus);
r.get('/admin/logs', A, admin.listLogs);
r.get('/admin/settings', A, admin.settings);

// ---- Donors ----
r.get('/donors', authorize('ADMIN', 'HOSPITAL'), donor.listDonors);
r.get('/donors/search', authorize('ADMIN', 'HOSPITAL', 'RECEIVER'), donor.searchDonors);
r.get('/donors/me', D, donor.getMe);
r.get('/donors/dashboard', D, donor.dashboard);
r.put('/donors/profile', D, validate(S.donorProfileSchema), donor.updateProfile);
r.put('/donors/availability', D, validate(S.availabilitySchema), donor.setAvailability);

// ---- Receivers ----
r.get('/receivers', A, receiver.listReceivers);
r.get('/receivers/me', R, receiver.getMe);
r.get('/receivers/dashboard', R, receiver.dashboard);
r.put('/receivers/profile', R, validate(S.receiverProfileSchema), receiver.updateProfile);

// ---- Hospitals ----
r.get('/hospitals', hospital.listHospitals);
r.get('/hospitals/me', H, hospital.getMe);
r.get('/hospitals/dashboard', H, hospital.dashboard);
r.get('/hospitals/reports', H, hospital.reports);
r.put('/hospitals/profile', H, validate(S.hospitalProfileSchema), hospital.updateProfile);
r.get('/hospitals/requests', H, hospital.incomingRequests);
r.put('/hospitals/requests/:id/approve', H, hospital.approve);
r.put('/hospitals/requests/:id/reject', H, hospital.reject);
r.put('/hospitals/requests/:id/complete', H, hospital.complete);

// ---- Patients (hospital only) ----
r.get('/patients', H, hospital.listPatients);
r.post('/patients', H, validate(S.patientSchema), hospital.createPatient);
r.get('/patients/:id', H, hospital.getPatient);
r.put('/patients/:id', H, validate(S.patientSchema.partial()), hospital.updatePatient);
r.delete('/patients/:id', H, hospital.deletePatient);

// ---- Blood requests ----
r.post('/requests', R, validate(S.requestCreateSchema), request.createRequest);
r.get('/requests', request.listRequests);
r.get('/requests/:id', request.getRequest);
r.put('/requests/:id', authorize('ADMIN', 'RECEIVER'), validate(S.requestUpdateSchema), request.updateRequest);
r.put('/requests/:id/status', authorize('ADMIN', 'RECEIVER', 'HOSPITAL'), validate(S.requestStatusSchema), request.updateStatus);
r.post('/requests/:id/respond', D, validate(S.respondSchema), request.respond);
r.post('/requests/:id/expand', authorize('ADMIN', 'RECEIVER'), request.expandRequest);
r.delete('/requests/:id', A, request.deleteRequest);

// ---- Donations ----
r.get('/donations', donation.listDonations);
r.post('/donations', A, validate(S.donationCreateSchema), donation.createDonation);
r.put('/donations/:id/status', authorize('ADMIN', 'HOSPITAL'), validate(S.donationStatusSchema), donation.updateStatus);
r.delete('/donations/:id', A, donation.deleteDonation);

// ---- Inventory ----
r.get('/inventory', authorize('ADMIN', 'HOSPITAL'), inventory.listInventory);
r.post('/inventory', A, validate(S.inventorySchema), inventory.createInventory);
r.put('/inventory/:id', A, validate(S.inventorySchema), inventory.updateInventory);
r.delete('/inventory/:id', A, inventory.deleteInventory);

// ---- Notifications ----
r.get('/notifications', notification.listNotifications);
r.get('/notifications/unread-count', notification.unreadCount);
r.put('/notifications/read-all', notification.markAllRead);
r.put('/notifications/:id/read', notification.markRead);
r.post('/notifications', A, validate(S.sendNotificationSchema), notification.send);

// ---- Feedback ----
r.get('/feedback', feedback.listFeedback);
r.post('/feedback', authorize('DONOR', 'RECEIVER', 'HOSPITAL'), validate(S.feedbackSchema), feedback.createFeedback);
r.delete('/feedback/:id', A, feedback.deleteFeedback);

// ---- Reports ----
r.get('/reports', A, report.generate);

// ---- Chat (request based) ----
r.get('/chat/conversations', chat.conversations);
r.get('/chat/:requestId', chat.getMessages);
r.post('/chat/:requestId', validate(S.chatSchema), chat.sendMessage);

export default r;
