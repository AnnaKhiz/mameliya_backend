module.exports = {
	port: process.env.PORT || 3001,
	dbUrl: process.env.DBURL || '',
	jwtKey: process.env.JWTKEY,
	jwtExpires: process.env.JWT_EXP || '24h',
	googleId: process.env.GOOGLE_CLIENT_ID || '',
	googleSecret: process.env.GOOGLE_CLIENT_SECRET || '',
	googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL
}
