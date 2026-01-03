import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Industry } from '../../database/entities/industry.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductType } from '../../database/entities/product-type.entity';
import { ProductTheme } from '../../database/entities/product-theme.entity';
import { ProductBackground } from '../../database/entities/product-background.entity';
import { ProductPose } from '../../database/entities/product-pose.entity';
import { AiFace } from '../../database/entities/ai-face.entity';

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

    @InjectRepository(ProductPose)
    private readonly productPoseRepo: Repository<ProductPose>,

    @InjectRepository(AiFace)
    private readonly aiFaceRepo: Repository<AiFace>,
  ) {}

  /**
   * Fetch the full hierarchy of:
   * Industry → Categories → Product Types → Product Themes → Product Backgrounds
   * Also includes Product Poses and AI Faces
   */
  async getIndustriesTree() {
    // Fetch industries with all relations, excluding soft-deleted items
    const industries = await this.industryRepo
      .createQueryBuilder('industry')
      .leftJoinAndSelect('industry.categories', 'category', 'category.deleted_at IS NULL')
      .leftJoinAndSelect('category.productTypes', 'productType', 'productType.deleted_at IS NULL')
      .leftJoinAndSelect('productType.productThemes', 'productTheme', 'productTheme.deleted_at IS NULL')
      .leftJoinAndSelect('productTheme.productBackgrounds', 'productBackground', 'productBackground.deleted_at IS NULL')
      .leftJoinAndSelect('productType.productPoses', 'productPose', 'productPose.deleted_at IS NULL')
      .leftJoinAndSelect('productPose.productBackgrounds', 'poseBackground', 'poseBackground.deleted_at IS NULL')
      .where('industry.deleted_at IS NULL')
      .orderBy('industry.name', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .addOrderBy('productType.name', 'ASC')
      .addOrderBy('productTheme.name', 'ASC')
      .getMany();

    // Fetch all AI faces grouped by category
    const aiFaces = await this.aiFaceRepo
      .createQueryBuilder('aiFace')
      .leftJoinAndSelect('aiFace.category', 'category')
      .where('aiFace.deleted_at IS NULL')
      .andWhere('category.deleted_at IS NULL')
      .getMany();

    // Group AI faces by category
    const aiFacesByCategory = aiFaces.reduce((acc, face) => {
      if (!acc[face.categoryId]) {
        acc[face.categoryId] = { male: [], female: [] };
      }
      if (face.gender === 'male') {
        acc[face.categoryId].male.push({
          id: face.id,
          name: face.name,
          description: face.description,
          gender: face.gender,
          imageUrl: face.imageUrl || null,
          createdAt: face.createdAt,
          updatedAt: face.updatedAt,
        });
      } else {
        acc[face.categoryId].female.push({
          id: face.id,
          name: face.name,
          description: face.description,
          gender: face.gender,
          imageUrl: face.imageUrl || null,
          createdAt: face.createdAt,
          updatedAt: face.updatedAt,
        });
      }
      return acc;
    }, {} as Record<string, { male: any[]; female: any[] }>);

    // Build clean nested JSON for the public webapp with all fields
    return industries.map(industry => ({
      id: industry.id,
      name: industry.name,
      description: industry.description,
      createdAt: industry.createdAt,
      updatedAt: industry.updatedAt,
      categories: industry.categories
        ?.filter(cat => !cat.deletedAt)
        ?.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          imageUrl: cat.imageUrl || null,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          aiFaces: aiFacesByCategory[cat.id] || { male: [], female: [] },
          productTypes: cat.productTypes
            ?.filter(pt => !pt.deletedAt)
            ?.map(pt => ({
              id: pt.id,
              name: pt.name,
              description: pt.description,
              createdAt: pt.createdAt,
              updatedAt: pt.updatedAt,
              productThemes: pt.productThemes
                ?.filter(theme => !theme.deletedAt)
                ?.map(theme => ({
                  id: theme.id,
                  name: theme.name,
                  description: theme.description,
                  imageUrl: theme.imageUrl || null,
                  createdAt: theme.createdAt,
                  updatedAt: theme.updatedAt,
                  productBackgrounds: theme.productBackgrounds
                    ?.filter(pb => !pb.deletedAt)
                    ?.map(pb => ({
                      id: pb.id,
                      name: pb.name,
                      description: pb.description,
                      imageUrl: pb.imageUrl || null,
                      createdAt: pb.createdAt,
                      updatedAt: pb.updatedAt,
                    })),
                })),
              productPoses: pt.productPoses
                ?.filter(pose => !pose.deletedAt)
                ?.map(pose => ({
                  id: pose.id,
                  name: pose.name,
                  description: pose.description,
                  imageUrl: pose.imageUrl || null,
                  createdAt: pose.createdAt,
                  updatedAt: pose.updatedAt,
                  productBackgrounds: pose.productBackgrounds
                    ?.filter(pb => !pb.deletedAt)
                    ?.map(pb => ({
                      id: pb.id,
                      name: pb.name,
                      description: pb.description,
                      imageUrl: pb.imageUrl || null,
                      createdAt: pb.createdAt,
                      updatedAt: pb.updatedAt,
                    })),
                })),
            })),
        })),
    }));
  }

  /**
   * Get system data counts for dashboard
   * Returns counts of AI Faces, Backgrounds, Poses, Categories, Industries, and Themes
   * Excludes soft-deleted records
   */
  async getSystemData() {
    const [aiFaces, backgrounds, poses, categories, industries, themes] = await Promise.all([
      this.aiFaceRepo.count({ where: { deletedAt: null } }),
      this.productBackgroundRepo.count({ where: { deletedAt: null } }),
      this.productPoseRepo.count({ where: { deletedAt: null } }),
      this.categoryRepo.count({ where: { deletedAt: null } }),
      this.industryRepo.count({ where: { deletedAt: null } }),
      this.productThemeRepo.count({ where: { deletedAt: null } }),
    ]);

    return {
      aiFaces,
      backgrounds,
      poses,
      categories,
      industries,
      themes,
    };
  }
}
