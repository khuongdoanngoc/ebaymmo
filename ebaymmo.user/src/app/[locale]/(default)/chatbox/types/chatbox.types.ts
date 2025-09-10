export interface Conversation {
    _id: string;
    type: string;
    participants: {
        _id: string;
        username: string;
        avatar: string;
    }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    lastMessage: {
        _id: string;
        senderId: string;
        content: string;
    };
}
