
'use strict';

var expect = require('chai').expect;	

var DatabaseService = require('../database-service');
var MongoClient = require('mongodb').MongoClient;
var connectionOptions = {
	keepAlive: 300000,
	connectTimeoutMS: 50000
}; 

// Use a local mongodb to test the database-service.js
const TEST_DB_URL = require('../config/db.config').testUrl;
var db = null;
var testCollection = null;
let dbService = null;

let preparedPosts = [{
	author: 'Karl',
	postId: 'test.id.karl',
	title: '[dis] 2 types of question mark',
	postDate: '8/06',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.karl.html',
	clickCount: 123,
	createdAt: new Date('2017-08-06T13:24:26.000Z'),
	imgUrls: ['http://i.imgur.com/G8mgxvB.jpg', 'http://i.imgur.com/aQOUYt3.jpg']
}, {
	author: 'Teemo',
	postId: 'test.id.teemo',
	title: 'Teemo can speak!',
	postDate: '8/06',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.teemo.html',
	clickCount: 56,
	createdAt: new Date('2017-08-06T09:24:26.000Z'),
	imgUrls: ['http://i.imgur.com/lYPV8uO.jpg', 'http://i.imgur.com/Wr9hEQe.jpg']
}, {
	author: 'Thrall',
	postId: 'test.id.thrall',
	title: 'For the horde',
	postDate: '8/02',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.thrall.html',
	clickCount: 22,
	createdAt: new Date('Mon Aug 02 2017 18:24:26 GMT+0800 (台北標準時間)'),
	imgUrls: ['http://i.imgur.com/uJyaBIK.jpg', 'http://i.imgur.com/Pt0nQMQ.jpg']
}];


describe('Testing for database-service', function(){
	this.timeout(15000);

	before(async function(){
		dbService = await DatabaseService(TEST_DB_URL);	// init for DatabaseService
		
		// Set up a connection directly to testing database
		db = await MongoClient.connect(TEST_DB_URL, connectionOptions);
		testCollection = db.collection('test');
		testCollection.remove({});
	});

	beforeEach(function(done){
		// Insert test documents into database
		testCollection.insertMany(preparedPosts, function(err, result){
			expect(err).to.be.null;
			expect(result.result.n).to.equal(3);
			done();
		});
	});

	afterEach(function(done){
		// Clear up test documents.
		testCollection.remove({}, function(err, result){
			expect(err).to.be.null;
			done();
		});
	});

	after(function(done){
		db.close();
		done();
	});


	describe('Check the test collection status', function(){
		it('should contain 3 testing documents', async function(){
			let count = await testCollection.count();
			expect(count).to.equal(3);
		});
	});


	describe('database-service.isConnected()', function(){
		it('should return true', async function(){
			let flag = await dbService.isConnected();
			expect(flag).to.be.true;
		});
	});


	describe('database-service.checkPostExists()', function(){
		it('should return true/false if the post does/does\'t exist.', async function(){
			let flag = await dbService.checkPostExists('test.id.thrall', 'test');
			expect(flag).to.be.true;

			flag = await dbService.checkPostExists('test.id.voljin', 'test');
			expect(flag).to.be.false;
		});
	});


	describe('database-service.savePost(): Save post into database', function(){
		it('should return ok', async function(){
			let preparedPost = {
				author: 'roy',
				postId: 'test.id.roy',
				title: 'A greeting from Roy',
				postDate: '8/07',
				link: 'https://www.ptt.cc/bbs/Beauty/test.id.roy.html',
				clickCount: 21,
				createdAt: new Date,
				imgUrls: ['http://i.imgur.com/G8mgxvB.jpg', 'http://i.imgur.com/aQOUYt3.jpg']
			};
			let result = await dbService.savePost(preparedPost, 'test');
			expect(result.ok).to.equal(1);
		});
	});

	describe('database-service.readPost(postId): Read post from database', function(){
		it('should return expected post document.', async () => {
			let post = await dbService.readPost('test.id.teemo', 'test');
			expect(post).to.deep.equal(preparedPosts[1]);
		});
	});


	describe('database-service.readPosts(query, opts): Read posts from database', function(){
		it('should return 2 post documents.', async () => {
			let timeFrom = new Date('2017-08-06T00:00:00.000Z');
			let timeTo = new Date('2017-08-07T00:00:00.000Z');
			let posts = await dbService.readPosts({
				query: {createdAt: {$gte: timeFrom, $lt: timeTo}},
				collectionName: 'test'
			});
			expect(posts.length).to.equal(2);
		});
	});


	describe('database-service.deletePost(postId): Delete post from database', function(){
		it('should return ok', async function(){
			let result = await dbService.deletePost('test.id.teemo', 'test');
			expect(result.ok).to.equal(1);
			
			// to delete teemo again
			let result1 = await dbService.deletePost('test.id.teemo', 'test');
			expect(result1.ok).to.equal(1);
			expect(result1.n).to.equal(0);
		});
	});

	describe('database-service.updatePostClickCount(postId): Update post click count by 1', function(){
		it('should return true if postId exists', async function(){
			let result = await dbService.updatePostClickCount({
				postId: 'test.id.teemo', 
				collectionName: 'test'
			});
			expect(result).to.be.true;
		});

		it('should return false if postId does not exist', async function(){
			// to test if postId doesn't exist
			let result1 = await dbService.updatePostClickCount({
				postId: 'test.id.ghost', 
				collectionName: 'test'
			});
			expect(result1).to.be.false;
		});

		it('should have expected click count if process finished', async function(){
			await dbService.updatePostClickCount({
				postId: 'test.id.teemo', 
				collectionName: 'test'
			});

			let result = await testCollection.findOne({postId: 'test.id.teemo'});
			expect(result.clickCount).to.equal(57);
		});
	});
});


 

