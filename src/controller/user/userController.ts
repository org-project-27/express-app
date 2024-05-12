import {$sendResponse, $callToAction, $filterObject} from "../../assets/helpers/methods";
import Users from "../../db/models/user.model";
import UserDetailsModel from "../../db/models/userDetails.model";
import statusCodes from "../../assets/helpers/statusCodes";
import {
    validRequiredFields,
    validateEmail,
    validateFullName,
    validatePasswordStrength
} from "../../assets/helpers/inputValidation";
import messages from "../../assets/constants/apiMessageKeys";
import bcrypt from "bcrypt";
import {trimObjectValues} from "../../assets/helpers/generalHelpers";
import jwt from 'jsonwebtoken';
import {$sendEmail} from "../../assets/helpers/emailHelper";
import {
    $createTokenSession,
    $destroyTokenSessionByPk,
    $getTokenSession,
    $verifyTokenSession
} from "../../assets/helpers/jwt";
import {available_email_langs} from "../../assets/constants/language";

async function getUserByPayload(payload: any) {
    return await Users.model.findOne({where: {...payload}, include: ['details']});
}

async function checkAllSignupFields(requiredFields: any, payload: any, res: any) {
    // step #1: Check required fields is filled
    const checkRequiredFields = validRequiredFields(requiredFields, payload);
    if (checkRequiredFields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.USER_REGISTRATION_FAILED,
            {required_fields: checkRequiredFields});
    }
    // step #2: Validate email string
    if (!validateEmail(payload.email)) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_EMAIL);
    }
    // step #3: Check is email already exist
    const emailIsAlreadyExist = await getUserByPayload({email: payload.email});
    if (emailIsAlreadyExist) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.EMAIL_IS_EXIST,
            {email: payload.email});
    }
    // step #4: Validate password strength
    if (validatePasswordStrength(payload.password) < 2) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_PASSWORD);
    }
    // step #5: Validate fullname string
    if (!validateFullName(payload.fullname)) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_FULLNAME);
    }
    return true;
}

async function checkAllLoginFields(payload: any, res: any) {
    const requiredFields = ['email', 'password'];
    // step #1: Check required fields is filled
    const checkRequiredFields = validRequiredFields(requiredFields, payload);
    if (checkRequiredFields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.USER_LOGIN_PROGRESS_FAILED,
            {required_fields: checkRequiredFields});
    }
    // step #2: Validate email string
    if (!validateEmail(payload.email)) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_EMAIL);
    }
    // step #3: Check email if exist
    const userByEmail = await getUserByPayload({email: payload.email});
    if (!userByEmail) {
        return $sendResponse.failed(res,
            statusCodes.UNAUTHORIZED,
            messages.EMAIL_OR_PASSWORD_INCORRECT);
    }
    return userByEmail;
}

async function resetPasswordTokenVerify(payload = {token: null}, res: any) {
    const {token} = payload;
    if (token) {
        const verifyTokenExist: any = await $getTokenSession({token, created_for: 'reset_password'});
        // If token have changed or fake:
        if (!verifyTokenExist) {
            $sendResponse.failed(
                res,
                statusCodes.FORBIDDEN,
                messages.LINK_EXPIRED
            );
            return null;
        }
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || '', async (err: any, data: any) => {
            // If token expired:
            if (err) {
                await $destroyTokenSessionByPk(verifyTokenExist.id);
                $sendResponse.failed(
                    res,
                    statusCodes.FORBIDDEN,
                    messages.LINK_EXPIRED
                );
                return null;
            }
            // If request_key null:
            if (!data.request_key) {
                $sendResponse.failed(
                    res,
                    statusCodes.INTERNAL_SERVER_ERROR,
                    messages.SOMETHING_WENT_WRONG
                );
                return null;
            }

            const targetUser: any = await Users.model.findByPk(verifyTokenExist.owner_id);
            // If request_key have changed or fake:
            if (!targetUser || data.request_key !== targetUser.password) {
                $sendResponse.failed(
                    res,
                    statusCodes.FORBIDDEN,
                    messages.SOMETHING_WENT_WRONG
                );
                return null;
            }

            return data.request_key;
        });
    } else {
        $sendResponse.failed(
            res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG
        );
        return null;
    }
}

