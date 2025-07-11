const { google} = require("googleapis");
const { googleId, googleRedirectUrl, googleSecret } = require('../config/default');

const oauth2Client = new google.auth.OAuth2(
	googleId,
	googleSecret,
	googleRedirectUrl
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getAuthUrl(state = null) {
	return oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
		prompt: 'consent',
		state,
	})
}

async function getTokens(code) {
	const { tokens } = await oauth2Client.getToken(code);
	oauth2Client.setCredentials(tokens);
	return tokens;
}

module.exports = { oauth2Client, getAuthUrl, getTokens }
