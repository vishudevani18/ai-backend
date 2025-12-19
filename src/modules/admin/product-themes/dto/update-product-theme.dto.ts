import { PartialType } from '@nestjs/mapped-types';
import { CreateProductThemeDto } from './create-product-theme.dto';

export class UpdateProductThemeDto extends PartialType(CreateProductThemeDto) {}