// EMAIL METHODS
async function sendConfirmEmail(payload = {email: null, fullname: null, userId: null, preferred_lang: null}) {
    const appDomain: any = process.env.APP_BRAND_DOMAIN;
    const confirm_link_life_hour = 24;

    const confirm_email_token = (await $createTokenSession(
        payload.userId,
        'confirm_email',
        {email: payload.email},
        confirm_link_life_hour * 3600,
    )).token;

    const confirm_link: any = `www.${appDomain.toLowerCase()}/confirm_email?token=${confirm_email_token}`;

    return await $sendEmail(payload.email, payload.preferred_lang)["@noreply"].confirmEmail({
        full_name: payload.fullname,
        confirm_link,
        confirm_link_life_hour,
    });

}

// USER SERVICES:
const signup = async (req = {body: Users.modelFields}, res: any) => {
    const {requiredFields} = Users;
    const payload = trimObjectValues(req.body);
    if (await checkAllSignupFields(requiredFields, payload, res)) {
        const saltRound = Number(process.env.HASH_LIMIT) || 10;
        bcrypt.hash(payload.password, saltRound)
            .then(async hash => {
                payload.password = hash;
                await Users.model.create({...payload})
                    .then(async (result: any) => {
                        let details: any = {};
                        details['email_registered'] = false;
                        details['preferred_lang'] = payload.preferred_lang;
                        details[Users.includes.details.foreignKey] = result.id;
                        await UserDetailsModel.model.create(details);
                        if (payload.email) {
                            payload['userId'] = result.id;
                            await sendConfirmEmail(payload)
                                .then(() => {
                                    $sendResponse.success(res,
                                        statusCodes.OK,
                                        messages.USER_SUCCESSFULLY_REGISTERED,
                                        {record_id: result.id})
                                })
                                .catch((error) => {
                                    $sendResponse.failed(res,
                                        statusCodes.BAD_REQUEST,
                                        messages.SOMETHING_WENT_WRONG,
                                        {error});
                                });
                        }
                    })
                    .catch(error => $sendResponse.failed(res,
                        statusCodes.BAD_REQUEST,
                        messages.USER_REGISTRATION_FAILED,
                        {error: error?.name}));
            })
            .catch(() => $sendResponse.failed(res,
                statusCodes.INTERNAL_SERVER_ERROR,
                messages.SOMETHING_WENT_WRONG));
    }
};

const login = async (req = {body: {email: null, password: null}}, res: any) => {
    const payload: any = trimObjectValues(req.body);
    const userByEmail: any = await checkAllLoginFields(payload, res);
    if (userByEmail) {
        await bcrypt.compare(payload.password, userByEmail.password)
            .then(async result => {
                if (result) {
                    // If password is correct
                    const access_token = (await $createTokenSession(
                        userByEmail.id,
                        'access_token',
                        {user_id: userByEmail.id},
                        3600 * 24, //24 hour
                    )).token;
                    const refresh_token = (await $createTokenSession(
                        userByEmail.id,
                        'refresh_token',
                        {user_id: userByEmail.id},
                        3600 * 24 * 7, //7 week
                    )).token;

                    const data = {
                        access_token,
                        refresh_token,
                        expires_in: 3600 * 24
                    }

                    return $sendResponse.success(res,
                        statusCodes.OK,
                        messages.USER_SUCCESSFULLY_LOGIN,
                        {data});
                }
                // If password isn't correct
                return $sendResponse.failed(res,
                    statusCodes.UNAUTHORIZED,
                    messages.EMAIL_OR_PASSWORD_INCORRECT);
            })
            .catch(() => $sendResponse.failed(res,
                statusCodes.INTERNAL_SERVER_ERROR,
                messages.SOMETHING_WENT_WRONG));
    }
};

const auth = async (req: any, res: any) => {
    await getUserByPayload({id: req.user_auth_id})
        .then((data: any) => {
            data = data.toJSON()
            return $sendResponse.success(res, statusCodes.OK, messages.DONE, {
                data: {
                    user_id: data.id,
                    details: $filterObject(data.details, ['phone', 'birthday', 'description', 'email_registered', 'preferred_lang'])
                }
            });
        })
        .catch(error => $sendResponse.failed(res,
            statusCodes.BAD_REQUEST,
            messages.SOMETHING_WENT_WRONG,
            {error: error?.name}));
};

