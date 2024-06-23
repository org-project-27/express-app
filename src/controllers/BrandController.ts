import {Controller} from "#types/controller";
import {Request, Response} from "express";
import {$callToAction, $sendResponse} from "#helpers/methods";
import {validRequiredFields} from "#helpers/inputValidation";
import {$logged} from "#helpers/logHelpers";
import {$filterObject} from "#helpers/generalHelpers";

class BrandController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);

        this.actions['GET']['/all'] = this.getBrands;
        this.actions['POST']['/register'] = this.registerBrand;
    }

    public getBrands = async () => {
        const brands = await this.database.brands.findMany();
        const count = await this.database.brands.count();
        return $sendResponse.success({brands, count}, this.response);
    }
    public registerBrand = async () => {
        const {user_id} = JSON.parse(this.reqBody.authentication_result).payload;
        const payload = this.reqBody;
        const required_fields = validRequiredFields(
            [
                'name',
                'email',
            ],
            this.reqBody);

        if (required_fields.length > 0) {
            return $sendResponse.failed({required_fields}, this.response);
        }

        await this.database.brands.create({
            data: {
                owner_id: user_id,
                name: payload.name,
                logo: payload.logo,
                email: payload.email,
                bio: payload.bio,
            }
        }).then((result: any) => {
            $sendResponse.success({result}, this.response);
            $logged(
                `\n🛎️New brand created {brand_id: ${result.brand_id}, name: "${result.name}", email: "${result.email}"}\n`,
                true,
                {file: __filename.split('/src')[1]},
                this.request.ip
            );
        }).catch((error: any) => {
            $sendResponse.failed({error}, this.response);
            $logged(
                `Brand creation progress failed {\n${JSON.stringify(payload)}\n${error}`,
                false,
                {file: __filename.split('/src')[1]}
            );
        })
    }
}

export default $callToAction(BrandController);