import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { ChatService } from '../chat/chat.service';
import { Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly chatService: ChatService,
  ) {}

  // Admin user info
  private getAdminInfo(adminUser) {
    return {
      username: adminUser.username,
      avatar: adminUser.avatar || '',
      _id: adminUser._id,
    };
  }

  // Thông báo cho tất cả người dùng
  async notifyAllUsers(adminUser: any, content: string) {
    try {
      // Lấy tất cả người dùng, ngoại trừ admin và system
      const allUsers = await this.userModel.find({
        _id: { $ne: adminUser._id },
        username: { $ne: 'system' }
      });

      return await this.sendNotificationToUsers(adminUser, allUsers, content);
    } catch (error) {
      console.error('Error notifying all users:', error);
      throw new Error(`Failed to notify all users: ${error.message}`);
    }
  }

  // Thông báo cho danh sách người dùng cụ thể
  async notifySpecificUsers(adminUser: any, userIds: string[], content: string) {
    try {
      // Lấy thông tin người dùng từ danh sách ID
      const users = await this.userModel.find({
        _id: { $in: userIds }
      });

      return await this.sendNotificationToUsers(adminUser, users, content);
    } catch (error) {
      console.error('Error notifying specific users:', error);
      throw new Error(`Failed to notify specific users: ${error.message}`);
    }
  }

  // Thông báo cho tất cả người bán
  async notifySellers(adminUser: any, content: string) {
    try {
      // Lấy tất cả người bán (sellerSince không null)
      const sellers = await this.userModel.find({
        sellerSince: { $ne: null }
      });

      return await this.sendNotificationToUsers(adminUser, sellers, content);
    } catch (error) {
      console.error('Error notifying sellers:', error);
      throw new Error(`Failed to notify sellers: ${error.message}`);
    }
  }

  // Hàm gửi thông báo đến danh sách người dùng
  private async sendNotificationToUsers(adminUser: any, users: any[], content: string) {
    const adminInfo = this.getAdminInfo(adminUser);
    
    // Theo dõi kết quả gửi tin nhắn
    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      users: []
    };

    // Gửi thông báo đến từng người dùng
    for (const user of users) {
      try {
        // Tạo hoặc lấy conversation giữa admin và người dùng
        const conversation = await this.getOrCreateConversation(adminUser._id, user._id);
        
        // Tạo tin nhắn thông báo
        const message = await this.chatService.createMessage({
          conversationId: conversation._id.toString(),
          sender: adminInfo,
          content: content,
          type: 'text',
          status: 'sent',
        });

        // Cập nhật last message của conversation
        const updatedConversation = await this.chatService.getConversationById(conversation._id.toString());
        updatedConversation.updatedAt = new Date();
        await updatedConversation.save();

        results.success++;
        results.users.push({
          username: user.username,
          userId: user._id.toString(),
          status: 'success'
        });
      } catch (error) {
        console.error(`Error sending notification to user ${user.username}:`, error);
        results.failed++;
        results.users.push({
          username: user.username,
          userId: user._id.toString(),
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  // Lấy hoặc tạo conversation giữa admin và người dùng
  private async getOrCreateConversation(adminId: string, userId: string) {
    // Lấy danh sách conversations của admin
    const adminConversations = await this.chatService.getConversations(adminId, 100, 0);
    
    // Tìm conversation với người dùng
    const existingConversation = adminConversations.find(conv => 
      conv.participants.some(p => p._id.toString() === userId)
    );

    if (existingConversation) {
      return existingConversation;
    }

    // Lấy thông tin người dùng
    const adminUser = await this.userModel.findById(adminId);
    const targetUser = await this.userModel.findById(userId);

    if (!adminUser || !targetUser) {
      throw new Error('User not found');
    }

    // Tạo conversation mới
    return await this.chatService.createCustomConversation([
      { 
        _id: adminId,
        username: adminUser.username,
        avatar: adminUser.avatar || ''
      },
      { 
        _id: userId,
        username: targetUser.username,
        avatar: targetUser.avatar || ''
      }
    ]);
  }
} 