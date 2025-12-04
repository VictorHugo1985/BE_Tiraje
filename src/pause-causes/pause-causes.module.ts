import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PauseCausesService } from './pause-causes.service';
import { PauseCausesController } from './pause-causes.controller';
import { PauseCause, PauseCauseSchema } from './schemas/pause-cause.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PauseCause.name, schema: PauseCauseSchema }]),
  ],
  controllers: [PauseCausesController],
  providers: [PauseCausesService],
  exports: [PauseCausesService],
})
export class PauseCausesModule {}
