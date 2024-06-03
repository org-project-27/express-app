import {Controller} from "#types/controller";
import jwt from "jsonwebtoken";
import {$logged} from "#helpers/generalHelpers";
import moment from "moment";
import {Request, Response} from "express";

type CreatedForTypes = 'access_token' | 'refresh_token' | 'confirm_email' | 'reset_password';
type SecretKeysTypes = {
    [key in CreatedForTypes | 'default']: string
}
type TokenLifeTypes = {
    [key in CreatedForTypes | 'default']: number
}
export default class TokenSessionController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);
    }

    private static secretKeys: SecretKeysTypes = {
        default: process.env.ACCESS_TOKEN_SECRET || 'undefined_secret_key',
        access_token: process.env.ACCESS_TOKEN_SECRET || 'undefined_secret_key',
        confirm_email: process.env.ACCESS_TOKEN_SECRET || 'undefined_secret_key',
        refresh_token: process.env.REFRESH_TOKEN_SECRET || 'undefined_secret_key',
        reset_password: process.env.ACCESS_TOKEN_SECRET || 'undefined_secret_key',

    }

    private static dayBySeconds(day: number): number {
        return (3600 * 24) * day;
    }

    private static tokenLifeSeconds: TokenLifeTypes = {
        default: 3600, // 1 hour,
        confirm_email: 3600, // 1 hour,
        access_token: TokenSessionController.dayBySeconds(7), // 7 day
        refresh_token: TokenSessionController.dayBySeconds(30), // 30 day,
        reset_password: TokenSessionController.dayBySeconds(30), // 30 day,
    }

    private static isDateExpired(date: string) {
        const now = moment();
        const dateToCheck = moment(date);

        return dateToCheck.isBefore(now);
    }

    public async create(ownerId: number, createdFor: CreatedForTypes, payload: object = {}) {
        const {secretKeys, tokenLifeSeconds} = TokenSessionController;
        const expiresIn = tokenLifeSeconds[createdFor] || tokenLifeSeconds.default;
        const expired_in = moment().add(expiresIn, 'seconds').format();

        try {
            const token = jwt.sign(payload, secretKeys[createdFor], {expiresIn});
            const existSession = await this.database.tokenSessions.findFirst({
                where: {
                    owner_id: ownerId,
                    created_for: createdFor
                }
            });
            const result = await this.database.tokenSessions.upsert({
                where: {
                    id: existSession?.id || 0,
                    owner_id: ownerId,
                    created_for: createdFor,
                },
                update: {
                    owner_id: ownerId,
                    created_for: createdFor,
                    payload,
                    expired_in,
                    token
                },
                create: {
                    owner_id: ownerId,
                    created_for: createdFor,
                    payload,
                    expired_in,
                    token
                }
            });
            $logged(
                `New token session created for "${createdFor}", (owner_id: ${ownerId})`.toUpperCase(),
                true,
                `token_session_controller`,
                this.request.ip
            )
            return {
                session_id: result.id,
                token,
                expired_in
            }
        } catch (error: any) {
            $logged(
                error,
                false,
                `token_session_controller`,
                this.request.ip
            )
            throw error;
        }
    }

    public async verify(createdFor: CreatedForTypes, token: string) {
        try {
            const {secretKeys, isDateExpired} = TokenSessionController;
            const session = await this.database.tokenSessions.findFirst({
                where: {
                    created_for: createdFor,
                    token
                }
            });
            if (session) {
                if (isDateExpired(session.expired_in)) {
                    await this.kill(session.id);
                    return null;
                }
                const payload = jwt.verify(token, secretKeys[createdFor]);
                return {session, payload};
            } else {
                return null
            }
        } catch (error: any) {
            $logged(
                error,
                false,
                `token_session_controller`,
                this.request.ip
            )
            throw error;
        }
    }

    public async kill(sessionId: number) {
        try {
            await this.database.tokenSessions.findFirst({
                where: {
                    id: sessionId
                }
            }).then(async (result) => {
                if (result) {
                    await this.database.tokenSessions.delete({
                        where: {
                            id: sessionId
                        }
                    });
                }
            })
        } catch (error: any) {
            $logged(
                error,
                false,
                `token_session_controller`,
                this.request.ip
            )
        }
    }

    public async dropAllExpiredSessions() {
        try {
            const {isDateExpired} = TokenSessionController;
            const sessions = await this.database.tokenSessions.findMany();
            for (const key in sessions){
                const session = sessions[key];
                if (isDateExpired(session.expired_in)) {
                    await this.kill(session.id)
                }
            }
            $logged(
                'All expired sessions dropped'.toUpperCase(),
                true,
                `token_session_controller`,
            )
        } catch (error: any) {
            $logged(
                error,
                false,
                `token_session_controller`,
                this.request.ip
            )
        }
    }
}