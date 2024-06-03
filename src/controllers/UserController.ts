import {$callToAction, $sendResponse} from "#helpers/methods";
import {Request, Response} from 'express';
import {Controller} from "#types/controller";
import {validateEmail, validateFullName, validatePasswordStrength, validRequiredFields} from "#helpers/inputValidation";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {$logged, trimObjectValues, $filterObject} from "#helpers/generalHelpers";
import bcrypt from "bcrypt";
import statusCodes from "#assets/constants/statusCodes";
import TokenSession from "#controllers/TokenSessionController";

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

    private auth = async () => {
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
                    `Login progress failed by user_id: ${user_id}`.toUpperCase(),
                    false,
                    'user_controller',
                    this.request.ip
                );
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.INTERNAL_SERVER_ERROR
                )
            }
            const details = user.UserDetails;
            user = $filterObject(user, ['fullname', 'email'])
            $sendResponse.success({
                user_id,
                details: {
                    ...user,
                    ...details
                }
            }, this.response, apiMessageKeys.DONE, statusCodes.OK);
            return $logged(
                `New login by "user_id: ${user_id}"`.toUpperCase(),
                true,
                'user_controller',
                this.request.ip
            );
        } catch (error: any) {
            $logged(
                error,
                false,
                'user_controller'
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    private logout = () => {
        this.response.send('logout SERVICE');
    }
    private confirmEmail = () => {
        this.response.send('confirmEmail SERVICE')
    }
    private checkResetPasswordToken = () => {
        this.response.send('checkResetPasswordToken SERVICE')
    }
    private login = async () => {
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
                'user_controller'
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    private signup = async () => {
        const payload = trimObjectValues(this.reqBody);
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
            const emailExist = await this.database.users.findFirst({where: {email: payload.email}});
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

            const hash_password = await bcrypt.hash(payload.password, Number(process.env.HASH_LIMIT) || 10);
            const result = await this.database.users.create({
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
            });
            $logged(`New user registered, user_id: ${result.id}`.toUpperCase(), true, `user_controller`, this.request.ip);
            return $sendResponse.success(
                {},
                this.response,
                apiMessageKeys.USER_SUCCESSFULLY_REGISTERED,
                statusCodes.CREATED,
                {count: result.id}
            );
        } catch (error: any) {
            $logged(
                `Registration progress failed:\n${error}`,
                false,
                'user_controller'
            );
            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }
    private refreshToken = () => {
        this.response.send('refreshToken SERVICE')
    }
    private forgotPassword = () => {
        this.response.send('forgotPassword SERVICE')
    }
    private resetPassword = () => {
        this.response.send('resetPassword SERVICE')
    }
    private setPreferredLang = () => {
        const required_fields = validRequiredFields(['lang'], this.reqBody);
        if(required_fields.length){
            return $sendResponse.failed(
                {required_fields},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.EXPECTATION_FAILED
            )
        }
    }
}

export default $callToAction(UserController)
