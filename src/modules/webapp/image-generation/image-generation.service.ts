import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors/business.error';
import { HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Industry } from '../../../database/entities/industry.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { AiFace } from '../../../database/entities/ai-face.entity';
import {
  GeneratedImage,
  GenerationStatus,
  GenerationType,
} from '../../../database/entities/generated-image.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { GeminiImageService } from './services/gemini-image.service';
import { ImagenImageService } from './services/imagen-image.service';
import { ImageCleanupService } from './services/image-cleanup.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GenerateBulkImageDto } from './dto/generate-bulk-image.dto';
import { CreditsService } from '../../credits/credits.service';
import { CreditOperationType } from '../../../database/entities/credit-transaction.entity';
import {
  ERROR_MESSAGES,
  DEFAULT_PROMPT_TEMPLATE,
  IMAGEN_DEFAULT_PROMPT_TEMPLATE,
  KURTI_BOTTOM_WEAR_PROMPT,
  isSingleKurtiProduct,
} from '../../../common/constants/image-generation.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,
    @InjectRepository(ProductPose)
    private readonly productPoseRepo: Repository<ProductPose>,
    @InjectRepository(ProductTheme)
    private readonly productThemeRepo: Repository<ProductTheme>,
    @InjectRepository(ProductBackground)
    private readonly productBackgroundRepo: Repository<ProductBackground>,
    @InjectRepository(AiFace)
    private readonly aiFaceRepo: Repository<AiFace>,
    @InjectRepository(GeneratedImage)
    private readonly generatedImageRepo: Repository<GeneratedImage>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly geminiImageService: GeminiImageService,
    private readonly imagenImageService: ImagenImageService,
    private readonly imageCleanupService: ImageCleanupService,
    private readonly configService: ConfigService,
    private readonly creditsService: CreditsService,
  ) {}

  /**
   * Main method to generate an image
   */
  async generateImage(
    dto: GenerateImageDto,
    userId: string,
  ): Promise<{ imageUrl: string; expiresAt: Date }> {
    const startTime = Date.now();
    let generatedImageRecord: GeneratedImage | null = null;

    try {
      // Step 0: Check if user has enough credits BEFORE starting generation
      const imageGenerationCost =
        this.configService.get<number>('app.credits.costs.imageGeneration') || 5;
      const currentBalance = await this.creditsService.checkBalance(userId);

      if (currentBalance < imageGenerationCost) {
        throw new BusinessError(
          ErrorCode.INSUFFICIENT_CREDITS,
          `Insufficient credits. Required: ${imageGenerationCost}, Available: ${currentBalance}. Please purchase more credits to generate images.`,
          HttpStatus.PAYMENT_REQUIRED,
          {
            userId,
            required: imageGenerationCost,
            available: currentBalance,
            operation: 'image_generation',
          },
        );
      }

      // Step 1: Validate all IDs exist and are not soft-deleted
      const productType = await this.validateRequest(dto);

      // Step 2: Fetch reference images from GCS and validate they exist
      const referenceImages = await this.fetchReferenceImages(dto);

      // Step 3: Build prompt with pose description from database (falls back to static constant if not available)
      const finalPrompt = this.buildPromptWithPose(referenceImages.poseDescription, productType);

      // Step 4: Prepare images for Gemini (face, background, product)
      // Note: Pose is text-based from database description for consistency
      // We still fetch pose image for API validation, but don't send it to Gemini
      const geminiImages = [
        { data: referenceImages.aiFace, mimeType: 'image/png' }, // Reference [1] = Face (PNG transparent)
        { data: referenceImages.productBackground, mimeType: 'image/jpeg' }, // Reference [2] = Background
        {
          data: dto.productImage.split(',')[1] || dto.productImage,
          mimeType: dto.productImageMimeType,
        }, // Reference [3] = Product/Cloth
      ];

      // Step 5: Generate composite image using Gemini with built prompt
      const generatedImageBuffer = await this.geminiImageService.generateCompositeImage(
        geminiImages,
        finalPrompt,
      );

      // Step 6: Store generated image in GCS
      const { imageUrl, imagePath } = await this.storeGeneratedImage(generatedImageBuffer);

      // Step 7: Calculate expiresAt
      const retentionHours =
        this.configService.get<number>('app.gemini.imageGeneration.imageRetentionHours') || 6;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + retentionHours);

      // Step 8: Log generation to database (success)
      const generationTimeMs = Date.now() - startTime;
      generatedImageRecord = await this.logGeneration({
        ...dto,
        imageUrl,
        imagePath,
        generationStatus: GenerationStatus.SUCCESS,
        generationTimeMs,
        expiresAt,
        generationType: GenerationType.SINGLE,
        userId,
      });

      // Step 9: Deduct credits after successful generation
      // Note: imageGenerationCost is already calculated in Step 0
      await this.creditsService.deductCreditsOrFail(
        userId,
        imageGenerationCost,
        CreditOperationType.IMAGE_GENERATION,
        `Single image generation: ${generatedImageRecord.id}`,
        generatedImageRecord.id,
      );

      // Step 10: Schedule GCS deletion (database entry remains)
      await this.imageCleanupService.scheduleDeletion(imagePath, generatedImageRecord.id);

      this.logger.log(`Image generation completed successfully in ${generationTimeMs}ms`);

      return { imageUrl, expiresAt };
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed generation to database
      await this.logGeneration({
        ...dto,
        imageUrl: null,
        imagePath: null,
        generationStatus: GenerationStatus.FAILED,
        errorMessage,
        generationTimeMs,
        expiresAt: null,
        generationType: GenerationType.SINGLE,
        userId,
      });

      this.logger.error(
        `Image generation failed after ${generationTimeMs}ms: ${errorMessage}`,
        error,
      );

      // Re-throw the error
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${errorMessage}`);
    }
  }

  /**
   * Validate all IDs exist in database and are not soft-deleted
   * @returns The validated ProductType entity
   */
  private async validateRequest(dto: GenerateImageDto): Promise<ProductType> {
    const [industry, category, productType, productPose, productTheme, productBackground, aiFace] =
      await Promise.all([
        this.industryRepo.findOne({ where: { id: dto.industryId } }),
        this.categoryRepo.findOne({ where: { id: dto.categoryId } }),
        this.productTypeRepo.findOne({ where: { id: dto.productTypeId } }),
        this.productPoseRepo.findOne({ where: { id: dto.productPoseId } }),
        this.productThemeRepo.findOne({ where: { id: dto.productThemeId } }),
        this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
        this.aiFaceRepo.findOne({ where: { id: dto.aiFaceId } }),
      ]);

    if (!industry) throw new NotFoundException(ERROR_MESSAGES.MISSING_INDUSTRY);
    if (!category) throw new NotFoundException(ERROR_MESSAGES.MISSING_CATEGORY);
    if (!productType) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_TYPE);
    if (!productPose) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_POSE);
    if (!productTheme) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_THEME);
    if (!productBackground) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_BACKGROUND);
    if (!aiFace) throw new NotFoundException(ERROR_MESSAGES.MISSING_AI_FACE);

    return productType;
  }

  /**
   * Fetch reference images from GCS and validate they exist
   * Also fetches pose description from database (falls back to static constant if not available)
   */
  private async fetchReferenceImages(dto: GenerateImageDto): Promise<{
    aiFace: string;
    productPose: string;
    productBackground: string;
    poseDescription: string;
  }> {
    // Fetch entities to get image URLs/paths and pose description
    const [productPose, productBackground, aiFace] = await Promise.all([
      this.productPoseRepo.findOne({ where: { id: dto.productPoseId } }),
      this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
      this.aiFaceRepo.findOne({ where: { id: dto.aiFaceId } }),
    ]);

    if (!productPose?.imageUrl && !productPose?.imagePath) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: Product pose image not available`,
      );
    }
    if (!productBackground?.imageUrl && !productBackground?.imagePath) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: Product background image not available`,
      );
    }
    if (!aiFace?.imageUrl && !aiFace?.imagePath) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: AI face image not available`,
      );
    }
    // Download images from GCS and convert to base64
    const [poseBuffer, backgroundBuffer, faceBuffer] = await Promise.all([
      this.gcsStorageService.downloadFile(productPose.imagePath || productPose.imageUrl),
      this.gcsStorageService.downloadFile(
        productBackground.imagePath || productBackground.imageUrl,
      ),
      this.gcsStorageService.downloadFile(aiFace.imagePath || aiFace.imageUrl),
    ]);

    // Use pose description from database if available, otherwise use pose name
    const poseDescription = productPose?.description?.trim() || productPose?.name || '';

    return {
      aiFace: faceBuffer.toString('base64'),
      productPose: poseBuffer.toString('base64'),
      productBackground: backgroundBuffer.toString('base64'),
      poseDescription,
    };
  }

  /**
   * Build prompt by replacing pose description placeholder and conditionally adding kurti bottom wear section
   */
  private buildPromptWithPose(poseDescription: string, productType?: ProductType): string {
    let prompt = DEFAULT_PROMPT_TEMPLATE.replace('{{POSE_DESCRIPTION}}', poseDescription);

    // Conditionally add kurti bottom wear section for single kurti products only
    if (productType && isSingleKurtiProduct(productType.name)) {
      prompt += '\n\n' + KURTI_BOTTOM_WEAR_PROMPT;
    }

    return prompt;
  }

  /**
   * Store generated image in GCS with public access
   */
  private async storeGeneratedImage(
    buffer: Buffer,
  ): Promise<{ imageUrl: string; imagePath: string }> {
    try {
      const timestamp = Date.now();
      const uuid = uuidv4();
      const imagePath = `generated-images/${timestamp}-${uuid}/image.jpg`;

      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        buffer,
        imagePath,
        'image/jpeg',
      );

      return { imageUrl, imagePath };
    } catch (error) {
      this.logger.error('Failed to store generated image', error);
      throw new BadRequestException(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }

  /**
   * Bulk generation method to generate multiple images based on multiple pose IDs
   */
  async generateBulkImage(
    dto: GenerateBulkImageDto,
    userId?: string,
  ): Promise<Array<{ imageUrl: string; poseId: string; expiresAt: Date }>> {
    const startTime = Date.now();
    const { productPoseIds } = dto;

    // Validate unique pose IDs
    const uniquePoseIds = [...new Set(productPoseIds)];
    if (uniquePoseIds.length !== productPoseIds.length) {
      throw new BadRequestException('Duplicate pose IDs are not allowed');
    }

    try {
      // Step 0: Check if user has enough credits BEFORE starting generation
      if (!userId) {
        throw new BadRequestException('User ID is required for bulk image generation');
      }

      const bulkGenerationCostPerImage =
        this.configService.get<number>('app.credits.costs.bulkGenerationPerImage') || 5;
      const totalImages = productPoseIds.length;
      const totalCreditsRequired = totalImages * bulkGenerationCostPerImage;

      const currentBalance = await this.creditsService.checkBalance(userId);

      if (currentBalance < totalCreditsRequired) {
        throw new BusinessError(
          ErrorCode.INSUFFICIENT_CREDITS,
          `Insufficient credits. Required: ${totalCreditsRequired} (${totalImages} images × ${bulkGenerationCostPerImage} credits each), Available: ${currentBalance}. Please purchase more credits to generate images.`,
          HttpStatus.PAYMENT_REQUIRED,
          {
            userId,
            required: totalCreditsRequired,
            available: currentBalance,
            operation: 'bulk_generation',
            imageCount: totalImages,
            costPerImage: bulkGenerationCostPerImage,
          },
        );
      }

      // Step 1: Validate all shared IDs exist (industry, category, productType, theme, background, aiFace)
      const productType = await this.validateBulkRequest(dto);

      // Step 2: Validate all pose IDs exist
      await this.validatePoseIds(productPoseIds);

      // Step 3: Fetch shared reference images once (face, background, product)
      const sharedReferences = await this.fetchSharedReferences(dto);

      // Step 4: Fetch all pose descriptions in parallel
      const poseDescriptions = await this.fetchPoseDescriptions(productPoseIds);

      // Step 5: Prepare shared images for Gemini (face, background, product)
      const geminiImages = [
        { data: sharedReferences.aiFace, mimeType: 'image/png' }, // Reference [1] = Face (PNG transparent)
        { data: sharedReferences.productBackground, mimeType: 'image/jpeg' }, // Reference [2] = Background
        {
          data: dto.productImage.split(',')[1] || dto.productImage,
          mimeType: dto.productImageMimeType,
        }, // Reference [3] = Product/Cloth
      ];

      // Step 6: Generate all images in parallel
      const generationPromises = productPoseIds.map(async poseId => {
        const poseStartTime = Date.now();
        try {
          const poseDescription = poseDescriptions[poseId] || '';
          const finalPrompt = this.buildPromptWithPose(poseDescription, productType);

          // Generate image
          const generatedImageBuffer = await this.geminiImageService.generateCompositeImage(
            geminiImages,
            finalPrompt,
          );

          // Store image in GCS
          const { imageUrl, imagePath } = await this.storeGeneratedImage(generatedImageBuffer);

          // Calculate expiresAt
          const retentionHours =
            this.configService.get<number>('app.gemini.imageGeneration.imageRetentionHours') || 6;
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + retentionHours);

          // Log generation to database
          const generationTimeMs = Date.now() - poseStartTime;
          const generatedImageRecord = await this.logGeneration({
            industryId: dto.industryId,
            categoryId: dto.categoryId,
            productTypeId: dto.productTypeId,
            productPoseId: poseId,
            productThemeId: dto.productThemeId,
            productBackgroundId: dto.productBackgroundId,
            aiFaceId: dto.aiFaceId,
            imageUrl,
            imagePath,
            generationStatus: GenerationStatus.SUCCESS,
            generationTimeMs,
            expiresAt,
            generationType: GenerationType.BULK,
            userId,
          });

          // Schedule GCS deletion
          await this.imageCleanupService.scheduleDeletion(imagePath, generatedImageRecord.id);

          return { imageUrl, poseId, expiresAt, success: true };
        } catch (error) {
          const generationTimeMs = Date.now() - poseStartTime;
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Log failed generation to database
          await this.logGeneration({
            industryId: dto.industryId,
            categoryId: dto.categoryId,
            productTypeId: dto.productTypeId,
            productPoseId: poseId,
            productThemeId: dto.productThemeId,
            productBackgroundId: dto.productBackgroundId,
            aiFaceId: dto.aiFaceId,
            imageUrl: null,
            imagePath: null,
            generationStatus: GenerationStatus.FAILED,
            errorMessage,
            generationTimeMs,
            expiresAt: null,
            generationType: GenerationType.BULK,
            userId,
          });

          this.logger.error(
            `Bulk generation failed for pose ${poseId} after ${generationTimeMs}ms: ${errorMessage}`,
            error,
          );
          return { imageUrl: null, poseId, expiresAt: null, success: false, error: errorMessage };
        }
      });

      const results = await Promise.all(generationPromises);

      // Filter out failed generations and return only successful ones
      const successfulResults = results.filter(r => r.success && r.imageUrl) as Array<{
        imageUrl: string;
        poseId: string;
        expiresAt: Date;
      }>;

      // Deduct credits only for successful images
      if (successfulResults.length > 0 && userId) {
        const bulkGenerationCostPerImage =
          this.configService.get<number>('app.credits.costs.bulkGenerationPerImage') || 5;
        const totalCreditsToDeduct = successfulResults.length * bulkGenerationCostPerImage;

        await this.creditsService.deductCreditsOrFail(
          userId,
          totalCreditsToDeduct,
          CreditOperationType.BULK_GENERATION,
          `Bulk image generation: ${successfulResults.length} image(s) generated successfully`,
        );
      }

      const totalTimeMs = Date.now() - startTime;
      this.logger.log(
        `Bulk image generation completed: ${successfulResults.length}/${productPoseIds.length} successful in ${totalTimeMs}ms`,
      );

      if (successfulResults.length === 0) {
        throw new BadRequestException(
          'All image generations failed. Please check your inputs and try again.',
        );
      }

      return successfulResults;
    } catch (error) {
      const totalTimeMs = Date.now() - startTime;
      this.logger.error(`Bulk image generation failed after ${totalTimeMs}ms: ${error}`, error);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `${ERROR_MESSAGES.GEMINI_API_ERROR}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate shared IDs for bulk generation (industry, category, productType, theme, background, aiFace)
   * @returns The validated ProductType entity
   */
  private async validateBulkRequest(dto: GenerateBulkImageDto): Promise<ProductType> {
    const [industry, category, productType, productTheme, productBackground, aiFace] =
      await Promise.all([
        this.industryRepo.findOne({ where: { id: dto.industryId } }),
        this.categoryRepo.findOne({ where: { id: dto.categoryId } }),
        this.productTypeRepo.findOne({ where: { id: dto.productTypeId } }),
        this.productThemeRepo.findOne({ where: { id: dto.productThemeId } }),
        this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
        this.aiFaceRepo.findOne({ where: { id: dto.aiFaceId } }),
      ]);

    if (!industry) throw new NotFoundException(ERROR_MESSAGES.MISSING_INDUSTRY);
    if (!category) throw new NotFoundException(ERROR_MESSAGES.MISSING_CATEGORY);
    if (!productType) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_TYPE);
    if (!productTheme) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_THEME);
    if (!productBackground) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_BACKGROUND);
    if (!aiFace) throw new NotFoundException(ERROR_MESSAGES.MISSING_AI_FACE);

    return productType;
  }

  /**
   * Validate all pose IDs exist
   */
  private async validatePoseIds(poseIds: string[]): Promise<void> {
    const poses = await Promise.all(
      poseIds.map(id => this.productPoseRepo.findOne({ where: { id } })),
    );

    const missingPoses = poses
      .map((pose, index) => (!pose ? poseIds[index] : null))
      .filter((id): id is string => id !== null);

    if (missingPoses.length > 0) {
      throw new NotFoundException(`Product poses not found: ${missingPoses.join(', ')}`);
    }
  }

  /**
   * Fetch shared reference images (face, background) - used for all poses
   */
  private async fetchSharedReferences(dto: GenerateBulkImageDto): Promise<{
    aiFace: string;
    productBackground: string;
  }> {
    const [productBackground, aiFace] = await Promise.all([
      this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
      this.aiFaceRepo.findOne({ where: { id: dto.aiFaceId } }),
    ]);

    if (!productBackground?.imageUrl && !productBackground?.imagePath) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: Product background image not available`,
      );
    }
    if (!aiFace?.imageUrl && !aiFace?.imagePath) {
      throw new NotFoundException(
        `${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: AI face image not available`,
      );
    }

    // Download images from GCS and convert to base64
    const [backgroundBuffer, faceBuffer] = await Promise.all([
      this.gcsStorageService.downloadFile(
        productBackground.imagePath || productBackground.imageUrl,
      ),
      this.gcsStorageService.downloadFile(aiFace.imagePath || aiFace.imageUrl),
    ]);

    return {
      aiFace: faceBuffer.toString('base64'),
      productBackground: backgroundBuffer.toString('base64'),
    };
  }

  /**
   * Fetch pose descriptions for all pose IDs in parallel
   */
  private async fetchPoseDescriptions(poseIds: string[]): Promise<Record<string, string>> {
    const poses = await Promise.all(
      poseIds.map(id => this.productPoseRepo.findOne({ where: { id } })),
    );

    const descriptions: Record<string, string> = {};
    poses.forEach((pose, index) => {
      if (pose) {
        descriptions[poseIds[index]] = pose.description?.trim() || pose.name || '';
      }
    });

    return descriptions;
  }

  /**
   * Log generation to database (success or failed)
   * This record is NEVER deleted - preserved for analytics
   */
  private async logGeneration(data: {
    industryId: string;
    categoryId: string;
    productTypeId: string;
    productPoseId: string;
    productThemeId: string;
    productBackgroundId: string;
    aiFaceId: string;
    imageUrl: string | null;
    imagePath: string | null;
    generationStatus: GenerationStatus;
    errorMessage?: string;
    generationTimeMs: number;
    expiresAt: Date | null;
    generationType: GenerationType;
    userId?: string;
  }): Promise<GeneratedImage> {
    const record = this.generatedImageRepo.create({
      userId: data.userId,
      industryId: data.industryId,
      categoryId: data.categoryId,
      productTypeId: data.productTypeId,
      productPoseId: data.productPoseId,
      productThemeId: data.productThemeId,
      productBackgroundId: data.productBackgroundId,
      aiFaceId: data.aiFaceId,
      imageUrl: data.imageUrl,
      imagePath: data.imagePath,
      generationStatus: data.generationStatus,
      errorMessage: data.errorMessage,
      generationTimeMs: data.generationTimeMs,
      expiresAt: data.expiresAt,
      generationType: data.generationType,
    });

    return await this.generatedImageRepo.save(record);
  }

  /**
   * Generate an image using Imagen
   * Uses the same flow as generateImage but with Imagen model instead of Gemini
   * Uses DEFAULT_PROMPT_TEMPLATE only (no kurti-specific additions)
   */
  async generateImageWithImagen(
    dto: GenerateImageDto,
    userId: string,
  ): Promise<{ imageUrl: string; expiresAt: Date }> {
    const startTime = Date.now();
    let generatedImageRecord: GeneratedImage | null = null;

    try {
      // Step 0: Check if user has enough credits BEFORE starting generation
      const imageGenerationCost =
        this.configService.get<number>('app.credits.costs.imageGeneration') || 5;
      const currentBalance = await this.creditsService.checkBalance(userId);

      if (currentBalance < imageGenerationCost) {
        throw new BusinessError(
          ErrorCode.INSUFFICIENT_CREDITS,
          `Insufficient credits. Required: ${imageGenerationCost}, Available: ${currentBalance}. Please purchase more credits to generate images.`,
          HttpStatus.PAYMENT_REQUIRED,
          {
            userId,
            required: imageGenerationCost,
            available: currentBalance,
            operation: 'image_generation',
          },
        );
      }

      // Step 1: Validate all IDs exist and are not soft-deleted
      await this.validateRequest(dto);

      // Step 2: Fetch reference images from GCS and validate they exist
      const referenceImages = await this.fetchReferenceImages(dto);

      // Step 3: Build prompt using IMAGEN_DEFAULT_PROMPT_TEMPLATE (optimized for Imagen 3.0 Capability)
      const finalPrompt = IMAGEN_DEFAULT_PROMPT_TEMPLATE.replace(
        '{{POSE_DESCRIPTION}}',
        referenceImages.poseDescription || 'elegantly',
      );

      // Step 4: Prepare images for Imagen (face, background, product)
      const faceImageBase64 = referenceImages.aiFace;
      const backgroundImageBase64 = referenceImages.productBackground;
      const productImageBase64 = dto.productImage.split(',')[1] || dto.productImage;

      // Step 5: Generate composite image using Imagen 3.0 with reference images
      const generatedImageBuffer = await this.imagenImageService.generateWithReferences(
        faceImageBase64,
        backgroundImageBase64,
        productImageBase64,
        finalPrompt,
      );

      // Step 6: Store generated image in GCS
      const { imageUrl, imagePath } = await this.storeGeneratedImage(generatedImageBuffer);

      // Step 7: Calculate expiresAt
      const retentionHours =
        this.configService.get<number>('app.gemini.imageGeneration.imageRetentionHours') || 6;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + retentionHours);

      // Step 8: Log generation to database (success)
      const generationTimeMs = Date.now() - startTime;
      generatedImageRecord = await this.logGeneration({
        ...dto,
        imageUrl,
        imagePath,
        generationStatus: GenerationStatus.SUCCESS,
        generationTimeMs,
        expiresAt,
        generationType: GenerationType.SINGLE,
        userId,
      });

      // Step 9: Deduct credits after successful generation
      await this.creditsService.deductCreditsOrFail(
        userId,
        imageGenerationCost,
        CreditOperationType.IMAGE_GENERATION,
        `Single image generation (Imagen 3.0): ${generatedImageRecord.id}`,
        generatedImageRecord.id,
      );

      // Step 10: Schedule GCS deletion (database entry remains)
      await this.imageCleanupService.scheduleDeletion(imagePath, generatedImageRecord.id);

      this.logger.log(`Image generation (Imagen) completed successfully in ${generationTimeMs}ms`);

      return { imageUrl, expiresAt };
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed generation to database
      await this.logGeneration({
        ...dto,
        imageUrl: null,
        imagePath: null,
        generationStatus: GenerationStatus.FAILED,
        errorMessage,
        generationTimeMs,
        expiresAt: null,
        generationType: GenerationType.SINGLE,
        userId,
      });

      this.logger.error(
        `Image generation (Imagen) failed after ${generationTimeMs}ms: ${errorMessage}`,
        error,
      );

      // Re-throw the error
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${errorMessage}`);
    }
  }
}
