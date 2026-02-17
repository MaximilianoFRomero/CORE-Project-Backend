import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/users/entities/user.entity';

async function resetAdminPassword() {
  console.log('🔄 Reseteando contraseña de admin...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'core_platform',
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);

  const admin = await userRepo.findOne({
    where: { email: 'superadmin@coreplatform.dev' }
  });

  if (!admin) {
    console.log('❌ Admin no encontrado');
    return;
  }

  console.log('🔧 Admin encontrado:', admin.email);
  console.log('🔧 Hash actual:', admin.password?.substring(0, 30) + '...');

  const newPassword = 'Admin123!';
  console.log('🔧 Nueva contraseña:', newPassword);

  admin.password = newPassword;
  await userRepo.save(admin);

  const updatedAdmin = await userRepo
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.id = :id', { id: admin.id })
    .getOne();
  if (!updatedAdmin) {
    console.error('❌ Error: No se pudo verificar el usuario actualizado');
    await dataSource.destroy();
    return;
  }
  console.log('✅ Contraseña reseteada');
  console.log('🔧 Nuevo hash:', updatedAdmin.password.substring(0, 30) + '...');

  const isValid = await bcrypt.compare(newPassword, updatedAdmin.password);
  console.log('🔧 ¿Nueva contraseña válida?:', isValid);

  if (isValid) {
    console.log('\n🎉 ¡Funciona! Usa estas credenciales:');
    console.log('   Email: superadmin@coreplatform.dev');
    console.log('   Password: Admin123!');
  }

  await dataSource.destroy();
}

resetAdminPassword();