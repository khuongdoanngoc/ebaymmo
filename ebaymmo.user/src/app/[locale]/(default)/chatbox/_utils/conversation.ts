import { Conversation } from '../types/chatbox.types';

export const getOtherParticipant = (
    conversation: Conversation,
    currentUsername?: string | null
) => {
    if (conversation.type === 'self') {
        return conversation.participants[0];
    }
    return conversation.participants.find(
        (participant) => participant.username !== currentUsername
    );
};
