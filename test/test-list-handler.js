
/**
 * Project Beautyland API
 * Test for list-handler.js
 * @author Roy Lu(royvbtw) Sep 2017
 */

'use strict';

var expect = require('chai').expect;	

var handler = require('../list-handler.js');
var fs = require('fs');

const testUrls = [
	{url: 'http://imgur.com/70KeHU5', id: '70KeHU5'},
	{url: 'http://m.imgur.com/70KeHU5', id: '70KeHU5'},
	{url: 'http://i.imgur.com/70KeHU5', id: '70KeHU5'},
	{url: 'http://i.imgur.com/13wpSFj.jpg', id: '13wpSFj'},
	{url: 'http://imgur.com/a/Qai8x', id: 'nomatch'},
	{url: 'http://imgur.com/gallery/VCDXO', id: 'nomatch'},
	{url: 'https://royvbtw.uk/cats.jpg', id: 'nomatch'}
];

describe('Test for list-handler', function(){	
	describe('list-handler.getImgurId()', function(){
		it('should return expected imgur id', function(){
			let imgurId = '';
			testUrls.forEach( elem => {
				imgurId = handler.getImgurId(elem.url);
				expect(imgurId).to.equal(elem.id);
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
    let sample = null;
    before(function(){
      sample = fs.readFileSync('./test/sample-list.html', 'utf8');
    });

    it('should return expected list length', function(){
      const list = handler.getList(sample);
      expect(list.length).to.equal(9);
    }); 

    it('should have expected result loaded from sample-list.html', async function(){
      const list = handler.getList(sample);
      expect(list[3].author).to.equal('bbac99119');
      expect(list[3].title).to.equal('[神人] 光陽showgirl');
      expect(list[3].postId).to.equal('M.1502034628.A.9D5');
      expect(list[3].link).to.equal('https://www.ptt.cc/bbs/Beauty/M.1502034628.A.9D5.html');
    });
  });	
});









