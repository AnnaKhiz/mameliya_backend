require('dotenv').config();
const { port } = require('config');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { router: authRouter } = require('./routes/authRouter');
const isProd = process.env.NODE_ENV === 'production';
const express = require('express');
const server = express();

server.use(cors({
	origin: isProd ? 'https://prod' : 'http://localhost:5173',
	credentials: true,
}))

server.use(cookieParser());

server.listen(port, (req, res) => {
	server.get('/', (req, res) => {
		res.send({ result: true, message: 'server started'})
	})
	console.log(`Server started successfully. Port [${port}]`);
})

const jsonBodyParser = express.json();
server.use(jsonBodyParser);
server.use(express.urlencoded({ extended: true }));

server.use('/api/user', authRouter);
