
'use strict';

var expect = require('chai').expect;	

var handler = require('../list-handler.js');
var fs = require('fs');

describe('Test for list-handler', function(){	
	describe('list-handler.getImgurId()', function(){
		it('should return expected imgur id', function(){
			let urls = ['http://imgur.com/70KeHU5', 
				'http://m.imgur.com/70KeHU5', 
				'http://i.imgur.com/70KeHU5'];
			let imgurId = '';
			urls.forEach(function(element) {
				imgurId = handler.getImgurId(element);
				expect(imgurId).to.equal('70KeHU5');
			}, this);
		});
	});

	describe('list-hanlder.getImgurUrls()', function(){
		it('should return expected amount of imgur urls', function(){
			let plainText = fs.readFileSync('./test/example-plainText.txt', 'utf8');
			let urls = handler.getImgurUrlsFromText(plainText);
			expect(urls.length).to.equal(8);
			expect(urls[5]).to.equal('http://i.imgur.com/vNaLYyZ.jpg08');
		});
	});

	describe('list-handler.getPostId(): Get postId from a ptt url', function(){
		it('should return an expected post id.', function(){
			let url = 'https://www.ptt.cc/bbs/StupidClown/M.1501823338.A.A21.html';
			let expectedPostId = 'M.1501823338.A.A21';
			let postId = handler.getPostId(url);
			expect(postId).to.equal(expectedPostId);
	
			let url2 = '/bbs/Gossiping/M.1501922938.A.4F6.html';
			let expectedPostId2 = 'M.1501922938.A.4F6';
			let postId2 = handler.getPostId(url2);
			expect(postId2).to.equal(expectedPostId2);
		});
	});


	describe('list-handler.getList(): Get list from html', function(){
		let file = null;
		before(function(){
			file = fs.readFileSync('./test/example-list.html', 'utf8');
		});
	
		it('should return expected list length', function(){
			let list = handler.getList(file);
			expect(list.length).to.equal(13);
		}); 
	
		it('should has expected result loaded from example-list.html', async function(){
			let results = handler.getList(file);
			expect(results[3].author).to.equal('bbac99119');
			expect(results[3].title).to.equal('[神人] 光陽showgirl');
			expect(results[3].postDate).to.equal('8/06');
			expect(results[3].postId).to.equal('M.1502034628.A.9D5');
			expect(results[3].link).to.equal('https://www.ptt.cc/bbs/Beauty/M.1502034628.A.9D5.html');
		});
	});	
});









