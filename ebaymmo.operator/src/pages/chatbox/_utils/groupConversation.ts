import { Conversation } from '@/hooks/useChatSDK';

export const getGroupParticipants = (
    conversation: Conversation,
    currentUsername?: string | null
) => {
    if (conversation.type !== 'group') {
        throw new Error('This function is only for group conversations');
    }
    return conversation.participants.filter(
        (participant) => participant.username !== currentUsername
    );
};
