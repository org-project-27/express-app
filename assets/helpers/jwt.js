import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';
import {config} from 'dotenv';

config();

const JWT_ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const JWT_REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const GOOGLE_AUTH_ID = process.env.GOOGLE_AUTH_ID;

export const generateTokens = async (user_id) => {
    const jwtId = uuidv4();
    const accessToken = await generateAccessToken(user_id.toString());
    const refreshToken = await generateRefreshToken(user_id.toString());

    return { accessToken, refreshToken };
}

export const generateAccessToken = async (userId) => {
    return jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
        jwtid: uuidv4(),
    });
}

export const generateRefreshToken = async (userId) => {
    const payload = {
        userId
    }

    return jwt.sign(payload, JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: '10d',
        jwtid: uuidv4(),
    });
}

export const generateGoogleAccessToken = async (user_id) => {
    const payload = {
        userId: user_id.toString(),
        googleId: GOOGLE_AUTH_ID
    }

    return jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: '2d',
    });
}

export const verifyAccessToken = async (token) => {
    return new Promise((resolve) => {
        jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if(err) return resolve(false);

            const { userId } = decoded;
            return userId;
        });
    });
}