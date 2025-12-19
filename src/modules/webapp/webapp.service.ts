import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Industry } from '../../database/entities/industry.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductType } from '../../database/entities/product-type.entity';
import { ProductTheme } from '../../database/entities/product-theme.entity';
import { ProductBackground } from '../../database/entities/product-background.entity';

@Injectable()
export class WebAppService {
  constructor(
    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,

    @InjectRepository(ProductTheme)
    private readonly productThemeRepo: Repository<ProductTheme>,

    @InjectRepository(ProductBackground)
    private readonly productBackgroundRepo: Repository<ProductBackground>,
  ) {}

  /**
   * Fetch the full hierarchy of:
   * Industry → Categories → Product Types → Product Themes → Product Backgrounds
   */
  async getIndustriesTree() {
    const industries = await this.industryRepo.find({
      relations: [
        'categories',
        'categories.productTypes',
        'categories.productTypes.productThemes',
        'categories.productTypes.productThemes.productBackgrounds',
      ],
      order: {
        name: 'ASC',
        categories: { name: 'ASC' },
      },
    });

    // Build clean nested JSON for the public webapp
    return industries.map(industry => ({
      id: industry.id,
      name: industry.name,
      description: industry.description,
      categories: industry.categories?.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        productTypes: cat.productTypes?.map(pt => ({
          id: pt.id,
          name: pt.name,
          description: pt.description,
          productThemes: pt.productThemes?.map(theme => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            productBackgrounds: theme.productBackgrounds?.map(pb => ({
              id: pb.id,
              name: pb.name,
              description: pb.description,
              imageUrl: pb.imageUrl || pb.imageBase64 || null,
            })),
          })),
        })),
      })),
    }));
  }
}
