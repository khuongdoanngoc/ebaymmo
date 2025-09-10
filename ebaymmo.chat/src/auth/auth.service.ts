import { getSdk } from '../sdk/sdk';
import { GraphQLClient } from 'graphql-request';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';

interface UserEventData {
    created_at: string;
    delivery_info: {
        current_retry: number;
        max_retries: number;
    };
    event: {
        data: {
            new: any;
            old: any;
        };
        op: 'UPDATE' | 'INSERT' | 'DELETE';
        session_variables: {
            'x-hasura-role': string;
        };
        trace_context: {
            sampling_state: string;
            span_id: string;
            trace_id: string;
        };
    };
    id: string;
    table: {
        name: string;
        schema: string;
    };
    trigger: {
        name: string;
    };
}

interface SearchUserQuery {
    username: string;
}

@Injectable()
export class AuthService {
    private sdk: ReturnType<typeof getSdk>;

    constructor(@InjectModel(User.name) private userModel: Model<User>) {
        const client = new GraphQLClient(process.env.CODEGEN_HASURA_ENDPOINT, {
            headers: {
                'x-hasura-admin-secret': process.env.CODEGEN_HASURA_GRAPHQL_ADMIN_SECRET,
            },
        });
        this.sdk = getSdk(client);
    }

    async fetchHasuraUsers(username: string) {
        try {
            const { users } = await this.sdk.MyQuery({
                where: {
                    username: { _eq: username },
                },
            });
            return users;
        } catch (error) {
            console.error(`Error fetching users: ${error.message}`);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
    }

    async findUsersByRole(role: string) {
        try {
            return await this.userModel.find({ role });
        } catch (error) {
            console.error(`Error finding users with role ${role}:`, error);
            return [];
        }
    }

    async getUserByUsername(username: string) {
        try {
            return await this.userModel.findOne({ username });
        } catch (error) {
            console.error(`Error finding user with username ${username}:`, error);
            return null;
        }
    }

    async createSystemUser(userData: { 
        _id: string;
        username: string;
        avatar: string;
        role: string;
    }) {
        try {
            const existingUser = await this.userModel.findOne({ 
                $or: [
                    { _id: userData._id },
                    { username: userData.username }
                ]
            });
            
            if (existingUser) {
                return await this.userModel.findByIdAndUpdate(
                    existingUser._id,
                    {
                        username: userData.username,
                        avatar: userData.avatar,
                        role: userData.role
                    },
                    { new: true }
                );
            }
            
            const systemUser = new this.userModel({
                _id: userData._id,
                username: userData.username,
                avatar: userData.avatar,
                role: userData.role,
            });
            
            await systemUser.save();
            return systemUser;
        } catch (error) {
            console.error('Error creating system user:', error);
            throw new Error(`Failed to create system user: ${error.message}`);
        }
    }

    async handleUpsertUser(userData: UserEventData) {
        try {
            // Validate input data
            this.validateUserData(userData);

            // Extract necessary information
            const { event } = userData;
            const { new: newData, old: oldData } = event.data;

            // Handle different operations
            switch (event.op) {
                case 'UPDATE':
                    return await this.handleUserUpdate(newData, oldData);
                case 'INSERT':
                    return await this.handleUserInsert(newData);
                case 'DELETE':
                    return await this.handleUserDelete(oldData);
                default:
                    throw new Error(`Unsupported operation: ${event.op}`);
            }
        } catch (error) {
            console.error('Error processing user upsert:', error);
            throw error;
        }
    }

    async handleSearchUser(query: SearchUserQuery) {
        try {
            if (!query) {
                throw new Error('Invalid search query');
            }
            const users = await this.userModel.find(
                { username: { $regex: query.username, $options: 'i' } },
                { _id: 1, username: 1, avatar: 1 }, // Chỉ lấy các trường này
            );
            return {
                status: 'success',
                data: users,
                count: users.length,
            };
        } catch (error) {
            console.error('Error searching users:', error);
            throw new Error(`Failed to search users: ${error.message}`);
        }
    }

    private validateUserData(userData: UserEventData) {
        if (!userData.event || !userData.event.data) {
            throw new Error('Invalid event data structure');
        }

        if (!userData.table || userData.table.name !== 'users') {
            throw new Error('Invalid table information');
        }
    }

    private async handleUserUpdate(newData: any, oldData: any) {
        const filter = { _id: newData.user_id };
        const mappedData = {
            _id: newData.user_id,
            username: newData.username,
            fullName: newData.full_name, // Chuyển full_name thành fullName
            avatar: newData.images,
        };
        const updatedUser = await this.userModel.updateOne(
            filter,
            { $set: mappedData },
            { upsert: true, new: true }, // tạo mới nếu không tìm thấy và trả về document sau khi update
        );

        return {
            status: 'success',
            message: 'User updated successfully',
            data: updatedUser,
        };
    }

    private async handleUserInsert(newData: any) {
        try {
            // Tạo object data từ newData
            const userData = {
                _id: newData.user_id, // Giả sử id từ PostgreSQL
                username: newData.username,
                fullName: newData.full_name,
                avatar: newData.images || '',
            };

            // Tạo new user hoặc update nếu đã tồn tại (upsert)
            const insertedUser = await this.userModel.findOneAndUpdate(
                { _id: userData._id },
                userData,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                },
            );

            return {
                status: 'success',
                message: 'User created successfully',
                data: insertedUser,
            };
        } catch (error) {
            console.error('Error inserting user:', error);
            throw new Error(`Failed to insert user: ${error.message}`);
        }
    }

    private async handleUserDelete(oldData: any) {
        try {
            const result = await this.userModel.deleteOne({
                _id: oldData.user_id,
            });

            if (result.deletedCount === 0) {
                throw new Error('User not found');
            }

            return {
                status: 'success',
                message: 'User deleted successfully',
                deletedCount: result.deletedCount,
            };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }

    async getUserInfo(userId: string) {
        const user = await this.userModel.findOne({ _id: userId });
        return user;
    }

    async getAllUsers() {
        try {
            // Lấy tất cả người dùng, ngoại trừ system user
            return await this.userModel.find({
                username: { $ne: 'system' }
            });
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
}
