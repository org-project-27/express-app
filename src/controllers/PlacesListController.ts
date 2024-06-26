import { Controller } from "#types/controller";
import { Request, Response } from "express";
import { $callToAction, $sendResponse } from "#helpers/methods";
import { validateAddress, validatePlaceName, validateCity, validateZipCode, validRequiredFields, validateLength, validateState, validatePhone, validateOpeningHours, validateEmail } from "#helpers/inputValidation";
import { $logged } from "#helpers/logHelpers";
import apiMessageKeys from "#assets/constants/apiMessageKeys";
import statusCodes from "#assets/constants/statusCodes";
import { $filterObject, deepCopy, trimObjectValues } from "#helpers/generalHelpers";
import { PlaceListDataType } from "~/assets/types/model";

class PlacesListController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);

        this.actions['GET']['/'] = this.getPlaceById;
        this.actions['GET']['/all'] = this.getPlaces;

        this.actions['POST']['/register'] = this.addPlace;

        this.actions['PUT']['/update'] = this.editPlaceById;

        this.actions['DELETE']['/'] = this.deletePlaceById;
    }

    public getPlaces = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const places = (await this.database.placesList.findMany({
                include: { Brands: where['with_brand'] == "true" }
            })).map(place => where['with_brand'] == "true" ?
                $filterObject(place, ['brand_id'], { reverse: true }) :
                place
            );
            const count = await this.database.placesList.count();
            return $sendResponse.success({
                places,
                count
            }, this.response);
        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Fetching all places progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    };
    public getPlaceById = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const required_fields = validRequiredFields(['id'], where);
            if (!required_fields.length) {
                if (!isNaN(where['id'])) {
                    where['id'] = Number(where['id']);
                    const place = await this.database.placesList.findFirst({
                        where: {
                            place_id: where['id']
                        },
                        include: {
                            Brands: where['with_brand'] == "true"
                        }
                    });
                    if (place) {
                        if (where['with_brand'] == "true") {
                            const result = deepCopy(place);
                            result['brand'] = result['Brands'];
                            delete result['Brands'];

                            return $sendResponse.success(
                                $filterObject(result, ['brand_id'], {reverse: true}),
                                this.response,
                                apiMessageKeys.DONE,
                                statusCodes.OK
                            );
                        }
                        return $sendResponse.success(
                            place,
                            this.response,
                            apiMessageKeys.DONE,
                            statusCodes.OK
                        );
                    }
                }
                return $sendResponse.failed(
                    { query: where },
                    this.response,
                    apiMessageKeys.PLACE_NOT_FOUND,
                    statusCodes.NOT_FOUND
                );
            }
            return $sendResponse.failed({ required_fields }, this.response);

        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Fetching place by id progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    };
    public addPlace = async () => {
        const payload = this.reqBody;
        try {
            const data: PlaceListDataType = trimObjectValues(payload.data);
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;
            
            // #step 1: Check required fields
            const required_fields = validRequiredFields(
                [
                    'name',
                    'type',
                    'address',
                    'city',
                    'state',
                    'zip_code',
                    'phone',
                    'email',
                    'opening_hours',
                ],
                data);

            if (required_fields.length > 0) {
                return $sendResponse.failed({ required_fields }, this.response);
            }

            // #step 2: Check user really have this brand_id
            const user = await this.database.users.findFirst(
                {
                    where: {
                        id: user_id
                    },
                    include: {
                        Brands: {
                            where: {
                                brand_id: payload.brand_id
                            }
                        },
                    }
                }
            );
            if (!user || !user['Brands'].length) {
                $logged(
                    `User not found -> {user_id: ${user_id}, brand_id: ${payload.brand_id}`,
                    false,
                    { file: __filename.split('/src')[1] },
                    this.request.ip
                );
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.FORBIDDEN
                );
            }

            // #step 3: validate fields value
            if (!validatePlaceName(data.name)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PLACE_NAME,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateEmail(data.email)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_EMAIL,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateZipCode(data.zip_code)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_ZIP_CODE,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateAddress(data.address)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_ADDRESS,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateCity(data.city)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_CITY,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateState(data.state)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_STATE,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validatePhone(data.phone)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PHONE,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateOpeningHours(data.opening_hours)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_OPENING_HOURS,
                    statusCodes.BAD_REQUEST
                );
            }
            const typeExist = !!(await this.database.placeListType.findFirst({ where: { id: data.type } }))
            if (!typeExist) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_PLACE_TYPE,
                    statusCodes.BAD_REQUEST
                );
            }

            // #step 4: check already exist case
            const alreadyExist = await this.database.placesList.findFirst({
                where: {
                    name: data.name,
                    type: data.type,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zip_code: data.zip_code,
                }
            });

            if (alreadyExist) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.ALREADY_EXIST,
                    statusCodes.CONFLICT
                );
            }

            // #step 4: save to db
            await this.database.placesList.create({
                data: {
                    brand_id: payload.brand_id,
                    ...data
                }
            }).then((result: any) => {
                $sendResponse.success(
                    { place_id: result.place_id },
                    this.response,
                    apiMessageKeys.DONE,
                    statusCodes.CREATED
                );
                $logged(
                    `\n🛎️ New place registered {user_id: ${user_id}, place_id: ${result.place_id}, brand_id: ${payload.brand_id}, name: "${data.name}"}\n`,
                    true,
                    { file: __filename.split('/src')[1] },
                    this.request.ip
                );
            }).catch((error: any) => {
                throw error;
            });
        } catch (error: any) {
            $logged(
                `Place registration progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload },
                this.request.ip
            );

            return $sendResponse.failed(
                {},
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.UNPROCESSABLE_ENTITY
            )
        }
    };
    public editPlaceById = async () => {
        const payload = trimObjectValues(this.reqBody.data);
        const place_id = Number(this.reqQuery.id);
        try {
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;
            // #step 1: Check required fields
            const required_fields = validRequiredFields(
                [
                    'data',
                    'place_id',
                    'user_id'
                ],
                { data: payload, place_id, user_id });

            if (required_fields.length > 0) {
                return $sendResponse.failed({ required_fields }, this.response);
            }

            // #step 2: Check user really have this place
            const targetPlace = await this.database.placesList.findFirst({ where: { place_id } });
            if (!targetPlace) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.PLACE_NOT_FOUND,
                    statusCodes.NOT_FOUND
                )
            }

            const user = await this.database.users.findFirst(
                {
                    where: {
                        id: user_id
                    },
                    include: {
                        Brands: {
                            where: {
                                brand_id: targetPlace.brand_id
                            }
                        },
                    }
                }
            );
            if (!user || !user['Brands'].length) {
                $logged(
                    `User not found -> {user_id: ${user_id}, brand_id: ${targetPlace.brand_id}`,
                    false,
                    { file: __filename.split('/src')[1] },
                    this.request.ip
                );
                return $sendResponse.failed(
                    { user, targetPlace },
                    this.response,
                    apiMessageKeys.SOMETHING_WENT_WRONG,
                    statusCodes.FORBIDDEN
                );
            }
            // #step 3: validate fields value
            const editableFields: string[] = [];
            if (payload.place_id) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.YOU_CANNOT_EDIT_PLACE_ID,
                    statusCodes.FORBIDDEN
                );
            }
            if (payload.brand_id) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.YOU_CANNOT_EDIT_BRAND_ID,
                    statusCodes.FORBIDDEN
                );
            }
            if (payload.name) {
                if (!validatePlaceName(payload.name)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_PLACE_NAME,
                        statusCodes.BAD_REQUEST
                    );
                }   
                editableFields.push('name');
            }
            if (payload.email) {
                if (!validateEmail(payload.email)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_EMAIL,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('email');
            }
            if (payload.zip_code) {
                if (!validateZipCode(payload.zip_code)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_ZIP_CODE,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('zip_code');
            }
            if (payload.address) {
                if (!validateAddress(payload.address)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_ADDRESS,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('address');
            }
            if (payload.city) {
                if (!validateCity(payload.city)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_CITY,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('city');
            }
            if (payload.state) {
                if (!validateState(payload.state)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_STATE,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('state');
            }
            if (payload.phone) {
                if (!validatePhone(payload.phone)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_PHONE,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('phone');
            }
            if (payload.opening_hours) {
                if (!validateOpeningHours(payload.opening_hours)) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_OPENING_HOURS,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('opening_hours');
            }
            if (payload.type) {
                const typeExist = !!(await this.database.placeListType.findFirst({ where: { id: payload.type } }));
                if (!typeExist) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_PLACE_TYPE,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('type');
            }
            // #step 4: Combine editable validated fields
            const data: any = {}
            editableFields.forEach(key => {data[key] = payload[key]});
            
            // #step 5: Update
            await this.database.placesList.update({
                where: { place_id: targetPlace.place_id },
                data
            }).then((result) => {
                return $sendResponse.success(
                    result,
                    this.response,
                    apiMessageKeys.DONE,
                    statusCodes.OK,
                    {edited_fields: editableFields}
                );
            }).catch((error: any) => {
                throw error;
            });
        } catch (error: any) {
            $logged(
                `Editing place progress failed\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload },
                this.request.ip
            );
            return $sendResponse.failed(
                { error },
                this.response,
                apiMessageKeys.SOMETHING_WENT_WRONG,
                statusCodes.INTERNAL_SERVER_ERROR
            );
        }
    };
    public deletePlaceById = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;
            const required_fields = validRequiredFields(['id'], where);
            if (!required_fields.length) {
                if (!isNaN(where['id'])) {
                    where['id'] = Number(where['id']);

                    const place = await this.database.placesList.findFirst({
                        where: {
                            place_id: where['id']
                        }
                    });
                    if (place) {
                        const user = await this.database.users.findFirst(
                            {
                                where: {
                                    id: user_id
                                },
                                include: {
                                    Brands: {
                                        where: {
                                            brand_id: place.brand_id
                                        }
                                    },
                                }
                            }
                        );
                        if (user && user['Brands'].length) {
                            const result = await this.database.placesList.delete({
                                where: { place_id: place.place_id }
                            })
                            $logged(
                                `\n🛎️ A place deleted {user_id: ${user_id}, place_id: ${result.place_id}, brand_id: ${place.brand_id}, name: "${place.name}"}\n`,
                                true,
                                { file: __filename.split('/src')[1] },
                                this.request.ip
                            );
                            return $sendResponse.success(
                                {},
                                this.response
                            );
                        }
                        return $sendResponse.failed(
                            {},
                            this.response,
                            apiMessageKeys.SOMETHING_WENT_WRONG,
                            statusCodes.FORBIDDEN
                        );
                    }
                }
                return $sendResponse.failed(
                    { query: where },
                    this.response,
                    apiMessageKeys.PLACE_NOT_FOUND,
                    statusCodes.NOT_FOUND
                );
            }
            return $sendResponse.failed({ required_fields }, this.response);

        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Deleting place progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    };
}

export default $callToAction(PlacesListController);