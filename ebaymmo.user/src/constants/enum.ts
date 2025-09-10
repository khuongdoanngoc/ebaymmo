export enum CategoryType {
    Product = 'product',
    Service = 'service'
}

export enum BidStatus {
    Pending = 'pending',
    Won = 'won',
    Lost = 'lost'
}

export enum DepositStatus {
    Pending = 'pending',
    Completed = 'completed',
    Failed = 'failed'
}

export enum NotificationStatus {
    Seen = 'seen',
    Sent = 'sent',
    Received = 'received'
}

export enum ProductItemStatus {
    Sale = 'sale',
    NotSale = 'notsale',
    OutOfStock = 'outofstock',
    Discontinued = 'discontinued'
}

export enum ResellerStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}

export enum RoleRule {
    User = 'USER',
    Seller = 'SELLER',
    Admin = 'ADMIN'
}

export enum RoleTypeNew {
    Buyer = 'buyer',
    Seller = 'seller',
    Both = 'both'
}

export enum SaleStatus {
    Sale = 'sale',
    NotSale = 'notsale'
}

export enum SupportTicketStatus {
    Open = 'open',
    Closed = 'closed',
    Pending = 'pending'
}

export enum TransactionActionStatusEnum {
    Refund = 'refund',
    Pending = 'pending',
    Complete = 'complete',
    Cancel = 'cancel'
}

export enum TransactionStatus {
    Pending = 'pending',
    Completed = 'completed',
    Failed = 'failed'
}

export enum TransactionType {
    Payment = 'payment',
    Refund = 'refund'
}

export enum WithdrawalStatus {
    Pending = 'pending',
    Completed = 'completed',
    Canceled = 'canceled'
}

export enum NetworkCode {
    BSC = 'bsc',
    ETH = 'eth',
    TON = 'ton'
}

export enum ModeOrder {
    DATA = 'data',
    FEEDBACK = 'feedback',
    COMPLAIN = 'complain',
    CHAT = 'chat',
    VIEW_COMPLAIN = 'view_complain'
}

export enum ProductUploadLogStatus {
    Success = 'success',
    Failed = 'failed'
}
