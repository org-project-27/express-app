import jwt from 'jsonwebtoken';
import {config} from 'dotenv';
import UserModel from "../../db/models/user.model.js";
import TokenSessions from "../../db/models/tokenSessions.js";

config();

const JWT_ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const JWT_ACCESS_TOKEN_LIFE = Number(process.env.ACCESS_TOKEN_LIFE);

export const $createTokenSession = async function (userId, createdFor = 'unnamed_session', payload = {}, expiresIn = JWT_ACCESS_TOKEN_LIFE) {
    const session = {
        owner_id: null,
        created_for: null,
        token: null,
        payload: null,
        expired_at: null
    };

    let sessionId;

    const user = await UserModel.model.findByPk(userId);

    if(user){
        session.owner_id = userId;
        session.created_for = createdFor;
        session.token = jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET, { expiresIn });
        session.payload = payload;
        session.expired_at = expiresIn;

        const existSession = await $getTokenSession({
            owner_id: session.owner_id,
            created_for: createdFor
        });

        if(existSession){
            existSession['token'] = session.token;
            existSession['expired_at'] = session.expired_at;
            await existSession.save();
            sessionId = existSession.id;
        } else {
            sessionId = await TokenSessions.model.create(session);
        }
    }

    return {
        sessionId,
        token: session.token
    };
}

export const $getTokenSession = async function(by = {}){
    return await TokenSessions.model.findOne({
        where: { ...by }
    });
}

export const $verifyTokenSession = async function(created_for, token){
    let verify_result = null;
    let session_result = null;
    if(token){
        session_result = await $getTokenSession({ token, created_for });
        if(session_result) {
            await jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, async function (err, data) {
                if(err){
                    await $destroyTokenSessionByPk(session_result.id);
                } else {
                    verify_result = data;
                }
            });
        }
    }
    return {
        payload: verify_result,
        session: session_result
    };
};

export const $verifyTokenSessionBy = async function(token, by = {owner_id: null, created_for: null}){
    const {owner_id, created_for} = by;
    let verify_result = null;
    let session_result = null;
    if(owner_id && created_for && token){
        session_result = await $getTokenSession({ token });
        if(session_result
            && session_result.owner_id === owner_id
            && session_result.created_for === created_for) {
            await jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, function (err, data) {
                if(!err){
                    verify_result = data;
                }
            });
        }
    }
    return {
        payload: verify_result,
        session: session_result
    };
};

export const $destroyTokenSessionByPk = async function(session_id){
    if(session_id) {
        const result = await TokenSessions.model.findByPk(session_id);
        if(result) {
            return await TokenSessions.model.destroy({
                where: {
                    id: session_id
                }
            })
        }
    }
    return null;
}