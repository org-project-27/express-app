import { v4 as uuidv4 } from 'uuid';
import { Controller } from '#types/controller';
import { $logged } from '~/assets/helpers/logHelpers';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { $callToAction, $sendResponse } from '#helpers/methods';
import apiMessageKeys from '~/assets/constants/apiMessageKeys';
import multer from 'multer';
import statusCodes from "#assets/constants/statusCodes";

class UploadController extends Controller {
  constructor(request: Request, response: Response) {
    super(request, response);
    this.actions['POST']['/example'] = this.example;
  }
  public example = async () => {
    try {
      const object_id = this.reqBody.object_id;
      const object = await this.database.objects.findUnique({
        where: { id: object_id },
      });

      if (!object) {
        $logged(`Object not found: ${object_id}`, false, { from: 'upload', object_id });
        return $sendResponse.failed({}, this.response, apiMessageKeys.SOMETHING_WENT_WRONG, 500);
      }

      $sendResponse.success(
          {
            filename: object.name,
            path: `http://localhost:5501/cdn/${object_id}`,
          },
          this.response
      );
    } catch (error) {
      $logged(
          `Object uploading progress failed\n${error}`,
          false,
          { file: __filename.split('/src')[1], payload: this.reqBody },
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
}

export function uploader(request: Request, response: Response, next: NextFunction) {
  try {
    const authentication_result = JSON.parse(request.body.authentication_result);
    const { user_id } = authentication_result.payload;
    const database = new PrismaClient();
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const { mimetype } = file;
        const fileType = mimetype.split('/')[0];
        console.log(fileType);
        const category = ['image', 'video', 'audio'].includes(fileType) ? fileType : 'other';
        const path = `cdn/${category}/`;

        cb(null, path);
      },
      filename: async function (req, file, cb) {
        const { originalname, mimetype } = file;
        const extension = originalname.split('.').pop();
        const path = `${Date.now()}.${extension}`;
        const id = uuidv4();
        await database.objects.create({
          data: {
            id,
            name: originalname,
            type: mimetype,
            path,
            user_id: user_id,
          },
        });

        req.body['object_id'] = id;
        cb(null, path);
      },
    });
    const upload = multer({ storage });
    return upload.single('file')(request, response, next);
  } catch (error) {
    $logged(
        `Object uploading progress failed\n${error}`,
        false,
        { file: __filename.split('/src')[1], payload: request.body },
        request.ip
    );
    return $sendResponse.failed(
        { error },
        response,
        apiMessageKeys.SOMETHING_WENT_WRONG,
        statusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

export default $callToAction(UploadController);
