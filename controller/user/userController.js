import {$sendResponse, $callToAction, $filterObject} from "../../assets/helpers/methods.js";
import Users from "../../db/models/user.model.js";
import UserDetailsModel from "../../db/models/userDetails.model.js";
import statusCodes from "../../assets/helpers/statusCodes.js";
import {
    validRequiredFields,
    validateEmail,
    validateFullName,
    validatePasswordStrength
} from "../../assets/helpers/inputValidation.js";
import messages from "../../assets/constants/apiMessageKeys.js";
import bcrypt from "bcrypt";
import {trimObjectValues} from "../../assets/helpers/generalHelpers.js";
import jwt from 'jsonwebtoken';
import {$sendEmail} from "../../assets/helpers/emailHelper.js";

async function getUserByPayload(payload) {
    return await Users.methods.findOne({...payload}, ['details']);
}

async function checkAllSignupFields(requiredFields, payload, res) {
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

async function checkAllLoginFields(payload, res) {
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

async function resetPasswordTokenVerify(payload = {token: null}, res) {
    const {token} = payload;
    if (token) {
        const verifyTokenExist = await UserDetailsModel.model.findOne({where: {reset_password_token: token}});
        // If token have changed or fake:
        if (!verifyTokenExist) {
            $sendResponse.failed(
                res,
                statusCodes.FORBIDDEN,
                messages.LINK_EXPIRED
            );
            return null;
        }
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
            // If token expired:
            if (err) {
                verifyTokenExist['reset_password_token'] = null;
                verifyTokenExist.save();
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

            const targetUser = await Users.model.findByPk(verifyTokenExist.user_id);

            // If request_key have changed or fake:
            if (data.request_key !== targetUser.password) {
                $sendResponse.failed(
                    res,
                    statusCodes.FORBIDDEN,
                    messages.LINK_EXPIRED
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
async function sendConfirmEmail(payload = {email: null, fullname: null}) {
    const appDomain = process.env.APP_BRAND_DOMAIN;
    const confirm_link_life_hour = 24;

    const confirm_email_token = jwt.sign(
        {email: payload.email},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: confirm_link_life_hour * 3600}
    );

    const confirm_link = `www.${appDomain.toLowerCase()}/confirm_email?token=${confirm_email_token}`;

    return await $sendEmail(payload.email)["@noreply"].confirmEmail({
        full_name: payload.fullname,
        confirm_link,
        confirm_link_life_hour,
    });
}

async function sendPasswordChangedEmail(payload = {email: null, fullname: null}) {

}

// USER SERVICES:

const signup = async (req = {body: Users.modelFields}, res) => {
    const {requiredFields, methods} = Users;
    const payload = trimObjectValues(req.body);
    if (await checkAllSignupFields(requiredFields, payload, res)) {
        const saltRound = Number(process.env.HASH_LIMIT) || 10;
        bcrypt.hash(payload.password, saltRound)
            .then(async hash => {
                payload.password = hash;
                await methods.create({...payload})
                    .then(async result => {
                        let details = {};
                        details['email_registered'] = false;
                        details[Users.includes.details.foreignKey] = result.id;
                        await UserDetailsModel.model.create(details);
                        if (payload.email) {
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

const login = async (req = {body: {email: null, password: null}}, res) => {
    const payload = trimObjectValues(req.body);
    const userByEmail = await checkAllLoginFields(payload, res);
    if (userByEmail) {
        await bcrypt.compare(payload.password, userByEmail.password)
            .then(result => {
                if (result) {
                    // If password is correct
                    const access_token = jwt.sign(
                        {user_id: userByEmail.id},
                        process.env.ACCESS_TOKEN_SECRET,
                        {expiresIn: Number(process.env.ACCESS_TOKEN_LIFE)}
                    );
                    const refresh_token = jwt.sign(
                        {user_id: userByEmail.id},
                        process.env.REFRESH_TOKEN_SECRET,
                        {expiresIn: Number(process.env.REFRESH_TOKEN_LIFE)}
                    );

                    const data = {
                        access_token,
                        refresh_token,
                        expires_in: Number(process.env.ACCESS_TOKEN_LIFE)
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

const auth = async (req = {body: {access_token: null}}, res) => {
    await getUserByPayload({id: req.user_auth_id})
        .then(data => {
            data['user_id'] = data['id'];
            data = $filterObject(data, ['user_id', 'fullname', 'email', 'details']);
            data['details'] = $filterObject(data.details, ['phone', 'birthday', 'description', 'email_registered'])
            return $sendResponse.success(res, statusCodes.OK, messages.DONE, {data});
        })
        .catch(error => $sendResponse.failed(res,
            statusCodes.BAD_REQUEST,
            messages.SOMETHING_WENT_WRONG,
            {error: error?.name}));
};

const refreshToken = (req = {body: {refresh_token: null}}, res) => {
    const {refresh_token} = req.body;
    if (!refresh_token) {
        return $sendResponse.failed(res,
            statusCodes.UNAUTHORIZED,
            messages.SOMETHING_WENT_WRONG);
    }

    // Verify the refresh token
    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (error, result) => {
        if (error) {
            return $sendResponse.failed(res,
                statusCodes.FORBIDDEN,
                messages.INVALID_TOKEN);
        }

        // Issue a new access token
        const access_token = jwt.sign(
            {user_id: result.user_id},
            process.env.ACCESS_TOKEN_SECRET,
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

const confirmEmail = async (req = {query: {token: null}}, res) => {
    const required_fields = validRequiredFields(['token'], req.query);
    if (required_fields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.SOMETHING_WENT_WRONG,
            { required_fields });
    } else {
    const {token} = req.query;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
            let email = null;
            if (err) {
                return $sendResponse.failed(
                    res,
                    statusCodes.FORBIDDEN,
                    messages.LINK_EXPIRED
                );
            }
            email = data.email;
            if (!email) {
                return $sendResponse.failed(
                    res,
                    statusCodes.FORBIDDEN,
                    messages.LINK_EXPIRED
                );
            }
            const {id} = await Users.methods.findOne({email}, ['details', 'examples']);
            if (!id) {
                return $sendResponse.failed(
                    res,
                    statusCodes.NOT_FOUND,
                    messages.EMAIL_IS_NOT_REGISTERED
                );
            }
            const UserDetails = await UserDetailsModel.model.findByPk(id);
            if (UserDetails.email_registered === true) {
                return $sendResponse.failed(
                    res,
                    statusCodes.CONFLICT,
                    messages.EMAIL_IS_EXIST
                );
            }
            UserDetails.email_registered = true;
            await UserDetails.save()
            return $sendResponse.success(res, statusCodes.OK, messages.EMAIL_SUCCESSFULLY_CONFIRMED);
    
        });
    }
}

const forgotPassword = async (req = {body: {email: null}}, res) => {
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
    const userByEmail = await getUserByPayload({email: payload.email});
    if (userByEmail) {
        const appDomain = process.env.APP_BRAND_DOMAIN;
        const reset_link_life_hour = 1;
        const reset_link_token = jwt.sign(
            {request_key: userByEmail.password},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: reset_link_life_hour * 3600}
        );

        const reset_link = `www.${appDomain.toLowerCase()}/reset_password?token=${reset_link_token}`;

        const UserDetails = await UserDetailsModel.model.findByPk(userByEmail.id);

        await $sendEmail(payload.email)["@noreply"].resetPassword({
            full_name: userByEmail.fullname,
            reset_link_life_hour,
            reset_link,
        }).then(async () => {
            UserDetails.reset_password_token = reset_link_token;
            await UserDetails.save();
            $sendResponse.success(res);
        }).catch((error) => {
            $sendResponse.failed(res,
                statusCodes.BAD_REQUEST,
                messages.SOMETHING_WENT_WRONG,
                error);
        });
    } else {
        $sendResponse.success(res);
    }
}

const checkResetPasswordToken = async (req = {query: {token: null}}, res) => {
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

const resetPassword = async (req = {body: {new_password: null, token: null}}, res) => {
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
            const targetUser = await Users.model.findOne({where: {password: request_key}});
            const targetUserDetails = await UserDetailsModel.model.findOne({where: {user_id: targetUser.id}});

            // Update New Password
            const saltRound = Number(process.env.HASH_LIMIT) || 10;
            bcrypt.hash(new_password, saltRound)
                .then(async (hash) => {
                    targetUser.password = hash;
                    await targetUser.save();
                    targetUserDetails['reset_password_token'] = null;
                    await targetUserDetails.save();

                    await $sendEmail(targetUser.email)["@noreply"].passwordUpdated({
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

export default $callToAction({
    GET: {
        '/auth': auth,
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
});