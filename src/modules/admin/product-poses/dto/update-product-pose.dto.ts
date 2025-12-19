import { PartialType } from '@nestjs/mapped-types';
import { CreateProductPoseDto } from './create-product-pose.dto';

export class UpdateProductPoseDto extends PartialType(CreateProductPoseDto) {}
