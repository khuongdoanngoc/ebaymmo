import { Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { ComplainOrderInsertInput } from 'src/sdk/sdk';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';

@Injectable()
export class ComplainService {
  constructor(
    @InjectSdk() private readonly sdk: GqlSdk,
    private orderService: OrderService,
  ) {}
  async createComplain(object: ComplainOrderInsertInput) {
    await this.sdk.CreateComplain({ object });
    const newCompalain = await this.orderService.updateOrder(object.orderId, {
      orderStatus: 'complained',
    });
    console.log(newCompalain.updateOrders.returning[0]);

    return newCompalain.updateOrders.returning[0];
  }
}
