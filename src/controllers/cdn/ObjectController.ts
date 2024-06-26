import { Controller } from '#types/controller';
import { Request, Response } from 'express';
import { $callToAction, $sendResponse } from '#helpers/methods';
import apiMessageKeys from '~/assets/constants/apiMessageKeys';
import statusCodes from '~/assets/constants/statusCodes';
import { $logged } from '~/assets/helpers/logHelpers';
import pth from 'path';

class ObjectController extends Controller {
  constructor(request: Request, response: Response) {
    super(request, response);
    this.actions['GET']['/'] = this.findObject;
  }
  public findObject = async () => {
    const { id } = this.request.params;
    const authentication_result = JSON.parse(this.reqBody.authentication_result);
    const { user_id } = authentication_result.payload;
    if (!id) {
      return $sendResponse.failed({}, this.response, apiMessageKeys.PARAM_REQUIRED, statusCodes.BAD_REQUEST);
    }

    let object = await this.database.objects.findUnique({
      where: { id: id },
    });

    if (!object) {
      return $sendResponse.failed({}, this.response, apiMessageKeys.OBJECT_NOT_FOUND, statusCodes.NOT_FOUND);
    }

    if (object.user_id !== user_id) {
      return $sendResponse.failed({}, this.response, apiMessageKeys.OBJECT_NOT_FOUND, statusCodes.NOT_FOUND);
    }

    let path = object.path;
    let file = this.cdn.getObject(path);

    if (!file) {
      $logged(`File not found: ${path}`, false, { from: 'cdn', file: path });
      return $sendResponse.failed({}, this.response, apiMessageKeys.OBJECT_NOT_FOUND, statusCodes.NOT_FOUND);
    }

    return this.response.sendFile(pth.resolve(file));
  };
}

export default $callToAction(ObjectController);
