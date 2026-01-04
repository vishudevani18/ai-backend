import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { OtpPurpose } from '../../../common/constants/auth.constants';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private httpClient: AxiosInstance;
  private provider: string;
  private isInitialized = false;

  constructor(
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {
    this.initializeWhatsApp();
  }

  private initializeWhatsApp() {
    this.provider = this.configService.get<string>('app.whatsapp.provider') || 'meta-direct';

    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Validate configuration based on provider
    if (this.provider === 'meta-direct') {
      const accessToken = this.configService.get<string>('app.whatsapp.accessToken');
      const phoneNumberId = this.configService.get<string>('app.whatsapp.phoneNumberId');

      if (accessToken && phoneNumberId) {
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        this.isInitialized = true;
        this.logger.log('WhatsApp Business API (Meta Direct) initialized successfully');
      } else {
        this.logger.warn(
          'WhatsApp Business API credentials not configured. OTP sending will be mocked.',
        );
      }
    } else if (this.provider === 'gupshup') {
      const apiKey = this.configService.get<string>('app.whatsapp.gupshupApiKey');
      if (apiKey) {
        this.isInitialized = true;
        this.logger.log('WhatsApp Business API (Gupshup) initialized successfully');
      } else {
        this.logger.warn('Gupshup API key not configured. OTP sending will be mocked.');
      }
    } else {
      this.logger.warn(`Unknown WhatsApp provider: ${this.provider}. OTP sending will be mocked.`);
    }
  }

  /**
   * Send OTP via WhatsApp Business API
   */
  async sendOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    const otp = this.otpService.generateOtp();
    const isDevMode = this.configService.get('app.nodeEnv') === 'development';

    // Store OTP in database
    await this.otpService.storeOtp(phone, otp, purpose);

    // In dev mode, always log the OTP to console
    if (isDevMode) {
      this.logger.warn(`[DEV MODE] OTP for ${phone}: ${otp}`);
    }

    // Determine template based on purpose
    const templateName =
      purpose === OtpPurpose.SIGNUP
        ? this.configService.get<string>('app.whatsapp.otpSignupTemplate') || 'otp_signup'
        : this.configService.get<string>('app.whatsapp.otpResetTemplate') || 'otp_reset_password';

    try {
      if (this.provider === 'meta-direct') {
        await this.sendViaMetaDirect(phone, otp, templateName);
      } else if (this.provider === 'gupshup') {
        await this.sendViaGupshup(phone, otp, templateName);
      } else {
        throw new Error(`Unsupported provider: ${this.provider}`);
      }

      this.logger.log(`OTP sent via WhatsApp (${this.provider}) to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phone}`, error);

      // In development, don't throw error - OTP is already logged and stored
      if (isDevMode) {
        this.logger.warn(`[DEV MODE] OTP sending failed, but OTP is logged above and stored in database`);
        return;
      }

      throw new Error(`Failed to send OTP via WhatsApp: ${error.message}`);
    }
  }

  /**
   * Send OTP via Meta WhatsApp Cloud API (Direct)
   */
  private async sendViaMetaDirect(phone: string, otp: string, templateName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('WhatsApp Business API not initialized');
    }

    const apiUrl =
      this.configService.get<string>('app.whatsapp.apiUrl') || 'https://graph.facebook.com/v18.0';
    const phoneNumberId = this.configService.get<string>('app.whatsapp.phoneNumberId');

    if (!phoneNumberId) {
      throw new Error('WhatsApp phone number ID not configured');
    }

    // Format phone number (remove + and ensure it's in international format)
    const formattedPhone = phone.replace(/^\+/, '');

    const url = `${apiUrl}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp,
              },
            ],
          },
        ],
      },
    };

    try {
      await this.httpClient.post(url, payload);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Meta WhatsApp API error: ${errorMessage}`);
    }
  }

  /**
   * Send OTP via Gupshup WhatsApp API
   */
  private async sendViaGupshup(phone: string, otp: string, templateName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Gupshup API not initialized');
    }

    const apiKey = this.configService.get<string>('app.whatsapp.gupshupApiKey');
    const appName = this.configService.get<string>('app.whatsapp.gupshupAppName');

    if (!apiKey || !appName) {
      throw new Error('Gupshup API key or app name not configured');
    }

    // Format phone number (remove +)
    const formattedPhone = phone.replace(/^\+/, '');

    const url = 'https://api.gupshup.io/sm/api/v1/msg';

    const payload = {
      channel: 'whatsapp',
      source: appName,
      destination: formattedPhone,
      message: JSON.stringify({
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
              ],
            },
          ],
        },
      }),
    };

    try {
      const response = await this.httpClient.post(url, new URLSearchParams(payload), {
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Gupshup API error: ${errorMessage}`);
    }
  }
}
