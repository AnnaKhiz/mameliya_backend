const multer = require('multer');
const sharp = require('sharp');
const logger = require('../utils/logger')('parse-upload-file-middleware');
const { bucket } = require('../utils/firebaseConfigSDK');
const upload = multer({ storage: multer.memoryStorage() });


async function fileProcessingMiddleware(req, res, next) {
	if (!req.file) {
		return next();
	}

	try {
		const processedBuffer = await sharp(req.file.buffer)
			.resize(500, 500, { fit: 'inside' })
			.toFormat('jpeg')
			.jpeg({ quality: 80 })
			.toBuffer();

		const fileName = `avatars/${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`;

		const file = bucket.file(fileName);
		await file.save(processedBuffer, {
			metadata: { contentType: 'image/jpeg' },
		});
		await file.makePublic();
		req.processedFileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
		logger.info(`${req.method} ${req.url} 200 processedFileUrl=${req.processedFileUrl}`);
		next();
	} catch (error) {
		console.log('Error [file processing middleware', error);
		logger.info(`[${req.method}] ${req.url} 500 Error message: ${error}`);
		next(error);
	}
}

module.exports = {
	upload,
	fileProcessingMiddleware,
};
