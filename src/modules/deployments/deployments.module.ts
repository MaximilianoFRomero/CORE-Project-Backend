import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
