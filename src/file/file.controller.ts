import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileService } from "./file.service";
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid'
import path = require('path');
import { join } from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from "src/auth/guards/jwt-guard";
import { Observable, of } from 'rxjs';
import { File } from './models/file.interface';
import { Pagination } from 'nestjs-typeorm-paginate';

export const storage = {
    storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
            const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
            const extension: string = path.parse(file.originalname).ext;

            cb(null, `${filename}${extension}`)
        }
    })
}


@Controller('files')
export class FileController {
    constructor(private fileService: FileService) { }

    // @Get()
    // getAll() {
    //     return this.fileService.getAll();
    // }

    @Get()
    index(@Query('page') page: number = 1, @Query('limit') limit: number = 10,): Observable<Pagination<File>> {
        limit = limit > 100 ? 100 : limit;

        return this.fileService.paginate({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/files' });
    }

    @Get(':id')
    findOne(@Param('id') id:string): Observable<File> {
        return this.fileService.findById(Number(id));
    }

    // upload image
    //@UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file, @Request() req): Observable<Object> { 
        console.log(file);

        return this.fileService.create({ 
            file_name: file.filename, 
            original_name: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            destination: file.destination,
            path: file.path,
            size: file.size,
        });
    }

    // get image
    @Get('img/:imagename')
    getImage(@Param('imagename') imagename, @Res() res): Observable<Object> { 
        return of(res.sendfile(join(process.cwd(), 'uploads/' + imagename)));
    }

    // delete image by id and name
    @Delete('img/:id/:imagename')
    deleteImage(@Param('imagename') imagename: string, @Param('id') id:string) { 
        fs.unlink('uploads/' + imagename, (err) => {
            if (err) {
                console.error(err);
                return err;
            }else{
                console.log('Deleted successfully');
            }
        });
        return this.fileService.deleteOne(Number(id));
    }

    // delete image by id
    @Delete(':id')
    deleteOne(@Param('id') id:string):Observable<any>{
        return this.fileService.deleteOne(Number(id));
    }
}