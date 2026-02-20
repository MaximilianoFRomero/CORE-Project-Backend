import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initializeSuperAdmin() {
  console.log('🚀 Inicializando Super Administrador...');

  try {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'super_admin' },
    });

    if (existingSuperAdmin) {
      console.log('✅ Super Admin ya existe:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Role:', existingSuperAdmin.role);
      console.log('   Status:', existingSuperAdmin.status);
      console.log(
        '   Password hash (first 30 chars):',
        existingSuperAdmin.password?.substring(0, 30),
      );
      return;
    }

    const superAdminConfig = {
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@coreplatform.dev',
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'System',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Administrator',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
    };

    console.log('📝 Configurando Super Admin:', superAdminConfig.email);
    console.log('📝 Password plaintext:', superAdminConfig.password);

    const hashedPassword = await bcrypt.hash(superAdminConfig.password, 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminConfig.email,
        firstName: superAdminConfig.firstName,
        lastName: superAdminConfig.lastName,
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });

    console.log('🎉 Super Admin creado exitosamente!');
    console.log('📋 Credenciales:');
    console.log('   Email:', superAdmin.email);
    console.log('   Password (plaintext):', superAdminConfig.password);
    console.log('   Role:', superAdmin.role);
    console.log('   Status:', superAdmin.status);
    console.log(
      '   Password hash (first 30 chars):',
      superAdmin.password?.substring(0, 30),
    );

    console.log('\n⚠️  GUARDA ESTAS CREDENCIALES EN UN LUGAR SEGURO ⚠️');
    console.log('   Cambia la contraseña en el primer inicio de sesión.');
  } catch (error) {
    console.error('❌ Error al crear Super Admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initializeSuperAdmin();
}

export { initializeSuperAdmin };
