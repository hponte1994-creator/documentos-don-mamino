import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('DonMamino2025', 10);

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  });

  console.log('Usuario administrador listo:');
  console.log('  usuario:', admin.username);
  console.log('  contraseña: DonMamino2025 (cámbiala después de tu primer ingreso)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
