import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI } from '@google-cloud/vertexai';
import axios from 'axios';
import { ERROR_MESSAGES } from '../../../../common/constants/image-generation.constants';

@Injectable()
export class ImagenImageService {
  private readonly logger = new Logger(ImagenImageService.name);
  private readonly vertexAI: VertexAI;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelName: string = 'imagen-3.0-capability-001';
  private readonly endpointUrl: string;

  constructor(private configService: ConfigService) {
    this.projectId =
      this.configService.get<string>('app.google.projectId') || process.env.GCP_PROJECT_ID || '';
    this.location =
      this.configService.get<string>('app.gemini.imageGeneration.location') || 'us-central1';

    if (!this.projectId) {
      this.logger.error('GCP Project ID is missing! Ensure GCP_PROJECT_ID is in your .env');
    }

    // Initialize the Unified Vertex AI SDK for authentication only
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    // Construct the direct REST API endpoint URL
    // Format: https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/publishers/google/models/{MODEL_ID}:predict
    this.endpointUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelName}:predict`;
  }

  /**
   * Generate an image from a simple text prompt using Imagen via direct REST API
   * Using direct REST API calls to bypass SDK overhead and potential rate limit issues
   * @param prompt Text prompt describing the image to generate
   * @returns Generated image as Buffer
   */
  async generateImage(prompt: string): Promise<Buffer> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Requesting image from Imagen via REST API with prompt: ${prompt.substring(0, 100)}...`,
      );

      // Get access token for authentication
      const authClient = await this.vertexAI['googleAuth'].getClient();
      const accessToken = await authClient.getAccessToken();

      if (!accessToken) {
        throw new Error('Failed to get access token for Vertex AI');
      }

      // Prepare the request body for Imagen REST API
      // Imagen expects instances array with prompt and parameters
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '3:4',
          personGeneration: 'allow_adult',
        },
      };

      // Make direct REST API call using axios (bypassing SDK)
      let response;
      try {
        response = await axios.post(this.endpointUrl, requestBody, {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        // Capture the ACTUAL error reason from Google
        if (err.response) {
          this.logger.error(`GCP Error Details: ${JSON.stringify(err.response.data, null, 2)}`);
          this.logger.error(`GCP Error Status: ${err.response.status}`);

          // Extract the actual error message from GCP response
          const errorMessage =
            err.response.data?.error?.message ||
            err.response.data?.error ||
            err.response.data?.message ||
            JSON.stringify(err.response.data);

          throw new Error(`GCP API Error: ${errorMessage}`);
        }
        throw err;
      }

      // Extract the generated image from the response
      // REST API response structure can vary, so we check multiple possible locations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prediction: any = response.data?.predictions?.[0];
      if (!prediction) {
        this.logger.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No prediction returned from Imagen');
      }

      // REST API usually returns bytesBase64Encoded directly or inside a struct
      const imageBase64 =
        prediction?.bytesBase64Encoded ||
        prediction?.image?.bytesBase64Encoded ||
        prediction?.structValue?.fields?.bytesBase64Encoded?.stringValue ||
        prediction?.structValue?.fields?.image?.bytesBase64Encoded?.stringValue;

      if (!imageBase64) {
        this.logger.error('Unexpected response structure:', JSON.stringify(prediction, null, 2));
        throw new Error('Model did not return image data. Check response structure.');
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      this.logger.log(`Success! Generated in ${Date.now() - startTime}ms`);

      return imageBuffer;
    } catch (error) {
      this.logger.error(`Imagen Generation Failed: ${error.message}`, error.stack);
      this.logger.debug(
        `Error details - Status: ${error?.status}, Code: ${error?.code}, Message: ${error?.message}`,
      );

      // Handle rate limit errors - check multiple variations
      const errorMessageLower = (error?.message || '').toLowerCase();
      if (
        error?.status === 429 ||
        error?.code === 429 ||
        error?.code === 'RESOURCE_EXHAUSTED' ||
        errorMessageLower.includes('429') ||
        errorMessageLower.includes('rate limit') ||
        errorMessageLower.includes('quota exceeded') ||
        errorMessageLower.includes('resource exhausted')
      ) {
        this.logger.warn(
          `Rate limit detected for Imagen API. Status: ${error?.status}, Code: ${error?.code}, Message: ${error?.message}`,
        );
        throw new BadRequestException(ERROR_MESSAGES.GEMINI_RATE_LIMIT);
      }

      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
        const errorMessage = error.message.includes('aiplatform.endpoints.predict')
          ? 'Vertex AI permission denied. The service account needs the "Vertex AI User" role (roles/aiplatform.user) or "AI Platform Developer" role (roles/ml.developer). Please grant this permission in GCP IAM.'
          : error.message;
        throw new BadRequestException(errorMessage);
      }

      // Handle model not found errors
      if (
        error?.status === 404 ||
        error?.message?.includes('404') ||
        error?.message?.includes('not found') ||
        error?.message?.includes('NOT_FOUND')
      ) {
        throw new BadRequestException(
          `Imagen model not found in ${this.location}. Please verify: 1) Model imagen-3.0-capability-001 is available in your GCP project, 2) Billing is enabled. Error: ${error.message}`,
        );
      }

      // Handle other API errors
      if (error?.message) {
        throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${error.message}`);
      }

      throw new BadRequestException(ERROR_MESSAGES.GEMINI_API_ERROR);
    }
  }

  /**
   * Generate a composite image using Imagen 3.0 Capability with reference images
   * First tries imagen-3.0-capability-001, falls back to imagen-3.0-generate-001 if capability model is not available
   * @param faceImageBase64 Base64 encoded face image (Reference [1] for face consistency)
   * @param backgroundImageBase64 Base64 encoded background image (Reference [2] for background control)
   * @param productImageBase64 Base64 encoded product image (Reference [3] for product/clothing)
   * @param prompt Prompt with pose description and product details
   * @returns Generated image as Buffer
   */
  async generateWithReferences(
    faceImageBase64: string,
    backgroundImageBase64: string,
    productImageBase64: string,
    prompt: string,
  ): Promise<Buffer> {
    const startTime = Date.now();

    try {
      // Clean base64 strings (remove data URI prefix if present)
      const cleanFaceImage = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const cleanBackgroundImage = backgroundImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const cleanProductImage = productImageBase64.replace(/^data:image\/\w+;base64,/, '');

      this.logger.log(
        `Requesting image from Imagen 3.0 Capability via REST API with 3 reference images (face, background, product)...`,
      );

      // Get access token for authentication
      const authClient = await this.vertexAI['googleAuth'].getClient();
      const accessToken = await authClient.getAccessToken();

      if (!accessToken) {
        throw new Error('Failed to get access token for Vertex AI');
      }

      // Prepare the request body for Imagen 3.0 Capability API
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '3:4',
          personGeneration: 'allow_adult',
          enhancePrompt: false,
          referenceImages: [
            {
              referenceId: 1,
              referenceType: 'REFERENCE_TYPE_SUBJECT',
              subjectType: 'SUBJECT_TYPE_PERSON',
              referenceImage: { bytesBase64Encoded: cleanFaceImage },
            },
            {
              referenceId: 2,
              referenceType: 'REFERENCE_TYPE_CONTROL',
              controlType: 'CONTROL_TYPE_CANNY',
              referenceImage: { bytesBase64Encoded: cleanBackgroundImage },
            },
            {
              referenceId: 3,
              referenceType: 'REFERENCE_TYPE_SUBJECT',
              subjectType: 'SUBJECT_TYPE_PRODUCT',
              referenceImage: { bytesBase64Encoded: cleanProductImage },
            },
          ],
        },
      };

      // Make direct REST API call using axios
      let response;
      try {
        response = await axios.post(this.endpointUrl, requestBody, {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        });
      } catch (err) {
        // Capture the ACTUAL error reason from Google
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any).response) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorResponse = (err as any).response;
          this.logger.error(`GCP Error Details: ${JSON.stringify(errorResponse.data, null, 2)}`);
          this.logger.error(`GCP Error Status: ${errorResponse.status}`);

          // Extract the actual error message from GCP response
          const errorMessage =
            errorResponse.data?.error?.message ||
            errorResponse.data?.error ||
            errorResponse.data?.message ||
            JSON.stringify(errorResponse.data);

          throw new Error(`GCP API Error: ${errorMessage}`);
        }
        throw err;
      }

      // Check for errors in successful response
      if (response.data?.error) {
        throw new Error(
          `Imagen API returned error: ${response.data.error.message || JSON.stringify(response.data.error)}`,
        );
      }

      // Extract the generated image from the response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prediction: any = response.data?.predictions?.[0];
      if (!prediction) {
        this.logger.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No prediction returned from Imagen 3.0 Capability');
      }

      // REST API usually returns bytesBase64Encoded directly or inside a struct
      const imageBase64 =
        prediction?.bytesBase64Encoded ||
        prediction?.image?.bytesBase64Encoded ||
        prediction?.structValue?.fields?.bytesBase64Encoded?.stringValue ||
        prediction?.structValue?.fields?.image?.bytesBase64Encoded?.stringValue;

      if (!imageBase64) {
        this.logger.error('Unexpected response structure:', JSON.stringify(prediction, null, 2));
        throw new Error('Model did not return image data. Check response structure.');
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      this.logger.log(`Success! Generated in ${Date.now() - startTime}ms`);

      return imageBuffer;
    } catch (error) {
      this.logger.error(`Imagen Generation Failed: ${error.message}`, error.stack);
      this.logger.debug(
        `Error details - Status: ${error?.status}, Code: ${error?.code}, Message: ${error?.message}`,
      );

      // Handle rate limit errors - check multiple variations
      const errorMessageLower = (error?.message || '').toLowerCase();
      if (
        error?.status === 429 ||
        error?.code === 429 ||
        error?.code === 'RESOURCE_EXHAUSTED' ||
        errorMessageLower.includes('429') ||
        errorMessageLower.includes('rate limit') ||
        errorMessageLower.includes('quota exceeded') ||
        errorMessageLower.includes('resource exhausted')
      ) {
        this.logger.warn(
          `Rate limit detected for Imagen API. Status: ${error?.status}, Code: ${error?.code}, Message: ${error?.message}`,
        );
        throw new BadRequestException(ERROR_MESSAGES.GEMINI_RATE_LIMIT);
      }

      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
        const errorMessage = error.message.includes('aiplatform.endpoints.predict')
          ? 'Vertex AI permission denied. The service account needs the "Vertex AI User" role (roles/aiplatform.user) or "AI Platform Developer" role (roles/ml.developer). Please grant this permission in GCP IAM.'
          : error.message;
        throw new BadRequestException(errorMessage);
      }

      // Handle model not found errors
      if (
        error?.status === 404 ||
        error?.message?.includes('404') ||
        error?.message?.includes('not found') ||
        error?.message?.includes('NOT_FOUND')
      ) {
        throw new BadRequestException(
          `Imagen 3.0 Capability model not found in ${this.location}. Please verify: 1) Model imagen-3.0-capability-002 or imagen-3.0-capability-001 is available in your GCP project, 2) Access is granted, 3) Billing is enabled. Error: ${error.message}`,
        );
      }

      // Handle other API errors
      if (error?.message) {
        throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${error.message}`);
      }

      throw new BadRequestException(ERROR_MESSAGES.GEMINI_API_ERROR);
    }
  }
}
