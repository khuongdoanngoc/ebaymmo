export type OrderComplaint = {
    orderId: string;
    orderStatus: string;
    orderCode: string;
    orderType: string;
    price: number;
    isPreOrder: boolean;
    orderDate: string;
    buyerId: string;
    productId: string;
    quantity: number;
    totalAmount: number;
    referralCode: string;
    createAt: string;
    updateAt: string;
    product?: {
        productName: string;
        productId: string;
        store: {
            sellerId: string;
            user: {
                username: string;
                images: string;
            };
        };
    };
    user?: {
        username: string;
        userId: string;
        images: string;
    };
    complainOrders: {
        complainId: string;
        image: string;
        content: string;
        orderId: string;
        createdAt: string;
        updatedAt: string;
    }[];
};

export type Order = {
    orderId: string;
    orderCode: string;
    orderDate: string;
    totalAmount: number;
    orderStatus: string;
    isPreOrder: boolean;
    user: {
        fullName: string;
        username: string;
    };
};
