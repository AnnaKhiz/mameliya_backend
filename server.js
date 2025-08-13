require('dotenv').config();
const { port } = require('config');
const logger = require('./utils/logger')('server');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { router: authRouter } = require('./routes/authRouter');
const { router : mamaDataRouter } = require('./routes/mamaDataRouter');
const { router: googleCalendarRouter } = require('./routes/googleRouter');
const { router: userRouter } = require('./routes/userRouter');
const { router: dailyRitualsRouter } = require('./routes/dailyRitualsRouter');
const { router: translateRouter } = require('./routes/translateRoute');
const { router: notificationsRouter } = require('./routes/notificationRoute');
const isProd = process.env.NODE_ENV === 'production';
const express = require('express');
const server = express();
const cron = require('node-cron');
let knexLib = require('knex');
const knexConfig = require('./knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

server.use(cors({
	origin: isProd ? 'https://prod' : 'http://localhost:5173',
	credentials: true,
}))

server.use(cookieParser());

cron.schedule('59 23 * * *', async () => {
	logger.info('reset_timer', 'Timer reset 23:59.')
	await knex('timer_details').update({
		paused_time: null,
		is_paused: false,
		paused_at: null,
		is_used_today: false
	});

	const users = await knex('users').select('userId');
	const now = Date.now();
	const notifications = users.flatMap(({ userId }) => [{
			userId: userId,
			message: 'Таймер \"Время для себя\" был обнулен!',
			created_at: now
		},
		{
			userId: userId,
			message: 'Ты сегодня не использовала таймер \"Время для себя\"!',
			created_at: now
		}]
	)

	await knex('notifications').insert(notifications);
});
server.listen(port, (req, res) => {
	server.get('/', (req, res) => {
		res.send({ result: true, message: 'server started'})
	})
	console.log(`Server started successfully. Port [${port}]`);
	logger.info(`Server started successfully. Port [${port}]`)
})


const jsonBodyParser = express.json();
server.use(jsonBodyParser);
server.use(express.urlencoded({ extended: true }));

server.use('/user', authRouter);
server.use('/user/data', userRouter);
server.use('/user/mama', mamaDataRouter);
server.use('/user/google', googleCalendarRouter);
server.use('/user/rituals', dailyRitualsRouter);
server.use('/user/translate', translateRouter);
server.use('/user/notifications', notificationsRouter);
