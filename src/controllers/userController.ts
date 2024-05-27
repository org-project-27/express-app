import {$callToAction, $sendResponse} from "#helpers/methods";
import {Request, Response} from 'express';
import {Controller} from "#types/controller";
import {validRequiredFields} from "#helpers/inputValidation";
import UserModel from "#models/user.model";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
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
        const payload = this.request.body
        try {
            await UserModel.model.create({
                ...payload
            })
            UserModel.methods.setUserPassword(payload.password)
            $sendResponse.success(payload, this.response);
        }
        catch (error: any) {
            $sendResponse.failed({}, this.response)
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
