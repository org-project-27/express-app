import {$callToAction, $sendResponse} from "#helpers/methods";
import {Request, Response} from 'express';
import {Controller} from "#types/controller";
import {validateEmail, validateFullName, validatePasswordStrength, validRequiredFields} from "#helpers/inputValidation";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import {trimObjectValues} from "#helpers/generalHelpers";
import bcrypt from "bcrypt";
import statusCodes from "#assets/constants/statusCodes";

class UserController extends Controller {
    declare public actions;
    public request;
    public response;
    constructor(request: Request, response: Response) {
        super(request, response);
        this.request = request;
        this.response = response;

        this.actions['GET']['/auth'] = this.auth;
        this.actions['GET']['/logout'] = this.logout;
        this.actions['GET']['/confirm_email'] =  this.confirmEmail;
        this.actions['GET']['/reset_password'] =  this.checkResetPasswordToken;

        this.actions['POST']['/login'] = this.login;
        this.actions['POST']['/signup'] = this.signup;
        this.actions['POST']['/token'] = this.refreshToken;
        this.actions['POST']['/forgot_password'] = this.forgotPassword;
        this.actions['POST']['/reset_password'] = this.resetPassword;

        this.actions['PUT']['/preferred_lang'] = this.setPreferredLang;
    }

    private auth = () => {
        this.actions.POST['/signup']();
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
    private login = () => {
        this.response.send('login SERVICE')
    }
    private signup = async () => {
        const data = trimObjectValues(this.request.body);
        try {
            const validationRequiredFields= validRequiredFields(['email', 'fullname', 'password'], data);
            // step #1: Check required fields is filled
            if(validationRequiredFields.length){
                return $sendResponse.failed(
                    {required_fields: validationRequiredFields},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.EXPECTATION_FAILED
                );
            }

            // step #2: Validate email string
            if (!validateEmail(data.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.EXPECTATION_FAILED
                );
            }

            // step #3: Check is email already exist
            const emailExist = await this.database.users.findFirst({where: {email: data.email}});
            if(emailExist){
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.EMAIL_IS_EXIST,
                    statusCodes.UNPROCESSABLE_ENTITY
                );
            }

            // step #4: Validate password strength
            if (validatePasswordStrength(data.password) < 2) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PASSWORD,
                    statusCodes.UNPROCESSABLE_ENTITY
                );
            }

            // step #5: Validate fullname string
            if (!validateFullName(data.fullname)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_FULLNAME,
                    statusCodes.UNPROCESSABLE_ENTITY
                );
            }

            const hash_password = await bcrypt.hash(data.password, Number(process.env.HASH_LIMIT) || 10);
            const result = await this.database.users.create({
                data: {
                    fullname: data.fullname,
                    email: data.email,
                    password: hash_password,
                    UserDetails: {
                        create: {
                            email_registered: false,
                            preferred_lang: data.preferred_lang
                        }
                    }
                }
            });
            return $sendResponse.success(
                {},
                this.response,
                apiMessageKeys.USER_SUCCESSFULLY_REGISTERED,
                statusCodes.CREATED,
                {count: result.id}
            );
        }
        catch (error: any) {
            return $sendResponse.failed(
                {error: error},
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
        this.response.send('setPreferredLang SERVICE')
    }
}

export default $callToAction(UserController)
