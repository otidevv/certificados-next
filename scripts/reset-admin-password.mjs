import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

const email = 'admin@unamad.edu.pe';
const newPassword = '954040025';

const hash = await bcrypt.hash(newPassword, 12);

const user = await prisma.user.update({
  where: { email },
  data: { password: hash },
  select: { id: true, email: true, role: true, status: true },
});

console.log('Password updated for:', user);
process.exit(0);
