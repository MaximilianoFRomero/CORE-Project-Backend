import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('Users Controller (e2e)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const superAdminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'superadmin@core.com',
        password: 'SuperAdmin123!',
      });
    
    superAdminToken = superAdminLogin.body.access_token;
  });

  describe('POST /users/admin', () => {
    it('should create admin user when super-admin', () => {
      return request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newadmin@core.com',
          firstName: 'New',
          lastName: 'Admin',
          password: 'Admin123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.role).toBe(UserRole.ADMIN);
          expect(res.body.status).toBe('active');
        });
    });

    it('should fail when non-super-admin tries to create admin', async () => {
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@core.com',
          password: 'Admin123!',
        });
      
      adminToken = adminLogin.body.access_token;

      return request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'another@core.com',
          firstName: 'Another',
          lastName: 'Admin',
          password: 'Admin123!',
        })
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
