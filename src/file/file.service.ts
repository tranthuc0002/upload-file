import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IPaginationOptions, paginate, Pagination } from "nestjs-typeorm-paginate";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "src/auth/auth.service";
import { Repository } from "typeorm";
import { FileEntity } from "./models/file.entity";
import { File } from "./models/file.interface";


@Injectable()
export class FileService { 
    constructor(
        @InjectRepository(FileEntity) 
        private readonly fileRepository: Repository<FileEntity>,
        private authService: AuthService,
    ){}

    async getAll() { 
        return await this.fileRepository.find();
    }

    paginate(options: IPaginationOptions): Observable<Pagination<File>> { 
        return from(paginate<File>(this.fileRepository, options));
    }

    findById(id:number):Observable<File>{
        return from(this.fileRepository.findOne({ where: { id }}));
    }

    create(file: File): Observable<File> {        
        const newFile = new FileEntity();
        newFile.file_name = file.file_name;
        newFile.original_name = file.original_name;
        newFile.encoding = file.encoding;
        newFile.mimetype = file.mimetype;
        newFile.destination = file.destination;
        newFile.path = file.path;
        newFile.size = file.size;

        return from(this.fileRepository.save(newFile));
    }

    deleteOne(id: number): Observable<any> { 
        return from(this.fileRepository.delete(id));
    }
}