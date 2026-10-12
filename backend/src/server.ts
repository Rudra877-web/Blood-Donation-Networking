import http from 'http';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { initSocket } from './sockets';
import { startAutoExpandJob } from './services/matchingService';

const server = http.createServer(app);
initSocket(server);

async function main() {
  await prisma.$connect();
  console.log('PostgreSQL connected');
  startAutoExpandJob();
  server.listen(env.port, () => console.log(`API running on http://localhost:${env.port}/api`));
}

main().catch((e) => {
  console.error('Failed to start server:', e.message);
  process.exit(1);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
