import {$callToAction, $sendResponse} from "#helpers/methods";
import {Request, Response} from 'express';
import {Controller} from "#types/controller";
import {validateEmail, validateFullName, validatePasswordStrength, validRequiredFields} from "#helpers/inputValidation";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {$logged, trimObjectValues, $filterObject} from "#helpers/generalHelpers";
import bcrypt from "bcrypt";
import statusCodes from "#assets/constants/statusCodes";
import TokenSession from "#controllers/TokenSessionController";
import {$sendEmail} from "#helpers/emailHelper";
import {JwtPayload} from "jsonwebtoken";
import {available_email_langs} from "#assets/constants/language";

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

        this.actions['PUT']['/preferred_lang'] = this.setPreferredLang;
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
                    UserDetails: true
                }
            });
            if (!user) {
                $logged(
                    `Login progress failed by user_id: ${user_id}`,
                    false,
                    {file: __filename.split('/src')[1]},
                    this.request.ip
                );
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_TOKEN,
                    statusCodes.BAD_REQUEST
                )
            }
            let details = user.UserDetails || {};
            details = $filterObject(details, ['user_id'], { reverse: true })
            user = $filterObject(user, ['fullname', 'email'])
            $sendResponse.success({
                user_id,
                details: {
                    ...user,
                    ...details
                }
            }, this.response, apiMessageKeys.DONE, statusCodes.OK);
        } catch (error: any) {
            $logged(
                error,
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
    public logout = async () => {
        try {
            const sessions = new TokenSession(this.request, this.response);
            const authentication_result = JSON.parse(this.reqBody.authentication_result);
            const { session } = authentication_result;
            await sessions.kill(session.id);
            await this.database.tokenSessions.findFirst({
                where: {
                    owner_id: session.owner_id,
                    created_for: 'refresh_token'
                }
            }).then(async (refreshTokenSession: any) => {
                await sessions.kill(refreshTokenSession.id);
            });
            $sendResponse.success({}, this.response)
            $logged(
                `LOGOUT USER_ID:${session.owner_id}`,
                true,
                {file: __filename.split('/src')[1]}
            );
        } catch (error: any) {
            $logged(
                error,
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
            const required_fields = validRequiredFields(['token'], this.request.query);
            if (required_fields.length) {
                return $sendResponse.failed(
                    { required_fields },
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.EXPECTATION_FAILED
                );
            } else if (this.request.query.token) {
                const sessions = new TokenSession(this.request, this.response);
                // step #2 Verify confirm email token
                await sessions.verify(
                    'confirm_email',
                    this.request.query.token
                ).then(async (result) => {
                    const payload: any = result.payload;
                    const session: any = result.session;
                    // step #3: Check there is a email like that
                    const emailExist = await this.database.users.findFirst({
                        where: {
                            id: payload.user_id,
                            email: payload.email
                        }
                    });
                    if(emailExist){
                        await this.database.userDetails.update({
                            where: {
                                user_id: payload.user_id,
                            },
                            data: {
                                email_registered: true
                            }
                        }).then(async () => {
                            await sessions.kill(session.id);
                            $sendResponse.success({}, this.response)
                        })
                    } else {
                        throw new Error(`There is no register data ${payload.email} for user_id:${payload.user_id}`);
                    }
                }).catch((error: any)=> {
                    $logged(
                        `Email confirming progress failed:\n${error}`,
                        false,
                        {file: __filename.split('/src')[1]}
                    );

                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_TOKEN,
                        statusCodes.BAD_REQUEST
                    )
                });

            }
        } catch (error: any) {
            $logged(
                `Email confirming progress failed:\n${error}`,
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
    public checkResetPasswordToken = () => {
        this.response.send('checkResetPasswordToken SERVICE')
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
                    statusCodes.EXPECTATION_FAILED
                );
            }

            // step #2: Validate email string
            if (!validateEmail(payload.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.EXPECTATION_FAILED
                );
            }

            // step #3: Validate password strength
            if (validatePasswordStrength(payload.password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.UNPROCESSABLE_ENTITY
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
                this.request.ip);
            $sendResponse.success(
                {
                    access_token: access_token.token,
                    refresh_token: refresh_token.token,
                    expires_in: access_token.expired_in
                },
                this.response,
                apiMessageKeys.USER_SUCCESSFULLY_LOGIN
            );
        } catch (error: any) {
            $logged(
                error,
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
                    statusCodes.EXPECTATION_FAILED
                );
            }

            // step #2: Validate email string
            if (!validateEmail(payload.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.EXPECTATION_FAILED
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
                    statusCodes.UNPROCESSABLE_ENTITY
                );
            }

            // step #4: Validate password strength
            if (validatePasswordStrength(payload.password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.UNPROCESSABLE_ENTITY
                );
            }

            // step #5: Validate fullname string
            if (!validateFullName(payload.fullname)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_FULLNAME,
                    statusCodes.UNPROCESSABLE_ENTITY
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
                    UserDetails: {
                        create: {
                            email_registered: false,
                            preferred_lang: payload.preferred_lang
                        }
                    }
                }
            }).then(async (result) => {
                const { token} = await sessions.create(
                    result.id,
                    'confirm_email',
                    {
                        user_id: result.id,
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
                    `New user registered, user_id: ${result.id}`,
                    true,
                    {file: __filename.split('/src')[1]},
                    this.request.ip
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
                    `Registration progress failed:\n${error}`,
                    false,
                    {file: __filename.split('/src')[1]}
                );

                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.USER_REGISTRATION_FAILED,
                    statusCodes.INTERNAL_SERVER_ERROR
                )
            })

        } catch (error: any) {
            $logged(
                `Registration progress failed:\n${error}`,
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
    public refreshToken = () => {
        this.response.send('refreshToken SERVICE')
    }
    public forgotPassword = () => {
        this.response.send('forgotPassword SERVICE')
    }
    public resetPassword = () => {
        this.response.send('resetPassword SERVICE')
    }
    public setPreferredLang = async () => {
        try {
            const authentication_result = JSON.parse(this.reqBody.authentication_result);
            const {user_id} = authentication_result.payload;
            const required_fields = validRequiredFields(['lang'], this.reqBody);
            if(required_fields.length){
                return $sendResponse.failed(
                    {required_fields},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.EXPECTATION_FAILED
                )
            }
            const { lang } = this.reqBody;
            if(!available_email_langs.includes(lang)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.EXPECTATION_FAILED
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

            $sendResponse.success({}, this.response);

        } catch (error: any) {
            $logged(
                error,
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