const logout = async (req: any, res: any) => {
    if(!req.user_auth_id){
       return $sendResponse.failed(res,
            statusCodes.BAD_REQUEST,
            messages.SOMETHING_WENT_WRONG);
    }
    await $destroyTokenSessionByPk(req.token_session.id);
    const refreshTokenSession: any = await $getTokenSession({created_for: 'refresh_token', owner_id: req.user_auth_id});
    await $destroyTokenSessionByPk(refreshTokenSession.id);
    $sendResponse.success(res, 200, 'DONE');
}

const refreshToken = (req: any = {body: {refresh_token: null}}, res: any) => {
    const {refresh_token} = req.body;
    if (!refresh_token) {
        return $sendResponse.failed(res,
            statusCodes.UNAUTHORIZED,
            messages.SOMETHING_WENT_WRONG);
    }

    // Verify the refresh token
    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET || '', (error: any, result: any) => {
        if (error) {
            return $sendResponse.failed(res,
                statusCodes.FORBIDDEN,
                messages.INVALID_TOKEN);
        }

        // Issue a new access token
        const access_token = jwt.sign(
            {user_id: result.user_id},
            process.env.ACCESS_TOKEN_SECRET || '',
            {expiresIn: Number(process.env.ACCESS_TOKEN_LIFE)}
        );

        const data = {
            access_token,
            expires_in: Number(process.env.ACCESS_TOKEN_LIFE)
        }

        return $sendResponse.success(res,
            statusCodes.OK,
            messages.DONE,
            {data});

    });
};

const confirmEmail = async (req: any = {query: {token: null}}, res: any) => {
    const required_fields = validRequiredFields(['token'], req.query);
    if (required_fields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            { required_fields });
    } else {
    const {token} = req.query;
    const {payload, session} = await $verifyTokenSession('confirm_email', token);
        if (!payload) {
            return $sendResponse.failed(
                res,
                statusCodes.FORBIDDEN,
                messages.LINK_EXPIRED
            );
        }

        const { email } = payload;
        if (!email) {
            return $sendResponse.failed(
                res,
                statusCodes.FORBIDDEN,
                messages.SOMETHING_WENT_WRONG
            );
        }
        //@ts-ignore
        const {id} = await Users.methods.findOne({email}, ['details', 'examples']);
        if (!id) {
            return $sendResponse.failed(
                res,
                statusCodes.NOT_FOUND,
                messages.EMAIL_IS_NOT_REGISTERED
            );
        }
        const UserDetails: any = await UserDetailsModel.model.findByPk(id);
        if (UserDetails.email_registered === true) {
            await $destroyTokenSessionByPk(session.id);
            return $sendResponse.failed(
                res,
                statusCodes.CONFLICT,
                messages.EMAIL_IS_EXIST
            );
        }
        UserDetails.email_registered = true;
        await UserDetails.save();
        await $destroyTokenSessionByPk(session.id);
        return $sendResponse.success(res, statusCodes.OK, messages.EMAIL_SUCCESSFULLY_CONFIRMED);
    }
}

const forgotPassword = async (req: any = {body: {email: null}}, res: any) => {
    const payload = req.body;
    const requiredFields = ['email'];

    // step #1: Check required fields is filled
    const checkRequiredFields = validRequiredFields(requiredFields, payload);
    if (checkRequiredFields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            {required_fields: checkRequiredFields});
    }
    // step #2: Validate email string
    if (!validateEmail(payload.email)) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_EMAIL);
    }
    // step #3: Check email if exist
    const userByEmail: any = await getUserByPayload({email: payload.email});
    if (userByEmail) {
        const appDomain: string = process.env.APP_BRAND_DOMAIN || '';
        const reset_link_life_hour = 1;
        const reset_link_token = (await $createTokenSession(
            userByEmail.id,
            'reset_password',
            {request_key: userByEmail.password},
            reset_link_life_hour * 3600,
        )).token;
        const reset_link = `www.${appDomain.toLowerCase()}/reset_password?token=${reset_link_token}`;

        const UserDetails: any = await UserDetailsModel.model.findByPk(userByEmail.id);

        await $sendEmail(payload.email, UserDetails.preferred_lang)["@noreply"].resetPassword({
            full_name: userByEmail.fullname,
            reset_link_life_hour,
            reset_link,
        }).then(async () => {
            $sendResponse.success(res,
                statusCodes.OK,
                messages.PASSWORD_RESET_LINK_WILL_SENT);
        }).catch((error) => {
            $sendResponse.failed(res,
                statusCodes.BAD_REQUEST,
                messages.SOMETHING_WENT_WRONG,
                error);
        });
    } else {
        $sendResponse.success(res,
            statusCodes.OK,
            messages.PASSWORD_RESET_LINK_WILL_SENT);
    }
}

