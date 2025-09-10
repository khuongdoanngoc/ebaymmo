import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../schemas/message.schema';
import { Conversation } from '../schemas/conversation.schema';
import { User } from '../schemas/user.schema';
import { BidChat } from '../schemas/bids.chat.schema';
import { AuthService } from '../auth/auth.service';
@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(Conversation.name)
        private conversationModel: Model<Conversation>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(BidChat.name) private bidChatModel: Model<BidChat>,
        private readonly authService: AuthService,
    ) {}

    // done
    async getConversations(userId: string, limit: number, offset: number) {
        const conversations = await this.conversationModel
            .find({ participants: { $in: [userId] } })
            .select('-messages')
            .populate({
                path: 'lastMessage',
                model: 'Message',
                select: 'content sender',
            })
            .populate({
                path: 'participants',
                model: 'User',
                select: 'username avatar',
            })
            .skip(offset)
            .limit(limit)
            .sort({ 'lastMessage.updatedAt': -1 })
            .lean();
        return conversations;
    }

    async getMessages(conversationId: string, limit: number, offset: number) {
        try {
            if (!Types.ObjectId.isValid(conversationId)) {
                throw new Error('Invalid conversation ID format');
            }

            const messages = await this.messageModel
                .find({ conversationId: new Types.ObjectId(conversationId) })
                .populate({
                    path: 'sender',
                    model: 'User',
                    select: 'username avatar',
                })
                .limit(limit)
                .skip(offset)
                .sort({ createdAt: -1 })
                .exec();
            return messages.reverse();
        } catch (error) {
            console.error('Get messages error:', error);
            // Trả về lỗi chi tiết hơn
            throw new Error(`Failed to get messages: ${error.message}`);
        }
    }

    async createMessage(messageData: {
        conversationId: string;
        sender: {
            username: string;
            avatar: string;
            _id: string;
        };
        content: string;
        type: string;
        status: string;
    }) {
        try {
            const newMessage = new this.messageModel({
                conversationId: new Types.ObjectId(messageData.conversationId),
                sender: messageData.sender,
                content: messageData.content,
                type: messageData.type,
                status: messageData.status,
            });
            await newMessage.save();

            // Update conversation's last message
            await this.conversationModel.updateOne(
                { _id: messageData.conversationId },
                {
                    lastMessage: newMessage._id,
                    updatedAt: Date.now(),
                    $push: { messages: newMessage._id },
                },
            );

            return newMessage;
        } catch (error) {
            console.error('Create message error:', error);
            throw error;
        }
    }

    // done
    async createConversation(username1: string, username2: string) {
        // Thực hiện tìm kiếm user, nếu có thì lấy user đó, nếu không fetch bên hasura về
        
        if (!username1 || !username2) {
            throw new Error('Username is required');
        }

        const user1 = await this.userModel.findOne({ username: username1 });
        let user2 = await this.userModel.findOne({ username: username2 });

        if (!user2) {
            // Thực hiên fetch user từ hasura (set up graphql codegen)
            const hasuraUsers = await this.authService.fetchHasuraUsers(username2);
            console.log(`do fetch user: ${username2} from hasura:`, hasuraUsers)
            if (!hasuraUsers || hasuraUsers.length === 0) {
                throw new Error('User not found in Hasura');
            }
            const hasuraUser = hasuraUsers[0];
            user2 = await this.userModel.findOneAndUpdate(
                { _id: hasuraUser.userId },
                {
                    username: hasuraUser.username,
                    avatar: hasuraUser.images || '',
                    fullName: hasuraUser.fullName || '',
                },
                { upsert: true, new: true }
            );
        }

        // Check if conversation already exists between these users
        const existingConversation = await this.conversationModel.findOne({
            type: 'private',
            participants: { 
                $all: [user1._id.toString(), user2._id.toString()]  // Check if both IDs exist in the participants array
            }
        });

        if (existingConversation) {
            // Populate thông tin user vào participants
            const populatedConversation = await this.conversationModel.findById(existingConversation._id)
                .populate({
                    path: 'participants',
                    model: 'User',
                    select: 'username avatar'
                });
            return populatedConversation;
        }

        // If no existing conversation, create new one
        const newConversation = new this.conversationModel({
            type: 'private',
            participants: [user1._id.toString(), user2._id.toString()],  // Store user IDs as strings in the array
            messages: [],
            lastMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await newConversation.save();
        // Populate thông tin user vào participants
        const populatedConversation = await this.conversationModel.findById(newConversation._id)
            .populate({
                path: 'participants',
                model: 'User',
                select: 'username avatar'
            });
        return populatedConversation;
    }

    async createSelfConversation(userId: string) {
        // Check if self conversation already exists
        const existingConversation = await this.conversationModel.findOne({
            type: 'self',
            participants: userId  // Simply check if the userId is in the participants array
        })
        .populate({
            path: 'participants',
            model: 'User',
            select: 'username avatar'
        });

        if (existingConversation) {
            return existingConversation;
        }

        // If no existing conversation, create new one
        const newConversation = new this.conversationModel({
            type: 'self',
            participants: [userId],  // Add userId directly to the participants array
            messages: [],
            lastMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newConversation.save();
        
        // Populate the participants after saving
        const populatedConversation = await this.conversationModel.findById(newConversation._id)
            .populate({
                path: 'participants',
                model: 'User',
                select: 'username avatar'
            });
            
        return populatedConversation;
    }

    async createSystemConversation(systemUser: { username: string; avatar: string; _id: string }, userId: string) {
        try {
            // Get the real user
            const user = await this.userModel.findOne({ _id: userId });
            if (!user) {
                throw new Error('User not found');
            }

            // Check if system conversation already exists
            const existingConversation = await this.conversationModel.findOne({
                type: 'private',
                'participants.username': { $all: [systemUser.username, user.username] }
            });

            if (existingConversation) {
                return existingConversation;
            }

            // Create participants array with system user and real user
            const participants = [
                {
                    _id: systemUser._id,
                    username: systemUser.username,
                    avatar: systemUser.avatar
                },
                {
                    _id: user._id,
                    username: user.username, 
                    avatar: user.avatar || ''
                }
            ];

            // Create new conversation
            const newConversation = new this.conversationModel({
                type: 'private',
                participants: participants,
                messages: [],
                lastMessage: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await newConversation.save();
            return newConversation;
        } catch (error) {
            console.error('Error creating system conversation:', error);
            throw error;
        }
    }

    // Creates a custom conversation with provided participants
    async createCustomConversation(participants: Array<{ _id: string; username: string; avatar: string }>) {
        try {
            // Create a custom conversation with the provided participants
            const newConversation = new this.conversationModel({
                type: 'private',
                participants: participants,
                messages: [],
                lastMessage: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            
            await newConversation.save();
            return newConversation;
        } catch (error) {
            console.error('Error creating custom conversation:', error);
            throw error;
        }
    }

    async getConversationById(conversationId: string): Promise<Conversation> {
        return await this.conversationModel.findById(conversationId)
            .populate({
                path: 'lastMessage',
                model: 'Message',
                select: 'content sender createdAt updatedAt',
            })
            .populate({
                path: 'participants',
                model: 'User',
                select: '_id username avatar',
            });
    }

    //CHAT BID OF STARK
    // Lấy hoặc tạo phòng chat cho phiên đấu giá
    async getBidChat(bidId: string) {
        try {
            let bidChat = await this.bidChatModel.findOne({ bidId });

            if (!bidChat) {
                bidChat = new this.bidChatModel({
                    name: `Phòng chat đấu giá #${bidId}`,
                    bidId,
                    participants: [],
                    lastMessage: 'Phòng chat được tạo',
                    lastMessageAt: new Date(),
                    isActive: true,
                });
                await bidChat.save();
            }

            return bidChat;
        } catch (error) {
            throw new Error(`Failed to get bid chat: ${error.message}`);
        }
    }

    // Join vào group chat
    async joinBidChat(bidId: string, userId: string) {
        try {
            const bidChat = await this.getBidChat(bidId);

            // Kiểm tra user đã trong group chưa
            const isParticipant = bidChat.participants.includes(userId);

            if (!isParticipant) {
                // Thêm user vào participants
                bidChat.participants.push(userId);
                await bidChat.save();
            }

            return bidChat;
        } catch (error) {
            throw new Error(`Failed to join bid chat: ${error.message}`);
        }
    }

    // Rời khỏi group chat
    async leaveBidChat(bidId: string, userId: string) {
        try {
            const bidChat = await this.getBidChat(bidId);

            // Xóa user khỏi participants
            bidChat.participants = bidChat.participants.filter(
                (id) => id !== userId,
            );
            await bidChat.save();

            return bidChat;
        } catch (error) {
            throw new Error(`Failed to leave bid chat: ${error.message}`);
        }
    }

    // Lấy tin nhắn của group chat
    async getBidMessages(bidId: string, limit = 50, offset = 0) {
        try {
            const bidChat = await this.getBidChat(bidId);

            const messages = await this.messageModel
                .find({ bidChatId: bidChat._id })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .populate('sender', 'username avatar'); // Populate thông tin người gửi

            return messages.reverse();
        } catch (error) {
            throw new Error(`Failed to get bid messages: ${error.message}`);
        }
    }

    // Gửi tin nhắn trong group
    async sendBidMessage(bidId: string, userId: string, content: string) {
        try {
            const bidChat = await this.getBidChat(bidId);

            // Kiểm tra user có trong group không
            if (!bidChat.participants.includes(userId)) {
                throw new Error('User is not in this chat group');
            }

            // Tạo tin nhắn mới
            const message = new this.messageModel({
                bidChatId: bidChat._id,
                sender: userId,
                content,
                type: 'text',
                createdAt: new Date(),
            });
            await message.save();

            // Cập nhật last message
            bidChat.lastMessage = content;
            bidChat.lastMessageAt = new Date();
            await bidChat.save();

            return message;
        } catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
    // Tạo tin nhắn mới cho bid chat
    async createBidMessage(data: {
        bidId: string;
        sender: {
            username: string;
            avatar: string;
            _id: string;
        };
        content: string;
        type: string;
        status: string;
    }) {
        try {
            // Tìm bid chat
            const bidChat = await this.bidChatModel.findOne({
                bidId: data.bidId,
            });
            if (!bidChat) {
                throw new Error('Bid chat not found');
            }

            // Tạo message mới
            const message = new this.messageModel({
                bidChatId: bidChat._id,
                sender: {
                    _id: data.sender._id,
                    username: data.sender.username,
                    avatar: data.sender.avatar,
                },
                content: data.content,
                type: data.type,
                status: data.status,
            });

            await message.save();
            return message;
        } catch (error) {
            console.error('Create bid message error:', error);
            throw new Error('Failed to create bid message');
        }
    }

    // Cập nhật last message của bid chat
    async updateBidChatLastMessage(bidId: string, message: any) {
        try {
            const updatedBidChat = await this.bidChatModel.findOneAndUpdate(
                { bidId },
                {
                    $set: {
                        lastMessage: message.content,
                        lastMessageAt: new Date(),
                    },
                },
                { new: true },
            );

            return updatedBidChat;
        } catch (error) {
            console.error('Update bid chat last message error:', error);
            throw new Error('Failed to update bid chat last message');
        }
    }

    async updateMessageStatus(messageId: string, status: string) {
        try {
            const updatedMessage = await this.messageModel
                .findByIdAndUpdate(
                    messageId,
                    { status: status },
                    { new: true }, // This option returns the modified document rather than the original
                )
                .exec();
            if (!updatedMessage) {
                throw new Error('Message not found');
            }

            return updatedMessage;
        } catch (error) {
            console.error('Error updating message status:', error);
            throw new Error('Failed to update message status');
        }
    }

    async updateMessagesStatusInConversation(
        conversationId: string,
        senderId: string,
        status: string,
    ) {
        try {
            // Update all unread messages from the specified sender in the conversation
            await this.messageModel.updateMany(
                {
                    conversationId: new Types.ObjectId(conversationId),
                    'sender._id': senderId,
                    status: { $ne: status },
                },
                { $set: { status } },
            );

            // Return the updated messages
            const updatedMessages = await this.messageModel
                .find({
                    conversationId: new Types.ObjectId(conversationId),
                    'sender._id': senderId,
                    status,
                })
                .exec();

            return updatedMessages;
        } catch (error) {
            console.error('Error updating messages status:', error);
            throw new Error('Failed to update messages status');
        }
    }

    async updateReadMessages(conversationId: string, userId: string) {
        try {
            // Tìm các tin nhắn chưa đọc
            const messages = await this.messageModel
                .find({
                    conversationId: new Types.ObjectId(conversationId),
                    'sender._id': { $ne: userId }, // Not messages from current user
                    status: { $ne: 'read' }, // Unread messages
                })
                .exec();

            if (messages.length === 0) {
                return [];
            }

            // Cập nhật status thành 'read' cho tất cả tin nhắn tìm được
            await this.messageModel.updateMany(
                {
                    _id: { $in: messages.map((msg) => msg._id) },
                },
                { $set: { status: 'read' } },
            );

            // Cập nhật status trong messages array và trả về
            return messages.map((msg) => ({
                ...msg.toObject(),
                status: 'read',
            }));
        } catch (error) {
            console.error('Error finding and updating unread messages:', error);
            throw new Error('Failed to find and update unread messages');
        }
    }

    async getMessageCount(conversationId: string): Promise<number> {
        try {
            return await this.messageModel.countDocuments({
                conversationId: new Types.ObjectId(conversationId),
            });
        } catch (error) {
            console.error('Error counting messages:', error);
            throw new Error('Failed to count messages');
        }
    }

    // async deleteMessage(messageId: string) {
    //   try {
    //     const message = await this.messageModel.findById(messageId);
    //     if (!message) {
    //       throw new Error('Message not found');
    //     }

    //     // Hard delete - remove message from database
    //     const deletedMessage = await this.messageModel.findByIdAndDelete(messageId);

    //     // If message is in a conversation, remove it from the messages array
    //     if (message.conversationId) {
    //       await this.conversationModel.updateOne(
    //         { _id: message.conversationId },
    //         { $pull: { messages: messageId } }
    //       );
    //     }

    //     return deletedMessage;
    //   } catch (error) {
    //     console.error('Delete message error:', error);
    //     throw new Error('Failed to delete message');
    //   }
    // }
}
