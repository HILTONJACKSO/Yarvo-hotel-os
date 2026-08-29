import { Module } from '@nestjs/common';
import { FoliosService } from './folios.service';
import { FoliosController } from './folios.controller';

@Module({
  providers: [FoliosService],
  controllers: [FoliosController]
})
export class FoliosModule {}

