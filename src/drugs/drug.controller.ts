import { Controller, Get, Param, Query } from '@nestjs/common';
import { DrugService } from './drug.service';
import { DrugSearchQueryDto } from './dto/drug-search-query.dto';
import { DrugListQueryDto } from './dto/drug-list-query.dto';

@Controller('drugs')
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Get('search')
  search(@Query() query: DrugSearchQueryDto) {
    return this.drugService.searchByName(query.name);
  }

  @Get('resolve')
  resolve(@Query() query: DrugSearchQueryDto) {
    return this.drugService.resolveByName(query.name);
  }

  @Get()
  getList(@Query() query: DrugListQueryDto) {
    return this.drugService.getPaginatedList(query.page, query.limit);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.drugService.getById(id);
  }
}
