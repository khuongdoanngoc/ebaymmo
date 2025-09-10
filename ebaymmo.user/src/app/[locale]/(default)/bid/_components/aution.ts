// types/auction.ts
export interface BidHistory {
    bidAmount: number | any; // Chấp nhận any để khớp với dữ liệu thực tế
    createAt?: string | any; // Thêm createAt và cho phép any
    username?: string;
    avatar?: string;
}
