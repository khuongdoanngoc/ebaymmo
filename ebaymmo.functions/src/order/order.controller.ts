import { Controller, Post, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderPayload, CreateOrderServicesPayload } from '../types/order.types';
import { HasuraActionsPayload } from 'src/types/hasura/action';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  async createOrder(@Body() payload: HasuraActionsPayload<CreateOrderPayload>) {
    console.log('payload of order', payload);
    const userId = payload.session_variables['x-hasura-user-id'];
    return await this.orderService.createOrder(payload.input, userId);
  }

  @Post('service')
  async createOrderTest(@Body() payload: HasuraActionsPayload<CreateOrderServicesPayload>) {
    console.log('payload of order', payload);
    const userId = payload.session_variables['x-hasura-user-id'];
    return await this.orderService.createOrderService(payload.input, userId);
  }
}
