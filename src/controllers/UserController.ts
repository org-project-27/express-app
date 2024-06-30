import {$callToAction, $sendResponse} from "#helpers/methods";
import {Request, Response} from 'express';
import {Controller} from "#types/controller";
import {validateEmail, validateFullName, validatePasswordStrength, validRequiredFields} from "#helpers/inputValidation";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {trimObjectValues, $filterObject} from "#helpers/generalHelpers";
import {$logged} from "#helpers/logHelpers";
import bcrypt from "bcrypt";
import statusCodes from "#assets/constants/statusCodes";
import TokenSession from "#controllers/TokenSessionController";
import {$sendEmail} from "#helpers/emailHelper";
import {JwtPayload} from "jsonwebtoken";
import {available_email_langs} from "#assets/constants/language";
import moment from "moment";

class UserController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);

        this.actions['GET']['/auth'] = this.auth;
        this.actions['GET']['/logout'] = this.logout;
        this.actions['GET']['/confirm_email'] = this.confirmEmail;
        this.actions['GET']['/reset_password'] = this.checkResetPasswordToken;

        this.actions['POST']['/login'] = this.login;
        this.actions['POST']['/signup'] = this.signup;
        this.actions['POST']['/token'] = this.refreshToken;
        this.actions['POST']['/forgot_password'] = this.forgotPassword;
        this.actions['POST']['/reset_password'] = this.resetPassword;

        this.actions['PATCH']['/preferred_lang'] = this.setPreferredLang;
    }

    public auth = async () => {
        try {
            const authentication_result = JSON.parse(this.reqBody.authentication_result);
            const {user_id} = authentication_result.payload;
            let user = await this.database.users.findFirst({
                where: {
                    id: user_id
                },
                include: {
                    UserDetails: true,
                    Brands: {
                        include: {
                            PlacesList: true
                        }
                    }
                }
            });
            if (!user) {
                $logged(
                    `Auth progress failed`,
                    false,
                    {file: __filename.split('/src')[1], user_id},
                    this.request.ip,
                    true
                );
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_TOKEN,
                    statusCodes.FORBIDDEN
                )
            }
            let details = user.UserDetails || {};
            let brands = user.Brands || {};
            user = $filterObject(user, ['fullname', 'email']);
            details = $filterObject(details, ['user_id'], { reverse: true });
            return $sendResponse.success({
                user_id,
                details: {
                    ...user,
                    ...details
                },
                brands
            }, this.response, apiMessageKeys.DONE, statusCodes.OK);
        } catch (error: any) {
            $logged(
                `Auth progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]},
                this.request.ip,
                true
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    };
    public logout = async () => {
        try {
            const sessions = new TokenSession(this.request, this.response);
            const authentication_result = JSON.parse(this.reqBody.authentication_result);
            const {session} = authentication_result;
            await sessions.kill(session.id);
            await this.database.tokenSessions.findFirst({
                where: {
                    owner_id: session.owner_id,
                    created_for: 'refresh_token'
                }
            }).then(async (refreshTokenSession: any) => {
                if (refreshTokenSession) await sessions.kill(refreshTokenSession.id);
            });
            $logged(
                `LOGOUT REQUEST`,
                true,
                {file: __filename.split('/src')[1], user_id: session.owner_id},
                this.request.ip, true
            );
            return $sendResponse.success({}, this.response)
        } catch (error: any) {
            $logged(
                `Logout progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]}
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public confirmEmail = async () => {
        try {
            // step #1: Check required fields
            const required_fields = validRequiredFields(['token'], this.reqQuery);
            if (required_fields.length) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                );
            } else if (this.reqQuery.token) {
                const sessions = new TokenSession(this.request, this.response);
                // step #2 Verify confirm email token
                await sessions.verify(
                    'confirm_email',
                    this.reqQuery.token
                ).then(async (result) => {
                    const payload: any = result.payload;
                    const session: any = result.session;
                    // step #3: Check there is an email like that
                    const emailExist = await this.database.users.findFirst({
                        where: {
                            id: session.owner_id,
                            email: payload.email
                        }
                    });
                    if (emailExist) {
                        await this.database.userDetails.update({
                            where: {
                                user_id: session.owner_id,
                            },
                            data: {
                                email_registered: true
                            }
                        }).then(async () => {
                            await sessions.kill(session.id);
                            return $sendResponse.success(
                                {},
                                this.response,
                                apiMessageKeys.DONE,
                                statusCodes.ACCEPTED
                            );
                        })
                    } else {
                        throw new Error(`There is no register data ${payload.email} for user_id:${session.owner_id}`);
                    }
                }).catch((error: any) => {
                    $logged(
                        `Email confirming progress failed:\n${error}`,
                        false,
                        {file: __filename.split('/src')[1]},
                        this.request.ip, true
                    );

                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.LINK_EXPIRED,
                        statusCodes.FORBIDDEN
                    )
                });

            }
        } catch (error: any) {
            $logged(
                `Email confirming progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]},
                this.request.ip, true
            );

            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public checkResetPasswordToken = async () => {
        try {
            // step #1: Check required fields
            const required_fields = validRequiredFields(['token'], this.reqQuery);
            if (required_fields.length) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                );
            } else if (this.reqQuery.token) {
                const sessions = new TokenSession(this.request, this.response);
                // step #2 Verify reset password token
                await sessions.verify(
                    'reset_password',
                    this.reqQuery.token
                ).then(async (result) => {
                    const payload: any = result.payload;
                    const session: any = result.session;
                    // step #3: Check there is a user like that
                    const targetUser = await this.database.users.findFirst({
                        where: {
                            password: payload.key,
                            id: session.owner_id
                        }
                    });
                    if (targetUser) {
                        return $sendResponse.success(
                            {},
                            this.response,
                            apiMessageKeys.DONE,
                            statusCodes.ACCEPTED
                        );
                    } else {
                        //await sessions.kill(session.id);
                        throw new Error(`There is no registered user with user_id:${session.owner_id}`);
                    }
                }).catch((error: any) => {
                    $logged(
                        `Verify reset password progress failed:\n${error}`,
                        false,
                        {file: __filename.split('/src')[1]}
                    );

                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.LINK_EXPIRED,
                        statusCodes.FORBIDDEN
                    );
                });

            }
        } catch (error: any) {
            $logged(
                `Check reset password progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]}
            );

            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public login = async () => {
        const payload = trimObjectValues(this.reqBody);
        try {
            // step #1: Check required fields is filled
            const validationRequiredFields = validRequiredFields(['email', 'password'], payload);
            if (validationRequiredFields.length) {
                return $sendResponse.failed(
                    {required_fields: validationRequiredFields},
                    this.response,
                    apiMessageKeys.USER_LOGIN_PROGRESS_FAILED,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #2: Validate email string
            if (!validateEmail(payload.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #3: Validate password strength
            if (validatePasswordStrength(payload.password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #4: Check email is exist
            const existUser = await this.database.users.findFirst({where: {email: payload.email}});
            if (!existUser || !existUser.id) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.EMAIL_OR_PASSWORD_INCORRECT,
                    statusCodes.UNAUTHORIZED
                );
            }

            // step #5: Check hashed password
            const bcryptResult = await bcrypt.compare(payload.password, existUser.password);
            if (!bcryptResult) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.EMAIL_OR_PASSWORD_INCORRECT,
                    statusCodes.UNAUTHORIZED
                );
            }
            // step #6: Create access token
            const session = new TokenSession(this.request, this.response);
            const access_token = await session.create(
                existUser.id,
                'access_token',
                {user_id: existUser.id}
            );
            const refresh_token = await session.create(
                existUser.id,
                'refresh_token',
                {user_id: existUser.id, access_token_session: access_token.session_id}
            );
            $logged(`NEW LOGIN FROM USER_ID: ${existUser.id}`,
                true,
                {file: __filename.split('/src')[1]},
                this.request.ip, true);
            return $sendResponse.success(
                {
                    access_token: access_token.token,
                    refresh_token: refresh_token.token,
                    expires_in: access_token.expired_in
                },
                this.response,
                apiMessageKeys.USER_SUCCESSFULLY_LOGIN,
                statusCodes.OK
            );
        } catch (error: any) {
            $logged(
                `Login progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]},
                this.request.ip, true
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public signup = async () => {
        const payload = trimObjectValues(this.reqBody);
        const sessions = new TokenSession(this.request, this.response);
        try {
            // step #1: Check required fields is filled
            const validationRequiredFields = validRequiredFields(['email', 'fullname', 'password'], payload);
            if (validationRequiredFields.length) {
                return $sendResponse.failed(
                    {required_fields: validationRequiredFields},
                    this.response,
                    apiMessageKeys.USER_REGISTRATION_FAILED,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #2: Validate email string
            if (!validateEmail(payload.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #3: Check is email already exist
            const emailExist = await this.database.users.findFirst({
                where: {
                    email: payload.email
                }
            });

            if (emailExist) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.EMAIL_IS_EXIST,
                    statusCodes.CONFLICT
                );
            }

            // step #4: Validate password strength
            if (validatePasswordStrength(payload.password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.BAD_REQUEST
                );
            }

            // step #5: Validate fullname string
            if (!validateFullName(payload.fullname)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_FULLNAME,
                    statusCodes.BAD_REQUEST
                );
            }

            const hash_password = await bcrypt.hash(
                payload.password,
                Number(process.env.HASH_LIMIT) || 10
            );

            await this.database.users.create({
                data: {
                    fullname: payload.fullname,
                    email: payload.email,
                    password: hash_password,
                    register_date: moment().format('DD.MM.YYYY:HH:mm:ss'),
                    UserDetails: {
                        create: {
                            email_registered: false,
                            preferred_lang: payload.preferred_lang
                        }
                    }
                }
            }).then(async (result) => {
                const {token} = await sessions.create(
                    result.id,
                    'confirm_email',
                    {
                        email: result.email
                    });

                const appDomain: any = process.env.APP_BRAND_DOMAIN;
                const confirm_link: any = `www.${appDomain.toLowerCase()}/confirm_email?token=${token}`;

                await $sendEmail(payload.email, payload.preferred_lang)["@noreply"].confirmEmail({
                    full_name: payload.fullname,
                    confirm_link,
                    confirm_link_life_hour: TokenSession.tokenLifeHours.confirm_email
                })

                $logged(
                    `\n🛎️ NEW USER REGISTERED "${result.fullname} | ${result.email}"\n`,
                    true,
                    {file: __filename.split('/src')[1], user_id: result.id},
                    this.request.ip,
                    true
                );

                return $sendResponse.success(
                    {},
                    this.response,
                    apiMessageKeys.USER_SUCCESSFULLY_REGISTERED,
                    statusCodes.CREATED,
                    {count: result.id}
                );
            }).catch((error: any) => {
                $logged(
                    `Registration progress failed\n${error}`,
                    false,
                    {file: __filename.split('/src')[1], payload},
                    this.request.ip,
                    true
                );

                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.USER_REGISTRATION_FAILED,
                    statusCodes.BAD_REQUEST
                );
            })

        } catch (error: any) {
            $logged(
                `Registration progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]},
                this.request.ip,
                true
            );

            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public refreshToken = () => {
        this.response.send('refreshToken SERVICE')
    }
    public forgotPassword = async () => {
        try {
            // step #1: Check required field
            const required_fields = validRequiredFields(['email'], this.reqBody);
            if (required_fields.length) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                );
            }
            // step #2: Validate email string
            if (!validateEmail(this.reqBody.email)) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.BAD_REQUEST
                );
            }
            // step #3: Check email is exist on db
            const emailExist: any = await this.database.users.findFirst({
                where: {
                    email: this.reqBody.email
                },
                include: {
                    UserDetails: true
                }
            });
            if (!emailExist || !emailExist.UserDetails) {
                return $sendResponse.success(
                    {},
                    this.response,
                    apiMessageKeys.PASSWORD_RESET_LINK_WILL_SENT,
                    statusCodes.OK
                );
            }

            // step #4: Creat and send confirm link
            const sessions = new TokenSession(this.request, this.response);
            const {token} = await sessions.create(
                emailExist.id,
                'reset_password',
                {
                    key: emailExist.password
                }
            );
            const appDomain: any = process.env.APP_BRAND_DOMAIN;
            const reset_link = `www.${appDomain.toLowerCase()}/reset_password?token=${token}`;

            await $sendEmail(this.reqBody.email, emailExist.UserDetails.preferred_lang)["@noreply"].resetPassword({
                reset_link,
                reset_link_life_hour: TokenSession.tokenLifeHours.reset_password,
                full_name: emailExist.fullname,
            }).then(() => {
                $logged(
                    `🔑 Reset password request`,
                    true,
                    {file: __filename.split('/src')[1], user_id: emailExist.id, email: this.reqBody.email},
                    this.request.ip,
                    true
                );
                return $sendResponse.success(
                    {},
                    this.response,
                    apiMessageKeys.PASSWORD_RESET_LINK_WILL_SENT,
                    statusCodes.OK
                );
            }).catch((error: any) => {
                throw error;
            })
        } catch (error: any) {
            $logged(
                `Forgot password progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]},
                this.request.ip,
                true
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public resetPassword = async () => {
        try {
            // step #1: Check required fields
            const required_fields = validRequiredFields(['new_password', 'token'], this.reqBody);
            if (required_fields.length) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                );
            }
            // step #2: Validate password strength
            if (validatePasswordStrength(this.reqBody.new_password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.BAD_REQUEST
                );
            }

            const sessions = new TokenSession(this.request, this.response);
            // step #3 Verify reset password token
            await sessions.verify(
                'reset_password',
                this.reqBody.token
            )
                .then(async (result) => {
                const payload: any = result.payload;
                const session: any = result.session;
                // step #3: Check there is a user like that
                const targetUser: any = await this.database.users.findFirst({
                    where: {
                        password: payload.key,
                        id: session.owner_id
                    },
                    include: {
                        UserDetails: true
                    }
                });
                if (targetUser) {
                    // this is make the link is one time reachable link
                    const hash_password = await bcrypt.hash(
                        this.reqBody.new_password,
                        Number(process.env.HASH_LIMIT) || 10
                    );
                    await this.database.users.update({
                        where: {
                            id: targetUser.id
                        },
                        data: {
                            password: hash_password
                        }
                    }).then(async () => {
                        $logged(
                            `🔐 Password changed`,
                            true,
                            {file: __filename.split('/src')[1], user_id: targetUser.id},
                            this.request.ip,
                            true
                        );
                        await $sendEmail(targetUser.email, targetUser.UserDetails.preferred_lang)["@noreply"].passwordUpdated({
                            full_name: targetUser.fullname,
                            update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                            browser: this.request.useragent?.browser || '--',
                            os: this.request.useragent?.os || '--',
                            platform: this.request.useragent?.platform || '--',
                        });
                        return $sendResponse.success(
                            {},
                            this.response,
                            apiMessageKeys.PASSWORD_SUCCESSFULLY_CHANGED,
                            statusCodes.OK
                        );
                    }).catch((error: any) => {
                        $logged(
                            `Password changing failed for.\n${error}`,
                            false,
                            {file: __filename.split('/src')[1], user_id: targetUser.id},
                            this.request.ip,
                            true
                        );
                        throw error;
                    }).finally(async () => await sessions.kill(session.id));
                } else {
                    throw new Error(`User cannot found at this moment`);
                }
            })
                .catch((error: any) => {
                $logged(
                    `Verify reset password progress failed:\n${error}`,
                    false,
                    {file: __filename.split('/src')[1]},
                );

                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.LINK_EXPIRED,
                    statusCodes.FORBIDDEN
                );
            });
        } catch (error: any) {
            $logged(
                `Check reset password progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]}
            );

            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    public setPreferredLang = async () => {
        try {
            const authentication_result = JSON.parse(this.reqBody.authentication_result);
            const {user_id} = authentication_result.payload;
            const required_fields = validRequiredFields(['lang'], this.reqBody);
            if (required_fields.length) {
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                )
            }
            const {lang} = this.reqBody;
            if (!available_email_langs.includes(lang)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.BAD_REQUEST
                )
            }

            await this.database.userDetails.update({
                where: {
                    user_id,
                },
                data: {
                    preferred_lang: lang
                }
            })

            return $sendResponse.success({}, this.response);

        } catch (error: any) {
            $logged(
                `Set preferred language progress failed:\n${error}`,
                false,
                {file: __filename.split('/src')[1]}
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
}

export default $callToAction(UserController)
