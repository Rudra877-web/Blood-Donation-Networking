import 'dotenv/config';

for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
  }
}

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Blood Donation Network <no-reply@example.com>',
  },
  rules: {
    minDonationGapDays: num(process.env.MIN_DONATION_GAP_DAYS, 90),
    minDonorWeightKg: num(process.env.MIN_DONOR_WEIGHT_KG, 45),
    matchBatchSize: num(process.env.MATCH_BATCH_SIZE, 5),
    radiusStepsKm: (process.env.SEARCH_RADIUS_STEPS_KM || '10,25,50,100,250')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => n > 0),
    autoExpandAfterMinutes: num(process.env.AUTO_EXPAND_AFTER_MINUTES, 15),
    lowStockUnits: num(process.env.LOW_STOCK_UNITS, 5),
  },
};
