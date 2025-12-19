import { PartialType } from '@nestjs/mapped-types';
import { CreateProductBackgroundDto } from './create-product-background.dto';

export class UpdateProductBackgroundDto extends PartialType(CreateProductBackgroundDto) {}
