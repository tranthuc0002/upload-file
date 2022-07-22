import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('files')
export class FileEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    file_name: string;

    @Column({nullable: true})
    original_name: string;

    @Column()
    encoding: string;

    @Column()
    mimetype: string;

    @Column()
    destination: string;

    @Column()
    path: string;

    @Column()
    size: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}