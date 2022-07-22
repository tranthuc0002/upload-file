import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, Observable, throwError } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { Repository } from 'typeorm';
import { UserEntity } from './models/user.entity';
import { User, UserRole } from './models/user.interface';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) 
        private readonly userRepository: Repository<UserEntity>,
        private authService: AuthService,
    ){}

    create(user:User): Observable<User>{
        return this.authService.hashPassword(user.password).pipe(
            switchMap((passwordHash: string) => {
                const newUser = new UserEntity();
                newUser.name = user.name,
                newUser.username = user.username,
                newUser.email = user.email,
                newUser.password = passwordHash,
                newUser.role = UserRole.USER;

                return from(this.userRepository.save(newUser)).pipe(
                    map((user: User) => { 
                        const {password, ...result} = user;
                        return result;
                    }),
                    catchError(err => throwError(() => new Error(err)))
                )
            })
        )
        //return from(this.userRepository.save(user));
    }

    findOne(id: number): Observable<User> {
        return from(this.userRepository.findOne({ where: { id } })).pipe(
            map((user: User) => { 
                const { password, ...result } = user;
                return result;
            })
        );
    }

    findAll(): Observable<User[]> {
        return from(this.userRepository.find()).pipe(
            map((users: User[]) => { 
                users.forEach(function (v) { delete v.password });
                return users;
            })
        );
    }

    paginate(options: IPaginationOptions): Observable<Pagination<User>> { 
        return from(paginate<User>(this.userRepository, options)).pipe(
            map((usersPageable: Pagination<User>) => {
                usersPageable.items.forEach(function (v) { delete v.password });

                return usersPageable;
            })
        )
    }

    deleteOne(id: number): Observable<any> { 
        return from(this.userRepository.delete(id));
    }

    updateOne(id: number, user: User): Observable<any> { 
        delete user.email;
        delete user.password;
        delete user.role;

        return from(this.userRepository.update(id, user)).pipe(
            switchMap(() => this.findOne(id))
        );
    }

    updateRoleOfUser(id: number, user: User):Observable<any>{
        return from(this.userRepository.update(id,user));
    }

    login(user: User): Observable<string> {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => { 
                if (user) { 
                    return this.authService.generateJWT(user).pipe(map((jwt: string) => jwt));
                } else { 
                    return 'Wrong Credentials';
                }
            })
        )
    }

    validateUser(email: string, password: string): Observable<User> {
        return this.findByEmail(email).pipe(
            switchMap((user: User) => this.authService.comparePasswords(password, user.password).pipe(
                map((match: boolean) => {
                    if (match) {
                        const { password, ...result } = user;
                        return result;
                    } else {
                        throw Error;
                    }
                })
            ))
        )
    }

    findByEmail(email:string):Observable<User>{
        return from(this.userRepository.findOne({ where: { email }}));
    }
}
