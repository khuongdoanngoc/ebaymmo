import { Injectable } from '@nestjs/common';
import { StoresSetInput } from 'src/sdk/sdk';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';

@Injectable()
export class StoresService {
  constructor(@InjectSdk() private sdk: GqlSdk) {}

  async getStore(storeId: string) {
    return (await this.sdk.GetStoreById({ storeId })).stores[0];
  }

  async updateStore(storeId: string, updateData: StoresSetInput) {
    return await this.sdk.UpdateStoreStar({ storeId, updateData });
  }
}
