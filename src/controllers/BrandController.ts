import { Controller } from "#types/controller";
import { Request, Response } from "express";
import { $callToAction, $sendResponse } from "#helpers/methods";
import { validateBrandName, validateLength, validateUrl, validRequiredFields } from "#helpers/inputValidation";
import { $logged } from "#helpers/logHelpers";
import { $filterObject, trimObjectValues } from "#helpers/generalHelpers";
import apiMessageKeys from "~/assets/constants/apiMessageKeys";
import statusCodes from "~/assets/constants/statusCodes";
import { BrandsDataType } from "~/assets/types/model";

class BrandController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);

        this.actions['GET']['/'] = this.getBrandById;
        this.actions['GET']['/all'] = this.getBrands;

        this.actions['POST']['/register'] = this.addBrand;

        this.actions['PUT']['/update'] = this.editBrandById;

        this.actions['DELETE']['/'] = this.deleteBrandById;
    }

    public getBrands = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const brands = (await this.database.brands.findMany({
                include: { PlacesList: where['with_places'] == "true" }
            }));
            const count = await this.database.brands.count();
            return $sendResponse.success({
                brands,
                count
            }, this.response);
        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Fetching all brands progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    }
    public getBrandById = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const required_fields = validRequiredFields(['id'], where);
            if (!required_fields.length) {
                if (!isNaN(where['id'])) {
                    where['id'] = Number(where['id']);
                    const brand = await this.database.brands.findFirst({
                        where: {
                            brand_id: where['id']
                        },
                        include: {
                            PlacesList: where['with_places'] == "true"
                        }
                    });
                    if (brand) {
                        return $sendResponse.success(
                            brand,
                            this.response,
                            apiMessageKeys.DONE,
                            statusCodes.OK
                        );
                    }
                }
                return $sendResponse.failed(
                    { query: where },
                    this.response,
                    apiMessageKeys.BRAND_NOT_FOUND,
                    statusCodes.NOT_FOUND
                );
            }
            return $sendResponse.failed({ required_fields }, this.response);

        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Fetching brand by id progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    }
    public addBrand = async () => {
        const payload = this.reqBody;
        try {
            const data: BrandsDataType = trimObjectValues(payload.data);
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;

            // #step 1: Check required fields
            const required_fields = validRequiredFields(
                [
                    'name',
                    'website',
                ],
                data);

            if (required_fields.length > 0) {
                return $sendResponse.failed({ required_fields }, this.response);
            }

            // #step 2: Check user may already have this brand
            const alreadyExistedBrand = await this.database.brands.findFirst(
                {
                    where: {
                        name: data.name,
                        owner_id: user_id,
                        website: data.website
                    }
                }
            );
            if (alreadyExistedBrand) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.BRAND_ALREADY_EXIST,
                    statusCodes.CONFLICT
                );
            }

            const alreadyExistedName = await this.database.brands.findFirst(
                {
                    where: {
                        name: data.name,
                        owner_id: user_id
                    }
                }
            );
            if (alreadyExistedName) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.NAME_ALREADY_TAKEN,
                    statusCodes.CONFLICT
                );
            }
            // #step 3: validate fields value
            if (!validateBrandName(data.name)) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_BRAND_NAME,
                    statusCodes.BAD_REQUEST
                );
            }
            if (!validateUrl(data.website) ||
                !validateLength(data.website, { min: 3, max: 255 })) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.INVALID_WEB_SITE_URL,
                    statusCodes.BAD_REQUEST
                );
            }
            if (data.bio) {
                if (!validateLength(data.bio, { min: 1, max: 65000 })) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_BRAND_BIO_SIZE,
                        statusCodes.BAD_REQUEST
                    );
                }
            }
            if (data.logo) {
                // #TODO: Create a validation for brand logo
            }
            // #step 4: save to db
            await this.database.brands.create({
                data: {
                    owner_id: user_id,
                    name: data.name,
                    website: data.website,
                    bio: data.bio,
                    logo: data.logo
                }
            }).then((result) => {
                $sendResponse.success(
                    { brand_id: result.brand_id },
                    this.response,
                    apiMessageKeys.DONE,
                    statusCodes.CREATED
                );
                $logged(
                    `\n🛎️ New brand registered {user_id: ${user_id}, brand_id: ${result.brand_id}, name: "${data.name}"}\n`,
                    true,
                    { file: __filename.split('/src')[1] },
                    this.request.ip
                );
            }).catch((error: any) => {
                throw error;
            });
        } catch (error: any) {
            $logged(
                `Brand registration progress failed:\n${error}`,
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
    }
    public editBrandById = async () => {
        const payload = trimObjectValues(this.reqBody.data);
        const brand_id = Number(this.reqQuery.id);
        try {
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;
            // #step 1: Check required fields
            const required_fields = validRequiredFields(
                [
                    'data',
                    'brand_id',
                    'user_id'
                ],
                { data: payload, brand_id, user_id });

            if (required_fields.length > 0) {
                return $sendResponse.failed({ required_fields }, this.response);
            }
            // #step 2: Check user really have this brand
            const targetBrand = await this.database.brands.findFirst({
                where: {
                    brand_id,
                    owner_id: user_id
                }
            });
            if (!targetBrand) {
                return $sendResponse.failed(
                    { query: this.reqQuery },
                    this.response,
                    apiMessageKeys.BRAND_NOT_FOUND,
                    statusCodes.NOT_FOUND
                );
            }
            
            // #step 3: validate fields value
            const editableFields: string[] = [];
            if (payload.brand_id) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.YOU_CANNOT_EDIT_BRAND_ID,
                    statusCodes.FORBIDDEN
                );
            }
            if (payload.owner_id) {
                return $sendResponse.failed(
                    {},
                    this.response,
                    apiMessageKeys.YOU_CANNOT_EDIT_OWNER_ID,
                    statusCodes.FORBIDDEN
                );
            }
            if (payload.name) {
                const alreadyExistedName = await this.database.brands.findFirst(
                    {
                        where: {
                            name: payload.name,
                            owner_id: user_id
                        }
                    }
                );
                if (alreadyExistedName) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.NAME_ALREADY_TAKEN,
                        statusCodes.CONFLICT
                    );
                }

                editableFields.push('name');
            }
            if (payload.website) {
                if (!validateUrl(payload.website) ||
                    !validateLength(payload.website, { min: 3, max: 255 })) {
                    return $sendResponse.failed(
                        {},
                        this.response,
                        apiMessageKeys.INVALID_WEB_SITE_URL,
                        statusCodes.BAD_REQUEST
                    );
                }
                editableFields.push('website');
            }
            if (payload.bio) {
                if (payload.bio) {
                    if (!validateLength(payload.bio, { min: 1, max: 65000 })) {
                        return $sendResponse.failed(
                            {},
                            this.response,
                            apiMessageKeys.INVALID_BRAND_BIO_SIZE,
                            statusCodes.BAD_REQUEST
                        );
                    }
                }
                editableFields.push('bio');
            }
            if (payload.logo) {
                // #TODO: Create a validation for brand logo
            }
            // #step 4: Combine editable validated fields
            const data: any = {}
            editableFields.forEach(key => { data[key] = payload[key] });
            
            // #step 5: Update
            await this.database.brands.update({
                where: { brand_id: targetBrand.brand_id },
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

        } catch (error) {
            $logged(
                `Editing brand progress failed\n${error}`,
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
    }
    public deleteBrandById = async () => {
        try {
            const where = trimObjectValues(this.reqQuery);
            const { user_id } = JSON.parse(this.reqBody.authentication_result).payload;
            const required_fields = validRequiredFields(['id'], where);
            if (required_fields.length > 0) {
                return $sendResponse.failed({ required_fields }, this.response);
            }
            const brand_id = Number(where['id']);
            const targetBrand = await this.database.brands.findFirst({
                where: {
                    brand_id,
                    owner_id: user_id
                }
            })
            if (!targetBrand) {
                return $sendResponse.failed(
                    { query: where },
                    this.response,
                    apiMessageKeys.BRAND_NOT_FOUND,
                    statusCodes.NOT_FOUND
                );
            } else {
                await this.database.brands.delete({
                    where: {
                        brand_id,
                        owner_id: user_id
                    }
                }).then(result => {
                    $logged(
                        `\n🛎️ A brand deleted {brand_id: ${brand_id}, name: "${result.name}"}\n`,
                        true,
                        { file: __filename.split('/src')[1], user_id },
                        this.request.ip
                    );
                    return $sendResponse.success(
                        {},
                        this.response
                    );
                }).catch(error => {
                    throw error;
                });
            }

        } catch (error: any) {
            $sendResponse.failed({ error }, this.response);
            $logged(
                `Deleting brand progress failed:\n${error}`,
                false,
                { file: __filename.split('/src')[1], payload: this.reqQuery },
                this.request.ip
            );
        }
    }
}

export default $callToAction(BrandController);