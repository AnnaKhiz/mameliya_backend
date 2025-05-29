require('dotenv').config();
const { port } = require('config');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const isProd = process.env.NODE_ENV === 'production';
const express = require('express');
const server = express();

server.use(cors({
	origin: isProd ? 'https://prod' : 'http://localhost:8080',
	credentials: true,
}))

server.use(cookieParser());

server.listen(port, (req, res) => {
	server.get('/', (req, res) => {
		res.send({ result: true, message: 'server started'})
	})
	console.log(`Server started successfully. Port [${port}]`);
})
