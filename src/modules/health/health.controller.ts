import { ROUTES } from '../../common/constants';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('Health')
@Controller(ROUTES.HEALTH.BASE)
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async check() {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };

    return ResponseUtil.success(healthData, 'Service is healthy');
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  async ready() {
    // Add database connectivity check here if needed
    const readinessData = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected', // This would be a real check in production
        storage: 'available',
        external_apis: 'available',
      },
    };

    return ResponseUtil.success(readinessData, 'Service is ready');
  }
}
