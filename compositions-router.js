'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const router = express.Router();
const { localStrategy, jwtStrategy } = require('./auth/strategies')
router.use(express.json());
router.use(express.static('public/searches'));

mongoose.Promise = global.Promise;

const { PORT } = require('./config');
const { Users, PastCompositions } = require('./model');

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/', (req, res) => {
	console.log('Retrieving Compositions');
	PastCompositions.find()
	.then(compositions => {
		res.json({
			compositions: compositions.map(
				(composition) => composition.serialize())
		});
	})  
	.catch(err => {
		console.error(err);
		res.status(500).json({ message: 'Internal server error' });
	});
});

router.get('/currentuser', jwtAuth, (req, res) => {
let userObjectId = mongoose.Types.ObjectId(req.user.id);

  	PastCompositions
    .find({user: userObjectId})
    .then(function(compositions) { 
    	return res.json({
    				compositions: compositions.map(
    					(composition) => composition.serialize())
    	}); 
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went horribly awry' });
    });
});

router.post('/', (req, res) => {
	console.log('posting new composition');
	const requiredFields = ['username', 'title', 'music', 'creation'];
	requiredFields.forEach(field => {
		if (!(field in req.body)) {
			const message = `Missing ${field} in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	});
	Users
	.find( { username: req.body.username } )
	.then(users => {
		if (users) {
			PastCompositions
			.create({
				user: users[0]._id,
				title: req.body.title,
				music: req.body.music,
				creation: req.body.creation
			})
			.then(function(composition) {
				PastCompositions.find({_id: composition._id}, function(err, results) {
					res.status(201).json(results[0].serialize());
				})
			})
			.catch(err => {
				console.error(err);
				res.status(500).json({ error: 'Something went wrong '});
			});
		}
		else {
			const message = 'User not found.';
			console.error(message);
			return res.status(400).send(message);
		}
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({ error: 'Something went horribly awry' });
	});
});

router.delete('/:id', (req, res) => {
	console.log('deleting composition');
	PastCompositions
	.findByIdAndRemove(req.params.id)
	.then(() => {
		console.log(`Deleted composition with id ${req.params.id}`);
		res.status(204).end();
	});
});

module.exports = router;