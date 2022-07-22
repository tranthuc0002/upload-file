import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { FileEntity } from './models/file.entity';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    AuthModule
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService]
})
export class FileModule {}
