'use strict';
const express = require('express');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const { app, runServer, closeServer } = require('../server');
const {TEST_DATABASE_URL} = require('../config');
const expect = chai.expect;
const { Users, PastCompositions } = require('../model');
chai.use(chaiHttp);

function seedPastCompositionData() {
	console.info('seeding past composition data');
	return Users.create({
		username: 'Bradley',
		email: 'brad@netsky.com',
		password: 'jargon'
		})
		.then(function(user) {
			for (let i = 0; i < 3; i++) {
				return generatePastCompositionData(user);
			}
		})
		.catch(function(err) {
			console.error(err);
		})
}

function generatePastCompositionData(user) { 
	let date = new Date();
    let dateString = date.toString();
    let truncatedDateString = dateString.substring(0, dateString.length -36);

	return PastCompositions.create({
		user: user._id,
		title: faker.lorem.words(),
		music: faker.internet.domainWord(),
		creation: truncatedDateString
	})
	.catch(function(err) {
		console.error(err);
	}) 
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('PastCompositions API resource', function() {

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedPastCompositionData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('Get endpoint', function() {
	
		it('should list all compositions on GET with correct fields', function() {
			let res;
			let pastCompositionVar;
			return chai
			.request(app)
			.get('/compositions')
			.then(function(_res) {
				res = _res;
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.compositions).to.be.a('array');
				expect(res.body.compositions.length).to.be.at.least(1);
				const expectedKeys = ['id', 'username', 'title', 'music', 'creation'];
				res.body.compositions.forEach(function(composition) {
					expect(composition).to.be.a('object');
					expect(composition).to.include.keys(expectedKeys);
				});
				pastCompositionVar = res.body.compositions[0];
				return PastCompositions.find({ _id: pastCompositionVar.id })
			})
			.then(function(compositions) {
				expect(JSON.stringify(pastCompositionVar.id)).to.eql(JSON.stringify(compositions[0]._id));
				expect(JSON.stringify(pastCompositionVar.username)).to.eql(JSON.stringify(compositions[0].user.username));
				expect(pastCompositionVar.title).to.eql(compositions[0].title);
				expect(pastCompositionVar.music).to.eql(compositions[0].music);
				expect(pastCompositionVar.creation).to.eql(compositions[0].creation);
				return PastCompositions.count();
			})
			.then(function(count) {
				expect(res.body.compositions).to.have.lengthOf(count);
			});
		});
	});

	describe('POST endpoint', function() {
		it('should add a new composition', function() {
			let date = new Date();
    		let dateString = date.toString();
    		let truncatedDateString = dateString.substring(0, dateString.length -36);

			return Users.create({
				username: 'Brandon',
				email: 'bradon@netsky.com',
				password: 'jargonlift'
				})
				.then(function(user) {

					return PastCompositions.create({
						user: user._id,
						title: faker.lorem.words(),
						music: faker.internet.domainWord(),
						creation: truncatedDateString
					})
				})
				.then(function(composition) {
					return PastCompositions.find({_id: composition._id})
				})
				.then(function(compositions) {
					let newComposition = compositions[0].serialize();
					console.log(newComposition);
					return chai.request(app)
						.post('/compositions')
						.send(newComposition)
						.then(function(res) {
							console.log(res.body);
							expect(res).to.have.status(201);
							expect(res).to.be.json;
							expect(res.body).to.be.a('object');
							expect(res.body).to.include.keys('id', 'username', 'title', 'music', 'creation');
							expect(res.body.id).to.not.be.null;
							expect(res.body.username).to.equal(newComposition.username);
							expect(res.body.title).to.equal(newComposition.title);
							expect(res.body.music).to.eql(newComposition.music);
							return PastCompositions.find({_id: res.body.id});
						})
						.then(function(compositions) {
							expect(compositions[0].user_id).to.equal(newComposition.user_id);
							expect(compositions[0].title).to.equal(newComposition.title);
							expect(JSON.stringify(compositions[0].music)).to.equal(JSON.stringify(newComposition.music));
						})
						.catch(function(err) {
							console.error(err);
						})	
				})
				.catch(function(err) {
					console.error(err);
				}) 
		});
	});

	describe('DELETE endpoint', function() {
		it('should delete a composition by id', function() {

			let composition;
			return PastCompositions
				.find()
				.then(function(_composition) {
					composition = _composition[0];
					return chai.request(app).delete(`/compositions${composition.id}`);
				})
				.then(function(_composition) {
					expect(_composition).to.have.status(404);
					expect(_composition.files).to.equal(undefined);
				})
		});
	});
});