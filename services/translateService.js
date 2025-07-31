const deepl = require('deepl-node');
const { deepLAPIKey } = require('../config/default');

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
			return res.status(403).send({
				result: false,
				data: null,
				code: 403,
				message: 'No result'
			})
		}

		return res.status(200).send({
			result: true,
			data: { title: resultTitle.text, description: resultDescription.text },
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
