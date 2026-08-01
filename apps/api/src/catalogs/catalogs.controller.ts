import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../database/enums';
import { CatalogsService } from './catalogs.service';
import {
  CreateCompetencyDto,
  CreateLearningOutcomeDto,
  UpdateCompetencyDto,
  UpdateLearningOutcomeDto,
} from './dto/catalog.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Catalogs')
@ApiBearerAuth()
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('competencies')
  listCompetencies(@Query('activeOnly') activeOnly?: string) {
    return this.catalogsService.listCompetencies(activeOnly === 'true');
  }

  @Post('competencies')
  @Roles(Role.ADMIN)
  createCompetency(
    @Body() dto: CreateCompetencyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogsService.createCompetency(dto, user.id);
  }

  @Patch('competencies/:id')
  @Roles(Role.ADMIN)
  updateCompetency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetencyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogsService.updateCompetency(id, dto, user.id);
  }

  @Post('learning-outcomes')
  @Roles(Role.ADMIN)
  createLearningOutcome(
    @Body() dto: CreateLearningOutcomeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogsService.createLearningOutcome(dto, user.id);
  }

  @Patch('learning-outcomes/:id')
  @Roles(Role.ADMIN)
  updateLearningOutcome(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningOutcomeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogsService.updateLearningOutcome(id, dto, user.id);
  }
}
