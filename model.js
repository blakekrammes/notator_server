'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
	username: {type: String, required: true},
	email: {type: String, required: true},
	password: {type: String, required: true}
});

const pastCompositionSchema = mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
	title: {type: String},
	music: {type: String},
	clef: {type: String},
	timeSignature: {type: String},
	baseNoteValue: {type: String},
	key: {type: String},
	creation: {type: String}
});

pastCompositionSchema.pre('find', function(next) {
	this.populate('user');
	next();
});

pastCompositionSchema.pre('findOne', function(next) {
	this.populate('user');
	next();
});

pastCompositionSchema.pre('findById', function(next) {
	this.populate('user');
	next();
});

pastCompositionSchema.pre('findByIdAndUpdate', function(next) {
	this.populate('user');
	next();
});

pastCompositionSchema.methods.serialize = function() {
	return {
		id: this._id,
		username: this.user.username,
		title: this.title,
		music: this.music,
		clef: this.clef,
		timeSignature: this.timeSignature,
		baseNoteValue: this.baseNoteValue,
		key: this.key,
		creation: this.creation
	};
};

userSchema.methods.serialize = function() {
	return {
		id: this._id,
		username: this.username,
		email: this.email
	};
};

userSchema.methods.validatePassword = function(password) {
	return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
	return bcrypt.hash(password, 10);
}

const Users = mongoose.model('Users',userSchema);
const PastCompositions = mongoose.model('PastCompositions', pastCompositionSchema);

module.exports = { Users, PastCompositions };