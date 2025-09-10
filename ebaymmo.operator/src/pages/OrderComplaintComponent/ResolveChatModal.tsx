import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { OrderComplaint } from '@/types/order';
import { useUserInfo } from '@/context/UserInfoContext';
import Avatar from '@/assets/images/avatar.svg';
import useChatSDK from '@/hooks/useChatSDK';
import { IDataTokenDecode } from '@/types/global.type';
import { jwtDecode } from 'jwt-decode';

interface Participant {
    id: string;
    username: string;
    image: string;
}

interface ResolveChatModalProps {
    complaint: OrderComplaint;
    onCreateChat: (participants: string[]) => void;
}

const ResolveChatModal = ({ complaint }: ResolveChatModalProps) => {
    const [open, setOpen] = useState(false);
    const { userInfo } = useUserInfo();
    const token = localStorage.getItem('accessToken');
    const userId = token
        ? jwtDecode<IDataTokenDecode>(token)['https://hasura.io/jwt/claims'][
              'X-Hasura-User-Id'
          ]
        : null;

    const [selectedUsers, setSelectedUsers] = useState<string[]>(
        userId ? [userId] : []
    );
    const navigate = useNavigate();
    const { createGroupConversation, socket } = useChatSDK(
        localStorage.getItem('accessToken')
    );

    const buyer = complaint.user?.username || 'Buyer';
    const seller = complaint.product?.store?.user?.username || 'Seller';
    const buyerId = complaint.buyerId;
    const sellerId = complaint.product?.store?.sellerId;

    // Logs các ID để dễ kiểm tra
    useEffect(() => {}, [userInfo, userId, selectedUsers]);

    // Gather participant information
    const participants = useMemo(() => {
        const buyerInfo: Participant = {
            id: complaint.user?.userId || '',
            username: complaint.user?.username || 'Buyer',
            image: complaint.user?.images || Avatar
        };

        const sellerInfo: Participant = {
            id: complaint.product?.store?.sellerId || '',
            username: complaint.product?.store?.user?.username || 'Seller',
            image: complaint.product?.store?.user?.images || Avatar
        };

        const operatorInfo = {
            id: userId || '',
            username: 'Operator',
            image: userInfo?.images || Avatar
        };
        return [buyerInfo, sellerInfo, operatorInfo];
    }, [buyerId, sellerId, buyer, seller, userInfo, complaint, userId]);

    // Logs socket info when component mounts
    useEffect(() => {
        if (socket) {
            console.log('Socket đã được kết nối:', socket.connected);
            // Listen for errors
            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            // Listen for the specific event
            socket.on('newGroupConversation', (conversation) => {
                console.log('Nhận được nhóm chat mới:', conversation);
            });

            return () => {
                socket.off('error');
                socket.off('newGroupConversation');
            };
        } else {
            console.log('Socket chưa được kết nối');
        }
    }, [socket, userInfo]);

    const handleCreateGroupChat = () => {
        // Lọc participants dựa trên selectedUsers
        const selectedParticipants = participants.filter(
            (p) => p.id && selectedUsers.includes(p.id) && p.id.trim() !== ''
        );
        if (selectedParticipants.length < 2) {
            alert('Vui lòng chọn ít nhất hai người tham gia để tạo nhóm chat.');
            return;
        }

        // Kiểm tra kết nối socket
        if (!socket) {
            console.error(
                'Socket không được kết nối. Không thể tạo nhóm chat.'
            );
            alert('Không thể kết nối đến máy chủ chat. Vui lòng thử lại sau.');
            return;
        }

        // Chỉ lấy ID người dùng (không phải toàn bộ đối tượng)
        const participantIds = selectedParticipants.map((p) => p.id || '');

        // Lấy danh sách username để tạo tên nhóm
        const participantUsernames = selectedParticipants.map(
            (p) => p.username
        );

        // Sử dụng chức năng tự động tạo tên nhóm từ useChatSDK
        createGroupConversation(
            participantIds,
            complaint.orderCode,
            participantUsernames
        );
        console.log('Đã gửi yêu cầu tạo nhóm chat');

        // Đóng modal - Socket.io sẽ tự động tạo nhóm chat mới
        setOpen(false);

        // Lắng nghe sự kiện tạo nhóm chat thành công (trong thực tế)
        // Tuy nhiên, việc lắng nghe sự kiện đã được thiết lập trong useEffect
        // Ở đây, chúng ta chuyển hướng đến trang chatbox
        navigate('/admin/chatbox');
    };

    const handleCheckboxChange = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white">
                    Resolve
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Select users to create a group chat for resolving this
                        complaint
                    </p>

                    {buyerId && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="buyer"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedUsers.includes(buyerId)}
                                onChange={() => handleCheckboxChange(buyerId)}
                            />
                            <Label htmlFor="buyer" className="cursor-pointer">
                                {buyer} (Buyer)
                            </Label>
                        </div>
                    )}

                    {sellerId && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="seller"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedUsers.includes(sellerId)}
                                onChange={() => handleCheckboxChange(sellerId)}
                            />
                            <Label htmlFor="seller" className="cursor-pointer">
                                {seller} (Seller)
                            </Label>
                        </div>
                    )}

                    {userId && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="operator"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedUsers.includes(userId)}
                                onChange={() => handleCheckboxChange(userId)}
                            />
                            <Label
                                htmlFor="operator"
                                className="cursor-pointer"
                            >
                                {userInfo?.username || 'Operator'} (Operator)
                            </Label>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleCreateGroupChat}>
                        Create Chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ResolveChatModal;