const checkResetPasswordToken = async (req: any = {query: {token: null}}, res: any) => {
    const required_fields = validRequiredFields(['token'], req.query);

    if (required_fields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            { required_fields });
    }
    const {token} = req.query;
    await resetPasswordTokenVerify({token}, res).then(result => {
        if (result) {
            return $sendResponse.success(
                res,
                statusCodes.ACCEPTED,
                messages.DONE
            );
        }
    })
}

const resetPassword = async (req: any = {body: {new_password: null, token: null}}, res: any) => {
    const required_fields = validRequiredFields(['new_password', 'token'], req.body);

    if (required_fields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            { required_fields });
    }

    const {token, new_password} = req.body;
    if (validatePasswordStrength(new_password) < 2) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_PASSWORD);
    }
    await resetPasswordTokenVerify({token}, res).then(async (request_key) => {
        if (request_key) {
            const targetUser: any = await Users.model.findOne({where: {password: request_key}, include: ['details']});
            const {preferred_lang} = targetUser.details.toJSON();
            const tokenSession: any = await $getTokenSession({owner_id: targetUser.id, created_for: 'reset_password'})

            // Update New Password
            const saltRound = Number(process.env.HASH_LIMIT) || 10;
            bcrypt.hash(new_password, saltRound)
                .then(async (hash) => {
                    targetUser.password = hash;
                    await targetUser.save();
                    await $destroyTokenSessionByPk(tokenSession.id);

                    await $sendEmail(targetUser.email, preferred_lang)["@noreply"].passwordUpdated({
                        full_name: targetUser.fullname,
                        update_date: new Date(),
                        browser: req.useragent.browser,
                        os: req.useragent.os,
                        platform: req.useragent.platform,
                    });

                    return $sendResponse.success(
                        res,
                        statusCodes.OK,
                        messages.PASSWORD_SUCCESSFULLY_CHANGED
                    );
                }).catch(() => {
                    return $sendResponse.failed(
                        res,
                        statusCodes.INTERNAL_SERVER_ERROR,
                        messages.BCRYPT_ERROR
                    );
            });
        }
    }).catch(() => {
            return $sendResponse.failed(
                res,
                statusCodes.INTERNAL_SERVER_ERROR,
                messages.SOMETHING_WENT_WRONG
            )
        }
    );
}

const setPreferredLang = async (req: any = {body: {lang: null, user_id: null}}, res: any) => {
    const { lang, user_id } = req.body;
    const required_fields = validRequiredFields(['lang', 'user_id'], req.body);
    if (required_fields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            {required_fields: required_fields});
    }
    const targetUser: any = await UserDetailsModel.model.findByPk(user_id);
    if(!targetUser){
        return $sendResponse.failed(res,
            statusCodes.NOT_FOUND,
            messages.USER_NOT_FOUND);
    }
    if(!available_email_langs.includes(lang)){
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG);
    }
    targetUser['preferred_lang'] = lang;
    await targetUser.save();
    $sendResponse.success(res, 200, 'DONE')
}

export default $callToAction({
    GET: {
        '/auth': auth,
        '/logout': logout,
        '/confirm_email': confirmEmail,
        '/reset_password': checkResetPasswordToken
    },
    POST: {
        '/login': login,
        '/signup': signup,
        '/token': refreshToken,
        '/forgot_password': forgotPassword,
        '/reset_password': resetPassword,
    },
    PUT: {
        '/preferred_lang': setPreferredLang,
    }
});