import {Controller} from "#types/controller";
import {Request, Response} from "express";
import multer from "multer";
import express from "express";
import {$callToAction, $sendResponse} from "#helpers/methods";

class UploadController extends Controller {
    constructor(request: Request, response: Response) {
        super(request, response);
        this.actions['POST']['/example'] = this.example;
    }
    public example = () => {
        $sendResponse.success(
            {
                filename: this.request.file.filename,
                path: `http://localhost:5501/uploads/${this.request.file.filename}`
            },
            this.response,
        )
    }
}


export default function () {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'src/public/uploads/')
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '.mp3')
        }
    })

    const upload = multer({ storage })

    return express().use('/', upload.single('file'), $callToAction(UploadController));
}