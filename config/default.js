module.exports = {
	port: process.env.PORT || 3001,
	dbUrl: process.env.DBURL || '',
	jwtKey: process.env.JWTKEY,
	jwtExpires: process.env.JWT_EXP || '24h'
}
