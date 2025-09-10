import { Injectable } from '@nestjs/common';
import { StoreRatingsInsertInput } from 'src/sdk/sdk';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class StoreRatingsService {
  constructor(
    @InjectSdk() private sdk: GqlSdk,
    private storesService: StoresService,
  ) {}

  async createStoreRating(object: StoreRatingsInsertInput, userId: string) {
    object['userId'] = userId;
    const newRate = await this.sdk.CreateRate({ object });
    const newRating = newRate.insertStoreRatingsOne;
    const store = await this.storesService.getStore(newRating.storeId);

    const ratingMap: Record<number, string> = {
      1: 'oneStar',
      2: 'twoStar',
      3: 'threeStar',
      4: 'fourStar',
      5: 'fiveStar',
    };

    const ratingField = ratingMap[newRating.rating];
    if (!ratingField) return newRating;

    const updatedCount = store[ratingField] + 1;

    const weightedSum =
      (ratingField === 'oneStar' ? updatedCount : store.oneStar) * 1 +
      (ratingField === 'twoStar' ? updatedCount : store.twoStar) * 2 +
      (ratingField === 'threeStar' ? updatedCount : store.threeStar) * 3 +
      (ratingField === 'fourStar' ? updatedCount : store.fourStar) * 4 +
      (ratingField === 'fiveStar' ? updatedCount : store.fiveStar) * 5;

    const totalCount =
      (ratingField === 'oneStar' ? updatedCount : store.oneStar) +
      (ratingField === 'twoStar' ? updatedCount : store.twoStar) +
      (ratingField === 'threeStar' ? updatedCount : store.threeStar) +
      (ratingField === 'fourStar' ? updatedCount : store.fourStar) +
      (ratingField === 'fiveStar' ? updatedCount : store.fiveStar);

    const averageRating = weightedSum / totalCount;

    await this.sdk.UpdateStoreStar({
      storeId: newRating.storeId,
      updateData: {
        [ratingField]: updatedCount,
        averageRating,
      },
    });
    return newRating;
  }

  async updateStoreRating(ratingId: string, updateData: Partial<StoreRatingsInsertInput>) {
    if (updateData.rating === undefined) {
      return await this.sdk.UpdateRate({ ratingId, updateData });
    }

    const existingRate = (await this.sdk.GetStoreRatings({ ratingId })).storeRatings[0];
    if (!existingRate) {
      throw new Error('Rate not found');
    }

    if (existingRate?.rating === updateData.rating) {
      return await this.sdk.UpdateRate({ ratingId, updateData });
    }

    const updatedRateResult = await this.sdk.UpdateRate({
      ratingId,
      updateData,
    });

    const ratingMap: Record<number, string> = {
      1: 'oneStar',
      2: 'twoStar',
      3: 'threeStar',
      4: 'fourStar',
      5: 'fiveStar',
    };

    const oldRatingField = ratingMap[existingRate.rating];
    const newRatingField = ratingMap[updateData.rating];

    const store = await this.storesService.getStore(existingRate.storeId);

    const updatedCounts = {
      oneStar:
        store.oneStar +
        (newRatingField === 'oneStar' ? 1 : 0) -
        (oldRatingField === 'oneStar' ? 1 : 0),
      twoStar:
        store.twoStar +
        (newRatingField === 'twoStar' ? 1 : 0) -
        (oldRatingField === 'twoStar' ? 1 : 0),
      threeStar:
        store.threeStar +
        (newRatingField === 'threeStar' ? 1 : 0) -
        (oldRatingField === 'threeStar' ? 1 : 0),
      fourStar:
        store.fourStar +
        (newRatingField === 'fourStar' ? 1 : 0) -
        (oldRatingField === 'fourStar' ? 1 : 0),
      fiveStar:
        store.fiveStar +
        (newRatingField === 'fiveStar' ? 1 : 0) -
        (oldRatingField === 'fiveStar' ? 1 : 0),
    };

    const weightedSum =
      updatedCounts.oneStar * 1 +
      updatedCounts.twoStar * 2 +
      updatedCounts.threeStar * 3 +
      updatedCounts.fourStar * 4 +
      updatedCounts.fiveStar * 5;

    const totalCount =
      updatedCounts.oneStar +
      updatedCounts.twoStar +
      updatedCounts.threeStar +
      updatedCounts.fourStar +
      updatedCounts.fiveStar;

    const averageRating = totalCount > 0 ? weightedSum / totalCount : 0;

    await this.sdk.UpdateStoreStar({
      storeId: existingRate.storeId,
      updateData: {
        ...updatedCounts,
        averageRating,
      },
    });
    return updatedRateResult.updateStoreRatings.returning[0];
  }
}
