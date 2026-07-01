import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateTransactionDto } from './dto/update-transaction.dto';


@Controller('transactions')
@UseGuards(JwtAuthGuard) 
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.id, dto);
  }

  @Get()
  findByMonth(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.transactionsService.findByMonth(
      req.user.id,
      parseInt(month),
      parseInt(year),
    );
  }

  @Get('summary')
  getSummary(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.transactionsService.getSummary(
      req.user.id,
      parseInt(month),
      parseInt(year),
    );
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.transactionsService.remove(req.user.id, id);
  }

  
  
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.id, id, dto);
  }
}