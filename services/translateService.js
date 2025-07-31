const deepl = require('deepl-node');
const { deepLAPIKey } = require('../config/default');

const translator = new deepl.Translator(deepLAPIKey);

async function translateText(req, res, next) {
	const { text, langResult, langSource } = req.body;

	try {
		const result = await translator.translateText(text, langSource, langResult);

		if (!result.text) {
			return res.status(403).send({
				result: false,
				data: null,
				code: 403,
				message: 'No result'
			})
		}

		return res.status(200).send({
			result: true,
			data: result.text,
			code: 200,
			message: 'Successfully'
		});
	} catch (error) {
		console.error('Error [TRANSLATE TEXT', error);
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
