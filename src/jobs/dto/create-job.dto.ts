import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  ot: string;

  @IsString()
  @IsNotEmpty()
  client: string;

  @IsString()
  @IsNotEmpty()
  jobType: string;

  @IsNumber()
  @IsOptional()
  quantityPlanned?: number; // Renamed from quantity

  @IsString()
  @IsOptional()
  comments?: string;

  @IsBoolean()
  @IsOptional()
  pantone?: boolean;

  @IsBoolean()
  @IsOptional()
  barniz?: boolean;

  @IsBoolean()
  @IsOptional()
  is4x0?: boolean;

  @IsBoolean()
  @IsOptional()
  is4x4?: boolean;

  @IsEnum(['en cola', 'en curso', 'pausado', 'terminado', 'cancelado'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  press?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;
}
