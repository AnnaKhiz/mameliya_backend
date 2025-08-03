const deepl = require('deepl-node');
const { deepLAPIKey } = require('../config/default');
const logger = require('../utils/logger')('translate');
const translator = new deepl.Translator(deepLAPIKey);

async function translateText(req, res, next) {
	const {
		description,
		title,
		langResult,
		langSource,
		tagHandling
	} = req.body;

	try {
		const resultDescription = await translator.translateText(description, langSource || null, langResult, { tagHandling });
		const resultTitle = await translator.translateText(title, langSource || null, langResult, { tagHandling });

		if (!resultDescription.text || !resultTitle.text) {
			logger.info(`${req.method} ${req.url} 403 Text was not translated`);
			return res.status(403).send({
				result: false,
				data: null,
				code: 403,
				message: 'No result'
			})
		}

		logger.info(`${req.method} ${req.url} 200 Text was translated successfully`);
		return res.status(200).send({
			result: true,
			data: { title: resultTitle.text, description: resultDescription.text },
			code: 200,
			message: 'Successfully'
		});
	} catch (error) {
		console.error('Error [TRANSLATE TEXT', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		return res.status(500).send({
			result: false,
			data: null,
			code: 500,
			message: 'Request [TRANSLATE TEXT] error'
		})
	}
}


module.exports = {
	translateText
}
