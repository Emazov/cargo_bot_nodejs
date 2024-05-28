require('dotenv').config();
const mongoose = require('mongoose');
const { Bot, Keyboard, InlineKeyboard } = require('grammy');
const { hydrate } = require('@grammyjs/hydrate');

const UserModel = require('./models/UserModel');

const MONGODB_URL = process.env.MONGODB_URL;
const BOT_API_TOKEN = process.env.BOT_API_TOKEN;

const db = () => {
	return mongoose
		.connect(MONGODB_URL)
		.then(() => {
			console.log('Mongo DB connected!');
		})
		.catch((err) => {
			console.log('Mongo DB connection error', err);
		});
};

const bot = new Bot(BOT_API_TOKEN);
bot.use(hydrate());

bot.api.setMyCommands([
	{
		command: 'check',
		description: 'check new updates',
	},
	{
		command: 'admin',
		description: 'Admin panel',
	},
]);

bot.command('start', async (ctx) => {
	const firstName = ctx.from.first_name;
	const registerKeyboard = new InlineKeyboard().text(
		'Регистрация',
		'registration'
	);
	await ctx.reply(`Добро пожаловать в Cargo Bot, ${firstName}!`, {
		reply_markup: registerKeyboard,
	});
});

bot.callbackQuery('registration', async (ctx) => {
	const telegramId = ctx.from.id;
	const firstName = ctx.from.first_name;
	const lastName = ctx.from.last_name;
	const username = ctx.from.username;

	const lastUserCargoCode = async () => {
		try {
			const lastUser = await UserModel.findOne().sort({ createdAt: -1 });

			let cargoId;
			if (!lastUser) {
				cargoId = await `0_${telegramId}`;
			} else {
				const lastUserCargo = parseInt(lastUser.cargoId.split('_')[0]);
				cargoId = await `${lastUserCargo + 1}_${telegramId}`;
			}

			const isUser = await UserModel.findOne({ telegramId });
			if (isUser) {
				return await ctx.callbackQuery.message.editText(
					`Вы уже зарегистрированы!\nВаш Cargo код: ${isUser.cargoId}`
				);
			}

			const newUser = new UserModel({
				telegramId,
				cargoId,
				firstName,
				lastName: lastName ? lastName : '',
				username: username ? username : '',
				role: 'USER',
			});

			await newUser.save();

			return await ctx.callbackQuery.message.editText(
				`Вы успешно зарегистрированы!\nВаш Cargo код: ${cargoId}`
			);
		} catch (error) {
			console.log('Ошибка при получении пользователя: ', error);
			return null;
		}
	};

	lastUserCargoCode();
	await ctx.answerCallbackQuery();
});

bot.command('admin', async (ctx) => {
	const telegramId = ctx.from.id;
	const user = await UserModel.findOne({ telegramId });
	const userRole = user.role;

	if (userRole === 'USER') {
		return await ctx.reply(`You don't have access!!`);
	}

	await ctx.reply(`Welcome, Admin!`);
});

bot.command('check', async (ctx) => {
	const telegramId = ctx.from.id;

	const user = await UserModel.findOne({ telegramId });

	await ctx.reply(
		`Telegram ID: ${user.telegramId}\nИмя: ${user.firstName}\nUsername: ${user.username}\nВаш Cargo код: ${user.cargoId}\nСтатус доставки: In progress`
	);
});

const startBot = async () => {
	try {
		await db();
		bot.start();
		console.log('Bot is running');
	} catch (error) {
		console.log('Start bot error', error);
	}
};

startBot();
