import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();
        const secret = process.env.RESET_PASSWORD_JWT_SECRET;
        if (!secret) {
            throw new Error('JWT secret is not configured');
        }
        jwt.verify(token, secret);

        return NextResponse.json({ valid: true });
    } catch (error) {
        return NextResponse.json({ valid: false }, { status: 400 });
    }
}
