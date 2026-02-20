import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'core_platform',
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function resetAdminPassword() {
  console.log('🔄 Reseteando contraseña de admin...');

  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'superadmin@coreplatform.dev' },
    });

    if (!admin) {
      console.log('❌ Admin no encontrado');
      return;
    }

    console.log('🔧 Admin encontrado:', admin.email);
    console.log('🔧 Hash actual:', admin.password?.substring(0, 30) + '...');

    const newPassword = 'Admin123!';
    console.log('🔧 Nueva contraseña:', newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Contraseña reseteada');
    console.log('🔧 Nuevo hash:', updatedAdmin.password.substring(0, 30) + '...');

    const isValid = await bcrypt.compare(newPassword, updatedAdmin.password);
    console.log('🔧 ¿Nueva contraseña válida?:', isValid);

    if (isValid) {
      console.log('\n🎉 ¡Funciona! Usa estas credenciales:');
      console.log('   Email: superadmin@coreplatform.dev');
      console.log('   Password: Admin123!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetAdminPassword();
