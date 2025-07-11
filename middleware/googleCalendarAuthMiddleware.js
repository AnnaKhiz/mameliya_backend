const { oauth2Client, getAuthUrl, getTokens } = require('../services/googleauthService');
const isProd = process.env.NODE_ENV === 'production';

async function googleCalendarAuthMiddleware(req, res, next) {
	const code = req.query.code;
	const { googleToken } = req.cookies;

	try {
		const { type: calendarName, redirect } = req.query;

		if (!googleToken && !code) {
			const state = encodeURIComponent(JSON.stringify({ calendarName, redirect }))
			const url = getAuthUrl(state);
			return res.redirect(url);
		}

		const rawState = req.query.state;
		let stateData = null;
		stateData = JSON.parse(decodeURIComponent(rawState));
		req._queryData = stateData;

		if (code) {
			const { tokens } = await oauth2Client.getToken(code);
			oauth2Client.setCredentials(tokens);

			res.cookie('googleToken', tokens.access_token, {
				httpOnly: true,
				secure: isProd,
				sameSite: isProd ? 'None' : 'Lax',
				path: '/user',
				expires: new Date(Date.now() + 86400000)
			});

			req._googleToken = { googleToken: tokens };

			return next();
		}

		req._googleToken = { googleToken: googleToken };
		next();

	} catch (error) {
		console.log('Error [google auth middleware]: ', error)
		return res.status(500).send({
			result: false,
			code: 500,
			message: 'Ошибка авторизации Google',
		});
	}
	next();
}

module.exports = { googleCalendarAuthMiddleware }

