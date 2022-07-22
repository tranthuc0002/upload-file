import { diskStorage } from 'multer';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { get } from 'http';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { User, UserRole } from './models/user.interface';
import { UserService } from './user.service';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid'
import path = require('path');
import { join } from 'path';
import * as fs from 'fs';

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

@Controller('users')
export class UserController {

    constructor(private userService: UserService){}

    @Post()
    create(@Body() user: User): Observable<User | Object> {
        return this.userService.create(user).pipe(
            map((user:User)=>user),
            catchError(err => of({ error: err.message }))
        );
    }

    @Post('login')
    login(@Body() user: User): Observable<Object> { 
        return this.userService.login(user).pipe(
            map((jwt: string) => { 
                return { access_token: jwt };
            })
        )
    }

    @Get(':id')
    findOne(@Param() params): Observable<User> {
        return this.userService.findOne(params.id);
    }

    @Get()
    index(@Query('page') page: number = 1, @Query('limit') limit: number = 10,): Observable<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;

        return this.userService.paginate({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/users' });
    }
    // findAll():Observable<User[]>{
    //     return this.userService.findAll();
    // }

    @Put(':id')
    updateOne(@Param('id') id:string, @Body() user:User):Observable<any>{
        return this.userService.updateOne(Number(id),user);
    }

    @Delete(':id')
    deleteOne(@Param('id') id:string):Observable<any>{
        return this.userService.deleteOne(Number(id));
    }

    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: string, @Body() user: User): Observable<User> { 
        return this.userService.updateRoleOfUser(Number(id), user);
    }

    // upload image
    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file, @Request() req): Observable<Object> { 
        const user: User = req.user.user;

        return this.userService.updateOne(user.id, { profileImage: file.filename }).pipe(
            tap((user: User) => console.log(user)),
            map((user: User) => ({ profileImage: user.profileImage }))
        )
    }

    // get image
    @Get('profile-image/:imagename')
    getProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> { 
        return of(res.sendfile(join(process.cwd(), 'uploads/' + imagename)));
    }

    // delete image
    @Delete('profile-image/:imagename')
    deleteImage(@Param('imagename') imagename: string) { 
        fs.unlink('uploads/' + imagename, (err) => {
            if (err) {
                console.error(err);
                return err;
            }else{
                console.log('Deleted successfully');
            }
            return true;
        });
    }
}
