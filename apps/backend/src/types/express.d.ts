declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email?: string; role?: string };
            flaskAPIAvailable?: boolean;
            files?: {
                [fieldname: string]: Express.Multer.File[];
            };
        }
        namespace Multer {
            interface File {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                destination: string;
                filename: string;
                path: string;
                buffer?: Buffer;
            }
        }
    }
}

export { };
