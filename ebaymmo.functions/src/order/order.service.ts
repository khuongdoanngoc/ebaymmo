import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GqlSdk, InjectSdk } from '../sdk/sdk.module';
import { CreateOrderPayload, CreateOrderServicesPayload } from '../types/order.types';
import { OrdersSetInput } from 'src/sdk/sdk';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OrderService {
  constructor(@InjectSdk() private readonly sdk: GqlSdk) {}

  async createOrder(payload: CreateOrderPayload, userId: string) {
    const buyerId = userId;
    console.log('buyerID', buyerId);
    try {
      const { productId, quantity, couponValue, sellerId, isPreOrder } = payload;
      console.log('paylod: ', payload);

      const result = await this.sdk.SubmitOrderProduct({
        buyerId,
        productId,
        quantity,
        couponValue: couponValue || 0,
        sellerId,
        isPreOrder,
      });

      if (!result?.submitOrderProduct?.[0]) {
        throw new Error('Failed to create order');
      }

      const order = result.submitOrderProduct[0];
      console.log(order);
      return {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        createAt: order.createAt,
        orderCode: order.orderCode,
        orderDate: order.orderDate,
        orderStatus: order.orderStatus,
        price: order.price,
        referralCode: order.referralCode,
        buyerId: order.buyerId,
        quantity: order.quantity,
        productId: order.productId,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw new InternalServerErrorException(`Failed to create order: ${error.message}`);
    }
  }
  async updateOrder(orderId: string, updateData: OrdersSetInput) {
    return await this.sdk.UpdateOrder({
      where: { orderId: { _eq: orderId } },
      _set: updateData,
    });
  }

  async createOrderService(payload: CreateOrderServicesPayload, userId: string) {
    const buyerId = userId;
    console.log('buyerID', buyerId);
    try {
      const { product_id, complete_date_service, coupon_value, seller_id } = payload;
      console.log('payload: ', payload);
      console.log('completeDate: ', complete_date_service);

      const result = await this.sdk.SubmitOrderService({
        buyerId,
        productId: product_id,
        couponValue: coupon_value || 0,
        sellerId: seller_id,
        completeDateService: complete_date_service,
      });

      console.log('Service order result:', result);

      if (!result?.submitOrderServices) {
        throw new Error('Failed to create service order');
      }

      const order = result.submitOrderServices;
      console.log('Service order created:', order);

      const response = {
        orderId: order[0].orderId,
        buyerId: order[0].buyerId,
        orderDate: order[0].orderDate,
        totalAmount: order[0].totalAmount,
        orderStatus: order[0].orderStatus,
        createAt: order[0].createAt,
        updateAt: order[0].updateAt,
        productId: order[0].productId,
        quantity: order[0].quantity,
        price: order[0].price,
        orderType: order[0].orderType,
        orderCode: order[0].orderCode,
        couponId: order[0].couponId,
        referralCode: order[0].referralCode,
      };

      return response; // Thêm return statement
    } catch (error) {
      console.error('Error creating service order:', error);
      throw new InternalServerErrorException(`Failed to create service order: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkPreorderStock() {
    try {
      // 1. Lấy tất cả đơn hàng pre-order có trạng thái waiting
      const preOrdersResult = await this.sdk.GetOrders({
        where: {
          isPreOrder: {
            _eq: true,
          },
          orderStatus: {
            _eq: 'waiting',
          },
        },
      });
      const preOrders = preOrdersResult?.orders || [];

      // 2. Kiểm tra và xử lý từng đơn hàng
      for (const order of preOrders) {
        // Kiểm tra stock trực tiếp từ dữ liệu product
        const productResult = await this.sdk.GetProductStock({
          where: {
            productId: {
              _eq: order.productId,
            },
          },
        });

        const product = productResult?.products[0];

        // Nếu sản phẩm tồn tại và đủ số lượng
        if (product && product.stockCount >= order.quantity) {
          // Cập nhật đơn hàng từ pre-order sang pending
          await this.sdk.UpdateOrder({
            where: { orderId: { _eq: order.orderId } },
            _set: {
              isPreOrder: false,
              orderStatus: 'pending',
            },
          });
          await this.sdk.UpdateProductStock({
            where: { productId: { _eq: order.productId } },
            _set: {
              stockCount: product.stockCount - order.quantity,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking pre-order stock:', error);
      throw new InternalServerErrorException(`Failed to check pre-order stock: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndCancelExpiredPreOrders() {
    try {
      // Lấy thời gian hiện tại
      const now = new Date();
      // Tính thời gian 48 giờ trước
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Lấy tất cả đơn hàng pre-order có trạng thái waiting và đã tạo quá 48 giờ
      const expiredPreOrdersResult = await this.sdk.GetOrders({
        where: {
          isPreOrder: {
            _eq: true,
          },
          orderStatus: {
            _eq: 'waiting',
          },
          createAt: {
            _lt: fortyEightHoursAgo.toISOString(),
          },
        },
      });

      const expiredPreOrders = expiredPreOrdersResult?.orders || [];

      // Xử lý từng đơn hàng hết hạn
      for (const order of expiredPreOrders) {
        // Xóa đơn hàng hết hạn
        await this.sdk.DeleteOrder({
          where: { orderId: { _eq: order.orderId } },
        });

        console.log(`Deleted expired pre-order: ${order.orderId}`);
      }
    } catch (error) {
      console.error('Error checking and cancelling expired pre-orders:', error);
      throw new InternalServerErrorException(
        `Failed to check and cancel expired pre-orders: ${error.message}`,
      );
    }
  }
}
