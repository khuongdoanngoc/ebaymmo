// src/chat/chat.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
    },
})
export class ChatGateway implements OnModuleInit {
    @WebSocketServer()
    server: Server;

    private redisClient = new Redis({
        host: process.env.REDIS_IP,
        port: 6379,
    });

    // System user for sending system notifications
    private systemUser = {
        username: 'system',
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png', // Bot avatar from flaticon
        _id: 'system-user-id', // Use a fixed ID for system
    };

    // Message filter patterns
    private spamPatterns = [
        /viagra/i,
        /casino/i,
        /lottery/i,
        /\b(bet|betting)\b/i,
        /\b(earn money quickly|make money fast)\b/i,
        // Add more patterns as needed
    ];

    // Rate limit settings
    private messageRateLimit = 500; // 0.5 seconds between messages
    private conversationStartLimit = 10; // Max new conversations in timeframe
    private conversationTimeFrame = 300000; // 5 minutes in milliseconds 
    private maxPenaltyTime = 300000; // 5 minutes max penalty

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) {
        // Initialize user status tracking
        this.initializeUserStatusTracking();
        // Initialize System Admin user
        this.initializeSystemUser();
    }

    async onModuleInit() {
        try {
            console.log('Clearing Redis cache on module initialization...');
            // Xóa toàn bộ cache Redis
            await this.redisClient.flushall();
            console.log('Redis cache cleared successfully');
        } catch (error) {
            console.error('Error clearing Redis cache:', error);
        }
    }

    private async initializeUserStatusTracking() {
        // Clear any stale user status data on server restart
        const keys = await this.redisClient.keys('user:status:*');
        if (keys.length > 0) {
            await this.redisClient.del(...keys);
        }
    }
    
    // Initialize the System Admin user in the database
    private async initializeSystemUser() {
        try {
            // Check if System Admin user already exists
            const systemUserExists = await this.authService.getUserByUsername(this.systemUser.username);
            
            if (!systemUserExists) {
                console.log('Creating System Admin user in database...');
                // Create the System Admin user in the database
                await this.authService.createSystemUser({
                    _id: this.systemUser._id,
                    username: this.systemUser.username,
                    avatar: this.systemUser.avatar,
                    role: 'admin'
                });
                console.log('System Admin user created successfully');
            } else {
                console.log('System Admin user already exists in database, updating avatar...');
                // Update the avatar if the user already exists
                await this.authService.createSystemUser({
                    _id: this.systemUser._id,
                    username: this.systemUser.username,
                    avatar: this.systemUser.avatar,
                    role: 'admin'
                });
            }


            // Đặt trạng thái người dùng là online trong Redis
            await this.redisClient.set(`user:status:${this.systemUser._id}`, 'online');
        } catch (error) {
            console.error('Error initializing System Admin user:', error);
        }
    }

    async handleConnection(client: Socket) {
        const token = client.handshake.headers['authorization']?.split(' ')[1];
        try {
            if (!token) {
                throw new Error('No authorization token provided');
            }

            const user = await this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });
            const userId =
                user['https://hasura.io/jwt/claims']['X-Hasura-User-Id'];
            const userInfo = await this.authService.getUserInfo(userId);

            if (!userInfo) {
                throw new Error('User not found');
            }
            client.data.user = {
                username: userInfo.username,
                avatar: userInfo.avatar,
                _id: userInfo._id,
            };
            await client.join(userInfo._id.toString());

            // Lưu socketId theo cả username và _id để đảm bảo tính nhất quán
            await this.redisClient.set(
                `user:socket:${userInfo.username}`,
                client.id,
            );
            
            // Thêm dòng này để lưu theo _id
            await this.redisClient.set(
                `user:socket:${userInfo._id}`,
                client.id,
            );

            // Đặt trạng thái người dùng là online trong Redis
            await this.redisClient.set(`user:status:${userInfo._id}`, 'online');

            // Phát sóng trạng thái online của người dùng đến tất cả các client đã kết nối
            this.server.emit('userStatusChanged', {
                userId: userInfo._id,
                status: 'online',
            });
        } catch (err) {
            console.error('Lỗi kết nối:', err.message);
            client.disconnect();
        }
    }

    // Lắng nghe get history conversations từ client và emit ngược lại cho client response conversations
    @SubscribeMessage('getHistoryConversations')
    async getHistoryConversation(
        @MessageBody() data: { userId: string | undefined },
        @ConnectedSocket() client: Socket,
    ) {
        // cần add pagination for get conversations
        const conversations = await this.chatService.getConversations(
            data.userId,
            10,
            0,
        );
        client.emit('responseHistoryConversations', conversations);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody()
        data: { conversationId: string; content: string; type: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = client.data.user._id.toString();
            
            // Check if user is admin (exempt from rate limiting)
            const isAdmin = await this.isUserAdmin(userId);
            
            if (!isAdmin) {
                // Rate limiting for regular users
                const rateLimitKey = `ratelimit:message:${userId}`;
                const conversationCountKey = `ratelimit:conversation:count:${userId}`;
                const penaltyKey = `ratelimit:penalty:${userId}`;
                
                // Check if user is in penalty mode
                const penaltyTime = await this.redisClient.get(penaltyKey);
                if (penaltyTime) {
                    const penalty = parseInt(penaltyTime);
                    const timeElapsed = Date.now() - penalty;
                    const penaltyDuration = await this.redisClient.get(`ratelimit:penalty:duration:${userId}`) || '30000';
                    const duration = parseInt(penaltyDuration);
                    
                    if (timeElapsed < duration) {
                        // User is in penalty mode, reject the message
                        client.emit('error', { 
                            message: `You're temporarily restricted from sending messages. Please try again in ${Math.ceil((duration - timeElapsed) / 1000)} seconds.`,
                            cooldown: duration - timeElapsed,
                            type: 'penalty'
                        });
                        
                        // Send system message to the user
                        this.sendSystemMessage(
                            userId,
                            `Your messaging is temporarily restricted due to suspicious activity. Please wait ${Math.ceil((duration - timeElapsed) / 1000)} seconds before trying again.`
                        );
                        
                        // Increment penalty violation attempts counter
                        const attemptKey = `ratelimit:penalty:attempts:${userId}`;
                        const attempts = await this.redisClient.incr(attemptKey);
                        
                        // Set expiry if first attempt
                        if (attempts === 1) {
                            await this.redisClient.expire(attemptKey, 3600); // 1 hour
                        }
                        
                        // Track users who repeatedly try to bypass penalties
                        if (attempts >= 5) {
                            await this.trackViolation(
                                userId,
                                'penalty_bypass_attempts',
                                `User attempted to send ${attempts} messages while in penalty mode`
                            );
                            
                            // Increase penalty for repeated attempts
                            const newPenaltyDuration = Math.min(duration * 2, this.maxPenaltyTime);
                            await this.redisClient.set(`ratelimit:penalty:duration:${userId}`, newPenaltyDuration.toString(), 'EX', 3600);
                            
                            // Reset counter
                            await this.redisClient.del(attemptKey);
                        }
                        
                        return;
                    }
                }
                
                // Check if user is rate limited for individual messages
                const lastMessageTime = await this.redisClient.get(rateLimitKey);
                if (lastMessageTime) {
                    const timeElapsed = Date.now() - parseInt(lastMessageTime);
                    if (timeElapsed < this.messageRateLimit) {
                        // User is sending messages too quickly
                        
                        // Increase penalty duration each time they try when rate limited
                        const currentPenaltyDuration = await this.redisClient.get(`ratelimit:penalty:duration:${userId}`) || '30000';
                        const newDuration = Math.min(
                            parseInt(currentPenaltyDuration) + 5000, // Increase by 5 seconds each time
                            this.maxPenaltyTime // Cap at maximum penalty time
                        );
                        
                        // Set penalty mode
                        await this.redisClient.set(penaltyKey, Date.now().toString(), 'EX', 3600);
                        await this.redisClient.set(`ratelimit:penalty:duration:${userId}`, newDuration.toString(), 'EX', 3600);
                        
                        client.emit('error', { 
                            message: `Rate limit exceeded. Your cooldown period has been increased to ${newDuration/1000} seconds due to rapid messaging.`,
                            cooldown: newDuration,
                            type: 'rate_limit_increased'
                        });
                        
                        // Send system message
                        this.sendSystemMessage(
                            userId,
                            `Your messaging cooldown has been increased to ${newDuration/1000} seconds due to rapid messaging. Please slow down.`
                        );
                        
                        // Track repeated rate limit violations (only if penalty is significant)
                        if (newDuration >= 60000) { // 1 minute or more
                            await this.trackViolation(
                                userId,
                                'repeated_rate_limit',
                                `User repeatedly exceeded rate limits, penalty increased to ${newDuration/1000} seconds`
                            );
                        }
                        
                        return;
                    }
                }
                
                // Filter message content for spam/inappropriate content
                if (this.isSpamMessage(data.content)) {
                    client.emit('error', {
                        message: 'Your message was flagged as potential spam and was not sent.',
                        type: 'content_filtered'
                    });
                    
                    // Send system warning
                    this.sendSystemMessage(
                        userId,
                        'Your message was flagged as potential spam and was not sent. Please avoid sending promotional or inappropriate content.'
                    );
                    
                    // Apply penalty for spam attempt
                    await this.redisClient.set(penaltyKey, Date.now().toString(), 'EX', 3600);
                    await this.redisClient.set(`ratelimit:penalty:duration:${userId}`, '60000', 'EX', 3600); // 1 minute penalty for spam
                    
                    // Track this violation for admin review
                    await this.trackViolation(
                        userId, 
                        'spam_message', 
                        `Message content flagged as spam: "${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}"`
                    );
                    
                    return;
                }
                
                // Check if user is creating too many new conversations
                if (data.conversationId.includes('new-conversation')) {
                    const conversationCount = await this.redisClient.get(conversationCountKey) || '0';
                    const count = parseInt(conversationCount);
                    
                    if (count >= this.conversationStartLimit) {
                        client.emit('error', {
                            message: `You've started too many new conversations recently. Please wait before starting more.`,
                            type: 'conversation_limit'
                        });
                        
                        // Send system message
                        this.sendSystemMessage(
                            userId,
                            `You've reached the limit for starting new conversations. Please wait before contacting more users.`
                        );
                        
                        // Track this violation for admin review
                        await this.trackViolation(
                            userId,
                            'conversation_limit',
                            `User attempted to start more than ${this.conversationStartLimit} conversations in ${this.conversationTimeFrame/60000} minutes`
                        );
                        
                        return;
                    }
                    
                    // Increment conversation count
                    await this.redisClient.incr(conversationCountKey);
                    // Set expiry if first conversation in timeframe
                    if (count === 0) {
                        await this.redisClient.expire(conversationCountKey, Math.ceil(this.conversationTimeFrame / 1000));
                    }
                }
                 
                // Update rate limit timestamp
                await this.redisClient.set(rateLimitKey, Date.now().toString(), 'EX', 60);
            }
            
            const sender = {
                username: client.data.user.username,
                avatar: client.data.user.avatar || '',
                _id: client.data.user._id || '',
            };
            const message = await this.chatService.createMessage({
                conversationId: data.conversationId,
                sender: sender,
                content: data.content,
                type: data.type,
                status: 'sent',
            });

            await this.server
                .to(data.conversationId.toString())
                .emit('newMessage', message);

            // Lấy thông tin conversation để emit cập nhật lastMessage
            const updatedConversation = await this.chatService.getConversationById(data.conversationId);
            if (updatedConversation) {
                // Just emit the conversation without modifying lastMessage
                // The lastMessage is already set correctly in the database by the createMessage method

                // Emit updateConversation cho tất cả participants
                for (const participant of updatedConversation.participants) {
                    // Thử lấy socket ID theo _id trước
                    let socketId = await this.redisClient.get(
                        `user:socket:${participant}`,
                    );
                    // Nếu không tìm thấy, thử lấy theo username (để hỗ trợ cả trước và sau khi cập nhật)
                    if (!socketId) {
                        const participantInfo = await this.authService.getUserInfo(participant._id);
                        if (participantInfo) {
                            socketId = await this.redisClient.get(
                                `user:socket:${participantInfo.username}`,
                            );
                        }
                    }
                    if (socketId) {
                        this.server
                            .to(socketId)
                            .emit('updateConversation', updatedConversation);
                        
                        // Gửi lại tin nhắn để đảm bảo người dùng nhận được
                        this.server
                            .to(socketId)
                            .emit('newMessage', message);
                    }
                }
            }

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }

    @SubscribeMessage('joinConversation')
    async joinConversation(
        @MessageBody()
        data: { conversationId: string; limit?: number; offset?: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const previousRooms = Object.keys(client.rooms).filter(
                (room) =>
                    room !== client.id &&
                    room !== client.data.user._id.toString(),
            );
            previousRooms.forEach((room) => client.leave(room));
            if (!data.conversationId) {
                throw new Error('Conversation ID is required');
            }
            await client.join(data.conversationId.toString());
            const limit = data.limit || 10;
            const offset = data.offset || 0;
            const messages = await this.chatService.getMessages(
                data.conversationId,
                limit,
                offset,
            );
            const totalCount = await this.chatService.getMessageCount(
                data.conversationId,
            );
            client.emit('responseHistoryMessages', {
                messages,
                offset: offset,
                hasMore: totalCount - limit * (offset + 1) > 0,
                remainingCount: totalCount - limit * (offset + 1),
            });
        } catch (error) {
            console.error('Error joining conversation:', error.message);
            client.emit('error', { message: 'Failed to join conversation' });
        }
    }

    @SubscribeMessage('loadMoreMessages')
    async loadMoreMessages(
        @MessageBody()
        data: { conversationId: string; limit?: number; offset: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            if (!data.conversationId) {
                throw new Error('Conversation ID is required');
            }

            const limit = data.limit || 2;
            const offset = data.offset || 1;

            // Get total message count for the conversation
            const totalCount = await this.chatService.getMessageCount(
                data.conversationId,
            );
            const messages = await this.chatService.getMessages(
                data.conversationId,
                limit,
                offset,
            );

            // Calculate remaining messages

            client.emit('responseMoreMessages', {
                messages,
                offset: offset + 1,
                hasMore: totalCount - limit * (offset + 1) > 0,
                remainingCount: totalCount - limit * (offset + 1),
            });
        } catch (error) {
            console.error('Error loading more messages:', error.message);
            client.emit('error', { message: 'Failed to load more messages' });
        }
    }

    @SubscribeMessage('createConversation')
    async createConversation(
        @MessageBody() data: { username: string },
        @ConnectedSocket() client: Socket,
    ) {
        // const previousRooms = Object.keys(client.rooms).filter(room => room !== client.id && room !== client.data.user._id.toString());
        // previousRooms.forEach(room => client.leave(room));
        let conversation;
        if (data.username === client.data.user.username) {
            conversation = await this.chatService.createSelfConversation(
                client.data.user,
            );
        } else {
            conversation = await this.chatService.createConversation(
                client.data.user.username,
                data.username,
            );
        }
        // await client.join(conversation._id.toString());
        await client.emit('newConversation', conversation);
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: { conversationId: string; recipientId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const username = client.data.user.username;
            await this.server
                .to(data.recipientId.toString())
                .emit('user_typing', {
                    username,
                    conversationId: data.conversationId,
                });
        } catch (error) {
            console.error('Error handling typing event:', error);
            client.emit('error', {
                message: 'Failed to broadcast typing status',
            });
        }
    }

    @SubscribeMessage('stop_typing')
    async handleStopTyping(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const username = client.data.user.username;
            await this.server
                .to(data.conversationId.toString())
                .emit('user_stop_typing', {
                    username,
                    conversationId: data.conversationId,
                });
        } catch (error) {
            console.error('Error handling stop typing event:', error);
            client.emit('error', {
                message: 'Failed to broadcast stop typing status',
            });
        }
    }

    // CHAT IN BID OF STARK
    // Thêm các methods mới cho bid chat
    @SubscribeMessage('joinBidChat')
    async handleJoinBidChat(
        @MessageBody() data: { bidId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Join socket room của bid
            await client.join(`bid_${data.bidId}`);
            // Lấy hoặc tạo bid chat
            const bidChat = await this.chatService.getBidChat(data.bidId);
            // Join user vào bid chat
            await this.chatService.joinBidChat(data.bidId, client.data.user);
            // Lấy tin nhắn gần đây
            const messages = await this.chatService.getBidMessages(data.bidId);
            // Gửi tin nhắn về cho client
            client.emit('bidMessages', messages);
            // Thông báo có người mới tham gia
            this.server.to(`bid_${data.bidId}`).emit('userJoinedBid', {
                user: {
                    username: client.data.user.username,
                    avatar: client.data.user.avatar,
                    _id: client.data.user._id,
                },
                message: `${client.data.user.username} đã tham gia phòng chat`,
            });
        } catch (error) {
            console.error('Join bid chat error:', error);
            client.emit('error', { message: 'Failed to join bid chat' });
        }
    }

    @SubscribeMessage('leaveBidChat')
    async handleLeaveBidChat(
        @MessageBody() data: { bidId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Leave socket room
            await client.leave(`bid_${data.bidId}`);

            // Remove user from bid chat
            await this.chatService.leaveBidChat(
                data.bidId,
                client.data.user._id,
            );

            // Thông báo có người rời đi
            this.server.to(`bid_${data.bidId}`).emit('userLeftBid', {
                user: {
                    username: client.data.user.username,
                    _id: client.data.user._id,
                },
                message: `${client.data.user.username} đã rời phòng chat`,
            });
        } catch (error) {
            console.error('Leave bid chat error:', error);
            client.emit('error', { message: 'Failed to leave bid chat' });
        }
    }

    @SubscribeMessage('getBidMessages')
    async handleGetBidMessages(
        @MessageBody()
        data: {
            bidId: string;
            limit?: number;
            offset?: number;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const messages = await this.chatService.getBidMessages(
                data.bidId,
                data.limit || 20,
                data.offset || 0,
            );
            client.emit('bidMessages', messages);
        } catch (error) {
            console.error('Get bid messages error:', error);
            client.emit('error', { message: 'Failed to get messages' });
        }
    }

    @SubscribeMessage('sendBidMessage')
    async handleBidMessage(
        @MessageBody()
        data: {
            bidId: string;
            content: string;
            type?: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const sender = {
                username: client.data.user.username,
                avatar: client.data.user.avatar || '',
                _id: client.data.user._id,
            };

            // Tạo tin nhắn mới
            const message = await this.chatService.createBidMessage({
                bidId: data.bidId,
                sender: sender,
                content: data.content,
                type: data.type || 'text',
                status: 'sent',
            });

            // Gửi tin nhắn cho tất cả trong room
            await this.server
                .to(`bid_${data.bidId}`)
                .emit('newBidMessage', message);

            // Cập nhật last message của bid chat
            const updatedBidChat =
                await this.chatService.updateBidChatLastMessage(
                    data.bidId,
                    message,
                );

            return message;
        } catch (error) {
            console.error('Error sending bid message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }

    @SubscribeMessage('messageRead')
    async handleMessageRead(
        @MessageBody() data: { conversationId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Update all unread messages in the conversation for the specified sender
            const updatedMessages =
                await this.chatService.updateMessagesStatusInConversation(
                    data.conversationId,
                    data.userId,
                    'read',
                );

            // Emit the updated messages to all users in the conversation
            await this.server
                .to(data.conversationId.toString())
                .emit('messagesStatusUpdated', {
                    conversationId: data.conversationId,
                    messages: updatedMessages,
                });

            return updatedMessages;
        } catch (error) {
            console.error('Error updating messages read status:', error);
            client.emit('error', {
                message: 'Failed to update messages read status',
            });
        }
    }

    @SubscribeMessage('markConversationAsRead')
    async handleMarkConversationAsRead(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Chỉ cập nhật và trả về các tin nhắn đã được đánh dấu đã đọc
            const updatedMessages = await this.chatService.updateReadMessages(
                data.conversationId,
                client.data.user._id,
            );

            // Emit chỉ những tin nhắn đã được cập nhật
            await this.server
                .to(data.conversationId.toString())
                .emit('messagesStatusUpdated', {
                    conversationId: data.conversationId,
                    updatedMessages: updatedMessages,
                });
        } catch (error) {
            console.error('Error marking conversation as read:', error);
            client.emit('error', {
                message: 'Failed to mark conversation as read',
            });
        }
    }

    // Add new methods for user status

    @SubscribeMessage('getUserStatus')
    async handleGetUserStatus(
        @MessageBody() data: { userIds: string[] },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const statuses = {};

            for (const userId of data.userIds) {
                const status =
                    (await this.redisClient.get(`user:status:${userId}`)) ||
                    'offline';
                let lastSeen = null;

                if (status === 'offline') {
                    lastSeen = await this.redisClient.get(
                        `user:last_seen:${userId}`,
                    );
                }

                statuses[userId] = {
                    status,
                    lastSeen: lastSeen ? parseInt(lastSeen) : null,
                };
            }

            client.emit('userStatusResponse', statuses);
        } catch (error) {
            console.error('Error getting user status:', error);
            client.emit('error', { message: 'Failed to get user status' });
        }
    }

    @SubscribeMessage('setUserStatus')
    async handleSetUserStatus(
        @MessageBody() data: { status: 'online' | 'away' | 'busy' | 'offline' },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            if (!client.data?.user?._id) {
                throw new Error('User not authenticated');
            }

            const userId = client.data.user._id;
            const status = data.status;

            // Update status in Redis
            await this.redisClient.set(`user:status:${userId}`, status);

            if (status === 'offline') {
                await this.redisClient.set(
                    `user:last_seen:${userId}`,
                    Date.now().toString(),
                );
            }

            // Broadcast status change to all connected clients
            this.server.emit('userStatusChanged', {
                userId: userId,
                status: status,
                lastSeen: status === 'offline' ? Date.now() : null,
            });
        } catch (error) {
            console.error('Error setting user status:', error);
            client.emit('error', { message: 'Failed to set user status' });
        }
    }

    // Update handleDisconnect to track offline status
    async handleDisconnect(client: Socket) {
        if (client.data?.user) {
            const userId = client.data.user._id;
            const username = client.data.user.username;

            // Kiểm tra xem đây có phải là socket hiện tại của người dùng trước khi xóa
            const currentSocketId = await this.redisClient.get(
                `user:socket:${username}`,
            );
            if (currentSocketId === client.id) {
                // Chỉ xóa nếu đây là socket hiện tại
                await this.redisClient.del(`user:socket:${username}`);
                // Xóa thêm key theo _id
                await this.redisClient.del(`user:socket:${userId}`);

                // Đặt trạng thái người dùng là offline trong Redis
                await this.redisClient.set(`user:status:${userId}`, 'offline');
                await this.redisClient.set(
                    `user:last_seen:${userId}`,
                    Date.now().toString(),
                );

                // Phát sóng trạng thái offline của người dùng đến tất cả các client đã kết nối
                this.server.emit('userStatusChanged', {
                    userId: userId,
                    status: 'offline',
                    lastSeen: Date.now(),
                });
            } else {
            }
        }

        // Rời khỏi tất cả các phòng
        client.rooms.forEach((room) => client.leave(room));
    }

    // Helper methods for the enhanced features
    
    // Check if user is admin
    private async isUserAdmin(userId: string): Promise<boolean> {
        try {
            // Fetch user info and check for admin role
            const userInfo = await this.authService.getUserInfo(userId);
            // Handle case where older user records might not have role field
            return userInfo?.role === 'admin' || false;
        } catch (error) {
            console.error('Admin check error:', error);
            return false; // Default to non-admin on error
        }
    }
    
    // Tracking user violations for admin review
    private async trackViolation(userId: string, violationType: string, details: string) {
        try {
            // Store violation in Redis for admin review
            const violationKey = `violations:${Date.now()}`;
            const violationData = JSON.stringify({
                userId,
                violationType,
                details,
                timestamp: Date.now(),
                resolved: false
            });
            
            // Store violation with 7-day expiry
            await this.redisClient.set(violationKey, violationData, 'EX', 60 * 60 * 24 * 7);
            
            // Add to user's violation list
            await this.redisClient.lpush(`user:violations:${userId}`, violationKey);
            await this.redisClient.ltrim(`user:violations:${userId}`, 0, 99); // Keep last 100 violations
            
            // Alert admins about the violation
            await this.notifyAdminsAboutViolation(userId, violationType, details);
            
        } catch (error) {
            console.error('Error tracking violation:', error);
        }
    }
    
    // Notify admins about user violations
    private async notifyAdminsAboutViolation(userId: string, violationType: string, details: string) {
        try {
            // Get user info for better context
            const userInfo = await this.authService.getUserInfo(userId);
            const username = userInfo?.username || userId;
            
            // Get the real system user from database
            const systemUserInfo = await this.authService.getUserByUsername(this.systemUser.username);
            if (!systemUserInfo) {
                throw new Error('System Admin user not found in database');
            }
            
            // Use real system user data from database
            const systemSender = {
                username: systemUserInfo.username,
                avatar: systemUserInfo.avatar || this.systemUser.avatar,
                _id: systemUserInfo._id
            };
            
            // Prepare notification message
            const notification = `Violation Alert: User "${username}" (${userId}) - ${violationType}. Details: ${details}`;
            
            // Find all admin users
            const adminUsers = await this.findAdminUsers();
            
            // Send notification to each admin
            for (const admin of adminUsers) {
                try {
                    // Create or get admin-system conversation
                    const systemConversationId = await this.getOrCreateSystemConversation(admin._id);
                    
                    // Send message as System
                    await this.chatService.createMessage({
                        conversationId: systemConversationId,
                        sender: systemSender,
                        content: notification,
                        type: 'text',
                        status: 'sent',
                    });
                    
                    // Notify connected admin
                    const adminSocketId = await this.redisClient.get(`user:socket:${admin.username}`);
                    if (adminSocketId) {
                        this.server.to(adminSocketId).emit('violationAlert', {
                            userId,
                            username,
                            violationType,
                            details,
                            timestamp: Date.now()
                        });
                    }
                } catch (adminError) {
                    console.error(`Error notifying admin ${admin.username}:`, adminError);
                    // Continue with next admin even if one fails
                    continue;
                }
            }
        } catch (error) {
            console.error('Error notifying admins:', error);
        }
    }
    
    // Helper method to find admin users (should be implemented properly based on your user model)
    private async findAdminUsers() {
        try {
            // This is a simplified implementation
            // In a real system, this would query your database for users with admin role
            return await this.authService.findUsersByRole('admin');
        } catch (error) {
            console.error('Error finding admin users:', error);
            return []; // Return empty array if no admins found
        }
    }
    
    // Admin sends message to user who violated rules
    @SubscribeMessage('sendAdminMessage')
    async handleAdminMessage(
        @MessageBody() data: { userId: string; content: string; },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Check if sender is admin
            const isAdmin = await this.isUserAdmin(client.data.user._id.toString());
            if (!isAdmin) {
                client.emit('error', {
                    message: 'Unauthorized. Only admins can send admin messages.',
                    type: 'permission_denied'
                });
                return;
            }
            
            // Get user information
            const targetUser = await this.authService.getUserInfo(data.userId);
            if (!targetUser) {
                client.emit('error', {
                    message: 'User not found',
                    type: 'user_not_found'
                });
                return;
            }
            
            // Create or get admin-user conversation
            let conversationId = await this.getOrCreateAdminConversation(
                client.data.user._id.toString(),
                data.userId
            );
            
            // Send message as admin (not as system)
            const sender = {
                username: client.data.user.username,
                avatar: client.data.user.avatar || '',
                _id: client.data.user._id || '',
            };
            
            const message = await this.chatService.createMessage({
                conversationId,
                sender,
                content: data.content,
                type: 'text',
                status: 'sent',
            });
            
            // Emit to the conversation room
            await this.server.to(conversationId).emit('newMessage', message);
            
            // Update conversation's last message for both users
            const updatedConversation = await this.chatService.getConversationById(conversationId);
            if (updatedConversation) {
                // Just emit the conversation without modifying lastMessage
                
                // Send update to both admin and target user
                for (const participant of updatedConversation.participants) {
                    const socketId = await this.redisClient.get(
                        `user:socket:${participant._id}`,
                    );
                    if (socketId) {
                        this.server.to(socketId).emit('updateConversation', updatedConversation);
                    }
                }
            }
            
            return message;
        } catch (error) {
            console.error('Error sending admin message:', error);
            client.emit('error', { message: 'Failed to send admin message' });
        }
    }
    
    // Get or create a conversation between admin and user
    private async getOrCreateAdminConversation(adminId: string, userId: string): Promise<string> {
        try {
            const adminInfo = await this.authService.getUserInfo(adminId);
            const userInfo = await this.authService.getUserInfo(userId);
            
            if (!adminInfo || !userInfo) {
                throw new Error('Admin or user not found');
            }
            
            // Get admin's conversations
            const adminConversations = await this.chatService.getConversations(adminId, 100, 0);
            
            // Look for an existing conversation with this user
            for (const conv of adminConversations) {
                if (conv.participants.some(p => p._id === userId)) {
                    return conv._id.toString();
                }
            }
            
            // If no conversation exists, create one
            try {
                const conversation = await this.chatService.createConversation(
                    adminInfo.username,
                    userInfo.username
                );
                
                return conversation._id.toString();
            } catch (error) {
                console.error('Error creating conversation using standard method:', error);
                
                // Fallback to create a conversation manually with custom participants
                const participants = [
                    {
                        _id: adminInfo._id,
                        username: adminInfo.username,
                        avatar: adminInfo.avatar || ''
                    },
                    {
                        _id: userInfo._id,
                        username: userInfo.username,
                        avatar: userInfo.avatar || ''
                    }
                ];
                
                const newConversation = await this.chatService.createCustomConversation(participants);
                return newConversation._id.toString();
            }
        } catch (error) {
            console.error('Error getting/creating admin conversation:', error);
            throw error;
        }
    }
    
    // Allow admins to list recent violations
    @SubscribeMessage('getViolations')
    async handleGetViolations(
        @MessageBody() data: { limit?: number; offset?: number; userId?: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Check if sender is admin
            const isAdmin = await this.isUserAdmin(client.data.user._id.toString());
            if (!isAdmin) {
                client.emit('error', {
                    message: 'Unauthorized. Only admins can access violations.',
                    type: 'permission_denied'
                });
                return;
            }
            
            const violations = [];
            if (data.userId) {
                // Get violations for specific user
                const violationKeys = await this.redisClient.lrange(`user:violations:${data.userId}`, 
                    data.offset || 0, 
                    (data.offset || 0) + (data.limit || 20) - 1);
                
                // Get violation details
                for (const key of violationKeys) {
                    const violationData = await this.redisClient.get(key);
                    if (violationData) {
                        violations.push(JSON.parse(violationData));
                    }
                }
            } else {
                // Get all recent violations (would need a separate index in a real system)
                // This is simplified - in a real system you'd likely use database queries
                const keys = await this.redisClient.keys('violations:*');
                const sortedKeys = keys.sort().reverse().slice(
                    data.offset || 0,
                    (data.offset || 0) + (data.limit || 20)
                );
                
                for (const key of sortedKeys) {
                    const violationData = await this.redisClient.get(key);
                    if (violationData) {
                        violations.push(JSON.parse(violationData));
                    }
                }
            }
            
            client.emit('violationsData', violations);
        } catch (error) {
            console.error('Error getting violations:', error);
            client.emit('error', { message: 'Failed to get violations' });
        }
    }
    
    // Mark violation as resolved
    @SubscribeMessage('resolveViolation')
    async handleResolveViolation(
        @MessageBody() data: { violationKey: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Check if sender is admin
            const isAdmin = await this.isUserAdmin(client.data.user._id.toString());
            if (!isAdmin) {
                client.emit('error', {
                    message: 'Unauthorized. Only admins can resolve violations.',
                    type: 'permission_denied'
                });
                return;
            }
            
            // Get violation data
            const violationData = await this.redisClient.get(data.violationKey);
            if (!violationData) {
                client.emit('error', {
                    message: 'Violation not found or expired',
                    type: 'not_found'
                });
                return;
            }
            
            // Update violation as resolved
            const violation = JSON.parse(violationData);
            violation.resolved = true;
            violation.resolvedBy = client.data.user._id;
            violation.resolvedAt = Date.now();
            
            // Save updated violation
            await this.redisClient.set(data.violationKey, JSON.stringify(violation), 'KEEPTTL');
            
            client.emit('violationResolved', violation);
        } catch (error) {
            console.error('Error resolving violation:', error);
            client.emit('error', { message: 'Failed to resolve violation' });
        }
    }
    
    // Broadcast message to all users (admin only)
    @SubscribeMessage('broadcastAdminMessage')
    async handleBroadcastAdminMessage(
        @MessageBody() data: { content: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Check if sender is admin
            const isAdmin = await this.isUserAdmin(client.data.user._id.toString());
            if (!isAdmin) {
                client.emit('error', {
                    message: 'Unauthorized. Only admins can broadcast messages.',
                    type: 'permission_denied'
                });
                return;
            }
            
            // Get all users
            const allUsers = await this.authService.getAllUsers();
            
            // Admin info
            const adminId = client.data.user._id.toString();
            const adminInfo = {
                username: client.data.user.username,
                avatar: client.data.user.avatar || '',
                _id: adminId
            };
            
            // Track success and failures
            const results = {
                total: allUsers.length,
                success: 0,
                failed: 0,
                users: []
            };
            
            // Send to each user
            for (const user of allUsers) {
                try {
                    // Skip sending to admin themselves
                    if (user._id.toString() === adminId) {
                        continue;
                    }
                    
                    // Create or get conversation with user
                    const conversationId = await this.getOrCreateAdminConversation(adminId, user._id.toString());
                    
                    // Create message
                    const message = await this.chatService.createMessage({
                        conversationId,
                        sender: adminInfo,
                        content: data.content,
                        type: 'text',
                        status: 'sent',
                    });
                    
                    // Update conversation's last message
                    const updatedConversation = await this.chatService.getConversationById(conversationId);
                    if (updatedConversation) {
                        // Just emit the conversation without modifying lastMessage
                        
                        // Notify user if they're online
                        const socketId = await this.redisClient.get(`user:socket:${user._id}`);
                        if (socketId) {
                            this.server.to(socketId).emit('newMessage', message);
                            this.server.to(socketId).emit('updateConversation', updatedConversation);
                        }
                    }
                    
                    results.success++;
                    results.users.push({
                        username: user.username,
                        userId: user._id.toString(),
                        status: 'success'
                    });
                    
                } catch (userError) {
                    console.error(`Error sending broadcast to user ${user.username}:`, userError);
                    results.failed++;
                    results.users.push({
                        username: user.username,
                        userId: user._id.toString(),
                        status: 'failed',
                        error: userError.message
                    });
                }
            }
            
            // Send result summary to admin
            client.emit('broadcastResults', results);
            
            return results;
        } catch (error) {
            console.error('Error broadcasting admin message:', error);
            client.emit('error', { message: 'Failed to broadcast message' });
        }
    }
    
    // Check if message contains spam patterns
    private isSpamMessage(content: string): boolean {
        return this.spamPatterns.some(pattern => pattern.test(content));
    }
    
    // Send system message to a user
    private async sendSystemMessage(userId: string, content: string) {
        try {
            // Find or create system conversation with user
            const systemConversationId = await this.getOrCreateSystemConversation(userId);
            
            // Get the real system user from database to ensure we have latest data
            const systemUserInfo = await this.authService.getUserByUsername(this.systemUser.username);
            if (!systemUserInfo) {
                throw new Error('System Admin user not found in database');
            }
            
            // Use real system user data from database
            const systemSender = {
                username: systemUserInfo.username,
                avatar: systemUserInfo.avatar || this.systemUser.avatar,
                _id: systemUserInfo._id
            };
            
            // Create system message
            const message = await this.chatService.createMessage({
                conversationId: systemConversationId,
                sender: systemSender,
                content: content,
                type: 'text',
                status: 'sent',
            });
            
            // Send to the user
            const socketId = await this.redisClient.get(`user:socket:${userId}`);
            if (socketId) {
                this.server.to(socketId).emit('newMessage', message);
                
                // Also update conversation list
                const updatedConversation = await this.chatService.getConversationById(systemConversationId);
                if (updatedConversation) {
                    // Just emit the conversation without modifying lastMessage
                    this.server.to(socketId).emit('updateConversation', updatedConversation);
                }
            }
        } catch (error) {
            console.error('Error sending system message:', error);
        }
    }
    
    // Get or create a system conversation with a user
    private async getOrCreateSystemConversation(userId: string): Promise<string> {
        try {
            // First, try to find an existing system conversation
            const userInfo = await this.authService.getUserInfo(userId);
            if (!userInfo) {
                throw new Error(`User with ID ${userId} not found`);
            }
            
            // Get the real system user from database
            const systemUserInfo = await this.authService.getUserByUsername(this.systemUser.username);
            if (!systemUserInfo) {
                throw new Error('System Admin user not found in database');
            }
            
            const conversations = await this.chatService.getConversations(userId, 100, 0);
            
            // Look for a conversation where one participant is the system user
            for (const conv of conversations) {
                if (conv.participants.some(p => p._id === systemUserInfo._id)) {
                    return conv._id.toString();
                }
            }
            
            // If no system conversation exists, create one using standard methods since System user exists in DB
            const conversation = await this.chatService.createConversation(
                this.systemUser.username,
                userInfo.username
            );
            
            return conversation._id.toString();
        } catch (error) {
            console.error('Error getting/creating system conversation:', error);
            throw error;
        }
    }
}
