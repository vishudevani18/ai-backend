import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtUser } from '../../../common/types/jwt-user.type';
import { ContactSubmissionsService } from './contact-submissions.service';
import { FilterContactSubmissionsDto } from './dto/filter-contact-submissions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('2. Admin - Contact Submissions')
@Controller('admin/contact-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ContactSubmissionsController {
  constructor(private readonly contactSubmissionsService: ContactSubmissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all contact form submissions with pagination, filtering, and sorting (Admin/Super Admin only)',
    description:
      'Filter by status, email, date range. Sort by createdAt (default), updatedAt, email, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiResponse({ status: 200, description: 'Contact submissions retrieved successfully' })
  async findAll(@Query() filters: FilterContactSubmissionsDto) {
    const { submissions, total } = await this.contactSubmissionsService.findAll(filters);
    return ResponseUtil.paginated(
      submissions,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Contact submissions retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get contact submission by ID (Admin/Super Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({ status: 200, description: 'Contact submission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contact submission not found' })
  async findOne(@Param('id') id: string) {
    const submission = await this.contactSubmissionsService.findOne(id);
    return ResponseUtil.success(submission, 'Contact submission retrieved successfully');
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update contact submission status (Admin/Super Admin only)',
    description:
      'Update the status of a contact submission. When marking as READ, automatically sets readAt and readBy fields.',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Contact submission status updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact submission not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() adminUser: JwtUser,
  ) {
    const submission = await this.contactSubmissionsService.updateStatus(id, dto, adminUser.id);
    return ResponseUtil.success(submission, 'Contact submission status updated successfully');
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete contact submission (Admin/Super Admin only)',
    description: 'Soft delete a contact submission',
  })
  @ApiParam({ name: 'id', description: 'Contact submission ID' })
  @ApiResponse({ status: 200, description: 'Contact submission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact submission not found' })
  async remove(@Param('id') id: string) {
    await this.contactSubmissionsService.remove(id);
    return ResponseUtil.success(null, 'Contact submission deleted successfully');
  }
}

