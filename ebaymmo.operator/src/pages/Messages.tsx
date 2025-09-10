import React, { useCallback, memo, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/toast';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Search, ArrowLeft, Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    message: string;
    createdAt: string;
    read: boolean;
}

interface ChatConversation {
    id: string;
    participantId: string;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

// For demo purposes - placeholder data if API is not yet implemented
const demoConversations: ChatConversation[] = [
    {
        id: '1',
        participantId: 'user1',
        participantName: 'Jane Cooper',
        participantAvatar: 'https://i.pravatar.cc/150?img=1',
        lastMessage: 'Hi, do you have the item in stock?',
        lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
        unreadCount: 2
    },
    {
        id: '2',
        participantId: 'user2',
        participantName: 'John Smith',
        participantAvatar: 'https://i.pravatar.cc/150?img=2',
        lastMessage: 'Thanks for the quick reply!',
        lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        unreadCount: 0
    },
    {
        id: '3',
        participantId: 'user3',
        participantName: 'Alex Johnson',
        participantAvatar: 'https://i.pravatar.cc/150?img=3',
        lastMessage: 'I would like to cancel my order.',
        lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(),
        unreadCount: 0
    },
    {
        id: '4',
        participantId: 'user4',
        participantName: 'Sarah Williams',
        participantAvatar: 'https://i.pravatar.cc/150?img=5',
        lastMessage: 'Is the discount code still valid for this item?',
        lastMessageTime: new Date(Date.now() - 30 * 60000).toISOString(),
        unreadCount: 1
    },
    {
        id: '5',
        participantId: 'user5',
        participantName: 'Michael Brown',
        participantAvatar: 'https://i.pravatar.cc/150?img=8',
        lastMessage: 'The package arrived today, thank you!',
        lastMessageTime: new Date(Date.now() - 8 * 3600000).toISOString(),
        unreadCount: 0
    },
    {
        id: '6',
        participantId: 'user6',
        participantName: 'Emily Davis',
        participantAvatar: 'https://i.pravatar.cc/150?img=9',
        lastMessage: 'When will the new models be available?',
        lastMessageTime: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        unreadCount: 0
    },
    {
        id: '7',
        participantId: 'user7',
        participantName: 'David Wilson',
        participantAvatar: 'https://i.pravatar.cc/150?img=12',
        lastMessage: "I've sent the payment confirmation",
        lastMessageTime: new Date(Date.now() - 15 * 60000).toISOString(),
        unreadCount: 3
    },
    {
        id: '8',
        participantId: 'user8',
        participantName: 'Lisa Taylor',
        participantAvatar: 'https://i.pravatar.cc/150?img=16',
        lastMessage: 'Do you offer international shipping?',
        lastMessageTime: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        unreadCount: 0
    }
];

const demoMessages: { [key: string]: ChatMessage[] } = {
    '1': [
        {
            id: 'm1',
            senderId: 'user1',
            receiverId: 'currentUser',
            message: 'Hi, do you have the item in stock?',
            createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm2',
            senderId: 'currentUser',
            receiverId: 'user1',
            message: 'Yes, we do have it available for immediate shipping.',
            createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm3',
            senderId: 'user1',
            receiverId: 'currentUser',
            message: 'Great! How long would shipping take?',
            createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm4',
            senderId: 'user1',
            receiverId: 'currentUser',
            message: 'And do you offer express shipping?',
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
            read: false
        }
    ],
    '2': [
        {
            id: 'm5',
            senderId: 'user2',
            receiverId: 'currentUser',
            message: 'Hello, I have a question about my recent purchase.',
            createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm6',
            senderId: 'currentUser',
            receiverId: 'user2',
            message: "I'd be happy to help. What's your order number?",
            createdAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm7',
            senderId: 'user2',
            receiverId: 'currentUser',
            message: 'Order #12345. I received the wrong color.',
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm8',
            senderId: 'currentUser',
            receiverId: 'user2',
            message:
                "I'm sorry about that. I'll check what happened and get back to you shortly.",
            createdAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm9',
            senderId: 'user2',
            receiverId: 'currentUser',
            message: 'Thanks for the quick reply!',
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            read: true
        }
    ],
    '3': [
        {
            id: 'm10',
            senderId: 'user3',
            receiverId: 'currentUser',
            message: 'I would like to cancel my order.',
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm11',
            senderId: 'currentUser',
            receiverId: 'user3',
            message:
                'I understand. Can you provide your order number so I can process the cancellation?',
            createdAt: new Date(Date.now() - 23.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm12',
            senderId: 'user3',
            receiverId: 'currentUser',
            message: 'Order #67890.',
            createdAt: new Date(Date.now() - 23 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm13',
            senderId: 'currentUser',
            receiverId: 'user3',
            message:
                "Thank you. I've processed the cancellation, and a refund will be issued within 3-5 business days.",
            createdAt: new Date(Date.now() - 22.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm14',
            senderId: 'user3',
            receiverId: 'currentUser',
            message: 'Thank you for the prompt service.',
            createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
            read: true
        }
    ],
    '4': [
        {
            id: 'm15',
            senderId: 'user4',
            receiverId: 'currentUser',
            message: 'Hello! I saw your summer promotion.',
            createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm16',
            senderId: 'currentUser',
            receiverId: 'user4',
            message:
                "Yes, we're running a special discount on all summer items!",
            createdAt: new Date(Date.now() - 38 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm17',
            senderId: 'user4',
            receiverId: 'currentUser',
            message: 'Is the discount code still valid for this item?',
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
            read: false
        }
    ],
    '5': [
        {
            id: 'm18',
            senderId: 'user5',
            receiverId: 'currentUser',
            message: 'I just wanted to let you know that I received my order.',
            createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm19',
            senderId: 'currentUser',
            receiverId: 'user5',
            message: "That's great to hear! Is everything in order?",
            createdAt: new Date(Date.now() - 9.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm20',
            senderId: 'user5',
            receiverId: 'currentUser',
            message:
                'Yes, everything is perfect. The quality is even better than I expected!',
            createdAt: new Date(Date.now() - 9 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm21',
            senderId: 'currentUser',
            receiverId: 'user5',
            message:
                "Wonderful! We're glad you're satisfied with your purchase.",
            createdAt: new Date(Date.now() - 8.5 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm22',
            senderId: 'user5',
            receiverId: 'currentUser',
            message: 'The package arrived today, thank you!',
            createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
            read: true
        }
    ],
    '6': [
        {
            id: 'm23',
            senderId: 'user6',
            receiverId: 'currentUser',
            message: "Hi, I'm interested in your new product line.",
            createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm24',
            senderId: 'currentUser',
            receiverId: 'user6',
            message:
                'Thank you for your interest! Our new collection is coming soon.',
            createdAt: new Date(Date.now() - 3.9 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm25',
            senderId: 'user6',
            receiverId: 'currentUser',
            message: 'When will the new models be available?',
            createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm26',
            senderId: 'currentUser',
            receiverId: 'user6',
            message:
                "We expect to launch the new models within the next two weeks. Would you like me to notify you when they're available?",
            createdAt: new Date(Date.now() - 2.9 * 24 * 3600000).toISOString(),
            read: true
        }
    ],
    '7': [
        {
            id: 'm27',
            senderId: 'user7',
            receiverId: 'currentUser',
            message: "Hello, I've just placed order #34567.",
            createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm28',
            senderId: 'currentUser',
            receiverId: 'user7',
            message: "Thank you for your order! We'll process it right away.",
            createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm29',
            senderId: 'user7',
            receiverId: 'currentUser',
            message:
                'Great! Just to confirm, I need the delivery by next Friday for an event.',
            createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm30',
            senderId: 'currentUser',
            receiverId: 'user7',
            message:
                "We should be able to deliver by then. I've marked your order as priority.",
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm31',
            senderId: 'user7',
            receiverId: 'currentUser',
            message: 'Perfect! Where should I send the payment?',
            createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm32',
            senderId: 'currentUser',
            receiverId: 'user7',
            message:
                'You can use the payment link in the order confirmation email.',
            createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
            read: true
        },
        {
            id: 'm33',
            senderId: 'user7',
            receiverId: 'currentUser',
            message: "I've sent the payment confirmation",
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            read: false
        }
    ],
    '8': [
        {
            id: 'm34',
            senderId: 'user8',
            receiverId: 'currentUser',
            message: "Hi, I'm from Australia and interested in your products.",
            createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm35',
            senderId: 'currentUser',
            receiverId: 'user8',
            message:
                "Hello! We're happy to hear from customers around the world.",
            createdAt: new Date(Date.now() - 5.9 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm36',
            senderId: 'user8',
            receiverId: 'currentUser',
            message: 'Do you offer international shipping?',
            createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm37',
            senderId: 'currentUser',
            receiverId: 'user8',
            message:
                'Yes, we ship to Australia! Shipping typically takes 7-10 business days, and shipping costs are calculated at checkout based on weight and destination.',
            createdAt: new Date(Date.now() - 4.9 * 24 * 3600000).toISOString(),
            read: true
        },
        {
            id: 'm38',
            senderId: 'user8',
            receiverId: 'currentUser',
            message: "That's great news! I'll place an order soon.",
            createdAt: new Date(Date.now() - 4.8 * 24 * 3600000).toISOString(),
            read: true
        }
    ]
};

// Format time helper function
const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return date.toLocaleDateString();
    }
};

// Memoized conversation item component to prevent unnecessary re-renders
const ConversationItem = memo(
    ({
        conversation,
        isSelected,
        onSelect
    }: {
        conversation: ChatConversation;
        isSelected: boolean;
        onSelect: (id: string) => void;
    }) => {
        const handleClick = useCallback(() => {
            onSelect(conversation.id);
        }, [conversation.id, onSelect]);

        return (
            <div
                className={`p-3 rounded-md cursor-pointer hover:bg-muted transition-colors flex gap-3 items-center ${
                    isSelected ? 'bg-muted' : ''
                }`}
                onClick={handleClick}
            >
                <div className="relative">
                    <img
                        src={conversation.participantAvatar}
                        alt={conversation.participantName}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3
                            className={`font-medium truncate ${conversation.unreadCount > 0 ? 'font-semibold' : ''}`}
                        >
                            {conversation.participantName}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageTime)}
                        </span>
                    </div>
                    <p
                        className={`text-sm truncate ${
                            conversation.unreadCount > 0
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {conversation.lastMessage}
                    </p>
                </div>
            </div>
        );
    }
);

// Memoized message component to prevent unnecessary re-renders
const MessageItem = memo(({ message }: { message: ChatMessage }) => {
    return (
        <div
            className={`flex ${message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[80%] md:max-w-[70%] rounded-lg p-2 md:p-3 ${
                    message.senderId === 'currentUser'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                }`}
            >
                <p className="text-sm md:text-base">{message.message}</p>
                <p className="text-[10px] md:text-xs mt-1 opacity-70">
                    {formatTime(message.createdAt)}
                </p>
            </div>
        </div>
    );
});

// Memoized conversations list component
const ConversationsList = memo(
    ({
        conversations,
        selectedId,
        onSelectConversation,
        searchQuery,
        onSearchChange,
        isMobileView
    }: {
        conversations: ChatConversation[];
        selectedId: string | null;
        onSelectConversation: (id: string) => void;
        searchQuery: string;
        onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        isMobileView: boolean;
    }) => {
        // Only show if not on mobile or no conversation is selected on mobile
        if (isMobileView && selectedId) return null;

        return (
            <div className="flex flex-col w-full md:w-1/3">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={onSearchChange}
                        />
                    </div>
                </div>

                <Card className="flex-1">
                    <CardHeader className="p-3 md:p-4 pb-2">
                        <CardTitle className="text-lg md:text-xl">
                            Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <ScrollArea className="h-[calc(100vh-14rem)]">
                            <div className="space-y-1">
                                {conversations.map((conversation) => (
                                    <ConversationItem
                                        key={conversation.id}
                                        conversation={conversation}
                                        isSelected={
                                            selectedId === conversation.id
                                        }
                                        onSelect={onSelectConversation}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        );
    }
);

// Memoized message input component to preserve focus
const MessageInput = memo(
    ({
        value,
        onChange,
        onSubmit,
        disabled
    }: {
        value: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onSubmit: (e: React.FormEvent) => void;
        disabled: boolean;
    }) => {
        return (
            <form onSubmit={onSubmit} className="p-3 md:p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={value}
                        onChange={onChange}
                        placeholder="Type a message..."
                        className="flex-1 text-sm md:text-base"
                    />
                    <Button
                        type="submit"
                        disabled={disabled}
                        size="icon"
                        className="md:hidden"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                    <Button
                        type="submit"
                        disabled={disabled}
                        className="hidden md:flex"
                    >
                        Send
                    </Button>
                </div>
            </form>
        );
    }
);

// Main Messages component
export default function Messages() {
    const queryClient = useQueryClient();
    const [selectedConversation, setSelectedConversation] = React.useState<
        string | null
    >(null);
    const [newMessage, setNewMessage] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Mock flag to simulate API data loading (set to true to use real API data when available)
    const [useRealApi] = React.useState(false);

    // Mobile view state
    const [showConversationOnMobile, setShowConversationOnMobile] =
        React.useState(false);

    // Handle conversation selection - memoized to prevent re-renders
    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversation(conversationId);
        // On mobile, show the conversation view
        setShowConversationOnMobile(true);
    }, []);

    // Handle back button on mobile - memoized to prevent re-renders
    const handleBackToList = useCallback(() => {
        setShowConversationOnMobile(false);
    }, []);

    // Handle search input change - memoized to prevent re-renders
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.target.value);
        },
        []
    );

    // Handle message input change - memoized to prevent re-renders
    const handleMessageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNewMessage(e.target.value);
        },
        []
    );

    // Fetch conversations
    const { data: apiConversations } = useQuery<ChatConversation[]>({
        queryKey: ['messages', 'conversations'],
        queryFn: () =>
            api.get('/messages/conversations').then((res) => res.data),
        enabled: useRealApi // Only enable this when API is ready
    });

    // Fetch messages for selected conversation
    const { data: apiMessages } = useQuery<ChatMessage[]>({
        queryKey: ['messages', 'conversation', selectedConversation],
        queryFn: () =>
            selectedConversation
                ? api
                      .get(`/messages/conversations/${selectedConversation}`)
                      .then((res) => res.data)
                : Promise.resolve([]),
        enabled: !!selectedConversation && useRealApi // Only enable when API is ready
    });

    // Send message mutation
    const sendMessage = useMutation({
        mutationFn: ({
            conversationId,
            message
        }: {
            conversationId: string;
            message: string;
        }) =>
            api.post(`/messages/conversations/${conversationId}`, { message }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setNewMessage('');
            toast({
                title: 'Success',
                description: 'Message sent successfully'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send message',
                variant: 'destructive'
            });
        }
    });

    // Mark conversation as read
    const markAsRead = useMutation({
        mutationFn: (conversationId: string) =>
            api.post(`/messages/conversations/${conversationId}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['messages', 'conversations']
            });
        }
    });

    // Local mock send message function (for demo without API)
    const handleMockSendMessage = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!selectedConversation || !newMessage.trim()) return;

            // In real implementation, we would call sendMessage.mutate here
            // For demo, just show a success toast and clear the input
            toast({
                title: 'Success',
                description: 'Message sent successfully (demo mode)'
            });
            setNewMessage('');
        },
        [selectedConversation, newMessage]
    );

    const handleSendMessage = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!selectedConversation || !newMessage.trim()) return;

            if (useRealApi) {
                sendMessage.mutate({
                    conversationId: selectedConversation,
                    message: newMessage.trim()
                });
            } else {
                handleMockSendMessage(e);
            }
        },
        [
            useRealApi,
            selectedConversation,
            newMessage,
            sendMessage,
            handleMockSendMessage
        ]
    );

    // Auto-scroll to bottom of messages
    React.useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [apiMessages, selectedConversation]);

    // Mark messages as read when conversation is selected
    React.useEffect(() => {
        if (selectedConversation && useRealApi) {
            markAsRead.mutate(selectedConversation);
        }
    }, [selectedConversation, useRealApi, markAsRead]);

    // Get conversations - either from API or demo data
    const conversations = useRealApi ? apiConversations : demoConversations;

    // Get messages for selected conversation - either from API or demo data
    const messages = useRealApi
        ? apiMessages
        : selectedConversation
          ? demoMessages[selectedConversation]
          : [];

    // Filter conversations by search query
    const filteredConversations = useMemo(() => {
        if (!conversations) return [];
        if (!searchQuery.trim()) return conversations;

        return conversations.filter((conversation) =>
            conversation.participantName
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    // Get selected conversation details
    const selectedConversationDetails = useMemo(() => {
        if (!selectedConversation || !filteredConversations) return null;
        return filteredConversations.find((c) => c.id === selectedConversation);
    }, [selectedConversation, filteredConversations]);

    // Check if we should show as mobile view (for components that need this info)
    const isMobileView = window.innerWidth < 768;

    // Rendered chat area component - memoized to prevent unnecessary re-renders
    const ChatArea = useMemo(() => {
        // Only show if there's a selected conversation or we're not on mobile view
        const shouldShow =
            !!selectedConversation &&
            (showConversationOnMobile || !isMobileView);

        if (!shouldShow) {
            return (
                <Card className="hidden md:flex flex-1 flex-col w-full">
                    <div className="flex-1 flex items-center justify-center flex-col p-4 md:p-6 text-center">
                        <div className="mb-4">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted-foreground mx-auto md:h-16 md:w-16"
                            >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-medium mb-2">
                            Your Messages
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground mb-4">
                            Select a conversation to start chatting
                        </p>
                    </div>
                </Card>
            );
        }

        return (
            <Card className={`flex-1 flex flex-col w-full`}>
                {/* Chat Header */}
                <CardHeader className="px-4 md:px-6 py-3 md:py-4 border-b">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2 md:hidden"
                            onClick={handleBackToList}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        {selectedConversationDetails && (
                            <div className="flex items-center flex-1">
                                <img
                                    src={
                                        selectedConversationDetails.participantAvatar
                                    }
                                    alt="User avatar"
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-3 object-cover"
                                />
                                <div>
                                    <CardTitle className="text-base md:text-lg">
                                        {
                                            selectedConversationDetails.participantName
                                        }
                                    </CardTitle>
                                    <CardDescription className="text-xs md:text-sm">
                                        Last active: Recently
                                    </CardDescription>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                        {messages &&
                            messages.map((message) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                />
                            ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Message Input */}
                <MessageInput
                    value={newMessage}
                    onChange={handleMessageChange}
                    onSubmit={handleSendMessage}
                    disabled={!newMessage.trim()}
                />
            </Card>
        );
    }, [
        selectedConversation,
        selectedConversationDetails,
        messages,
        newMessage,
        showConversationOnMobile,
        isMobileView,
        handleBackToList,
        handleMessageChange,
        handleSendMessage
    ]);

    return (
        <div className="p-3 md:p-6 h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-3 md:gap-6">
            {(!selectedConversation ||
                !showConversationOnMobile ||
                !isMobileView) && (
                <ConversationsList
                    conversations={filteredConversations}
                    selectedId={selectedConversation}
                    onSelectConversation={handleSelectConversation}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    isMobileView={isMobileView && showConversationOnMobile}
                />
            )}

            {(selectedConversation || !isMobileView) && ChatArea}
        </div>
    );
}
