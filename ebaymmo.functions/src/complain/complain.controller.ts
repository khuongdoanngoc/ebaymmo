import { Body, Controller, Post } from '@nestjs/common';
import { ComplainService } from './complain.service';
import { HasuraActionsPayload } from 'src/types';
import { ComplainOrderInsertInput } from 'src/sdk/sdk';

@Controller('complain')
export class ComplainController {
  constructor(private readonly complainService: ComplainService) {}
  @Post('create')
  async createComplain(
    @Body()
    payload: HasuraActionsPayload<{ input: ComplainOrderInsertInput }>,
  ) {
    return await this.complainService.createComplain(payload?.input.input);
  }
}
