import { Body, Controller, Post } from '@nestjs/common';
import { HasuraActionsPayload } from 'src/types';
import { StoreRatingsService } from './store-ratings.service';
import { StoreRatingsInsertInput } from 'src/sdk/sdk';

@Controller('store-ratings')
export class StoreRatingsController {
  constructor(private readonly storeRatingsService: StoreRatingsService) {}
  @Post('create')
  async createRating(
    @Body()
    payload: HasuraActionsPayload<{ input: StoreRatingsInsertInput }>,
  ) {
    const userId = payload.session_variables['x-hasura-user-id'];
    return await this.storeRatingsService.createStoreRating(payload?.input.input, userId);
  }

  @Post('update')
  async updateRatingViaAction(
    @Body()
    payload: HasuraActionsPayload<{
      id: string;
      input: Partial<StoreRatingsInsertInput>;
    }>,
  ) {
    const { id, input } = payload.input;
    return await this.storeRatingsService.updateStoreRating(id, input);
  }
}
