import {$sendResponse, $callToAction} from "../../assets/helpers/methods.js";
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
import {v4 as uuidv4} from "uuid";

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
            delete data['id'];
            delete data['password'];
            return $sendResponse.success(res, statusCodes.OK, messages.DONE, {data});
        })
        .catch(error => $sendResponse.failed(res,
            statusCodes.BAD_REQUEST,
            messages.SOMETHING_WENT_WRONG,
            {error: error?.name}));
};

const forgotPassword = async (req = {body: {email: null}}, res) => {
    const payload = req.body;
    const requiredFields = ['email'];

    // step #1: Check required fields is filled
    const checkRequiredFields = validRequiredFields(requiredFields, payload);
    if (checkRequiredFields.length) {
        return $sendResponse.failed(res,
            statusCodes.EXPECTATION_FAILED,
            messages.INVALID_EMAIL,
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
        await $sendEmail(payload.email)["@noreply"].resetPassword({
            fullname: userByEmail.fullname,
            expire_in_hour: 24,
            token: 'example-token'
        }).then(() => {
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
        if(UserDetails.email_registered === true){
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

const sendConfirmEmail = async (payload = { email: null, fullname: null }) => {
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
export default $callToAction({
    GET: {
        '/auth': auth,
        '/confirm_email': confirmEmail
    },
    POST: {
        '/login': login,
        '/signup': signup,
        '/token': refreshToken,
        '/forgot_password': forgotPassword
    },
});