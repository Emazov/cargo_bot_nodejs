const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
	telegramId: { type: String, required: true, unique: true },
	// chatId: { type: String, required: true, unique: true },
	cargoId: { type: String, required: true, unique: true },
	firstName: { type: String, required: true },
	lastName: { type: String },
	username: { type: String, unique: true },
	role: { type: String, required: true },
	// status: { type: String, required: true },
});

UserSchema.set('timestamps', true);

module.exports = model('User', UserSchema);
