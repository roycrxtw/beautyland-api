
'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;

var service = require('../main-service.js');

const DB_URL = 'mongodb://root:dbbl5566@ds031822.mlab.com:31822/beauty-land';
let preparedPosts = [{
	author: 'Karl',
	postId: 'test.id.karl',
	title: '[dis] 2 types of question mark',
	postDate: '8/06',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.karl.html',
	clickCount: 123,
	createdAt: 'Mon Aug 06 2017 11:24:26 GMT+0800 (台北標準時間)',
	imgUrls: ['http://i.imgur.com/G8mgxvB.jpg', 'http://i.imgur.com/aQOUYt3.jpg']
}, {
	author: 'Teemo',
	postId: 'test.id.teemo',
	title: 'Teemo can speak!',
	postDate: '8/07',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.teemo.html',
	clickCount: 56,
	createdAt: 'Mon Aug 07 2017 03:24:26 GMT+0800 (台北標準時間)',
	imgUrls: ['http://i.imgur.com/lYPV8uO.jpg', 'http://i.imgur.com/Wr9hEQe.jpg']
}, {
	author: 'Thrall',
	postId: 'test.id.thrall',
	title: 'For the horde',
	postDate: '8/02',
	link: 'https://www.ptt.cc/bbs/Beauty/test.id.thrall.html',
	clickCount: 22,
	createdAt: 'Mon Aug 02 2017 18:24:26 GMT+0800 (台北標準時間)',
	imgUrls: ['http://i.imgur.com/uJyaBIK.jpg', 'http://i.imgur.com/Pt0nQMQ.jpg']
}];

var connectionOptions = {
	keepAlive: 300000,
	connectTimeoutMS: 50000
}; 

var conn = null;
var testCollection = null;


describe.skip('Testing for main-service', function(){
	before('Add 3 posts to defaultList', async function(){
		try{			
			// Setup database test collection
			conn = await MongoClient.connect(DB_URL, connectionOptions);
			testCollection = conn.collection('test');
			testCollection.remove({});
		}catch(ex){
			expect(ex).to.be.null;
		}
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
		testCollection.remove({});
		done();
	});

	after(function(done){
		conn.close();
		done();
	});
});