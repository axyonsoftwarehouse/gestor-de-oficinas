import 'reflect-metadata';
import { QuestionType, SectionDisplayType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString()
  @MaxLength(200)
  label!: string;

  @IsString()
  @MaxLength(200)
  value!: string;

  @IsOptional()
  @IsInt()
  sequence?: number;
}

export class CreateQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @IsString()
  @MaxLength(300)
  label!: string;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsBoolean()
  visibleToCustomer?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

export class CreateSectionDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsEnum(SectionDisplayType)
  displayType?: SectionDisplayType;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class CreateInspectionTemplateDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections!: CreateSectionDto[];
}
