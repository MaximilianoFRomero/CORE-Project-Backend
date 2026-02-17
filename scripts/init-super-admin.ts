import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../src/modules/users/entities/user.entity';

async function initializeSuperAdmin() {
  console.log('🚀 Inicializando Super Administrador...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'core_platform',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const userRepository = dataSource.getRepository(User);

    const existingSuperAdmin = await userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN }
    });

    if (existingSuperAdmin) {
      console.log('✅ Super Admin ya existe:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Role:', existingSuperAdmin.role);
      console.log('   Status:', existingSuperAdmin.status);

      const result = await dataSource.query(
        'SELECT password FROM users WHERE id = $1',
        [existingSuperAdmin.id]
      );
      console.log('   Password hash (first 30 chars):', result[0]?.password?.substring(0, 30));
      return;
    }

    const superAdminConfig = {
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@coreplatform.dev',
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'System',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Administrator',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    };

    console.log('📝 Configurando Super Admin:', superAdminConfig.email);
    console.log('📝 Password plaintext:', superAdminConfig.password);

    const superAdmin = userRepository.create({
      email: superAdminConfig.email,
      firstName: superAdminConfig.firstName,
      lastName: superAdminConfig.lastName,
      password: superAdminConfig.password,
      role: superAdminConfig.role,
      status: superAdminConfig.status,
      emailVerified: superAdminConfig.emailVerified,
    });

    await userRepository.save(superAdmin);

    console.log('🎉 Super Admin creado exitosamente!');
    console.log('📋 Credenciales:');
    console.log('   Email:', superAdmin.email);
    console.log('   Password (plaintext):', superAdminConfig.password);
    console.log('   Role:', superAdmin.role);
    console.log('   Status:', superAdmin.status);

    const result = await dataSource.query(
      'SELECT password FROM users WHERE id = $1',
      [superAdmin.id]
    );
    console.log('   Password hash (first 30 chars):', result[0]?.password?.substring(0, 30));

    console.log('\n⚠️  GUARDA ESTAS CREDENCIALES EN UN LUGAR SEGURO ⚠️');
    console.log('   Cambia la contraseña en el primer inicio de sesión.');

  } catch (error) {
    console.error('❌ Error al crear Super Admin:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  initializeSuperAdmin();
}

export { initializeSuperAdmin };