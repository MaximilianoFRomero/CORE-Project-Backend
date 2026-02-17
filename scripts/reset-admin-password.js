"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../src/modules/users/entities/user.entity");
async function resetAdminPassword() {
    console.log('🔄 Reseteando contraseña de admin...');
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'core_platform',
        entities: [user_entity_1.User],
        synchronize: false,
    });
    await dataSource.initialize();
    const userRepo = dataSource.getRepository(user_entity_1.User);
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
//# sourceMappingURL=reset-admin-password.js.map