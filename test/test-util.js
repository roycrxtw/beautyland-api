
/* eslint no-unused-expressions: "off" */

var expect = require('chai').expect;	
var fs = require('fs');

var util = require('../util.js');

describe('Testing for util.js', function() {
	this.timeout(5000);
	
	describe('util.loadHtml(): Get HTML contents by url', function() {
		it('statusCode should be 200', async function() {
			let url = 'https://www.google.com.tw';
			let result = await util.loadHtml(url);
			expect(result.statusCode).to.equal(200);
	
			url = 'https://www.ptt.cc/bbs/Beauty/index.html';
			result = await util.loadHtml(url);
			expect(result.statusCode).to.equal(200);
		});
	});

	
	describe('util.htmlToText(): Get plain text from specified html content', function() {
		it('should return expected text length', function() {
			let htmlBody = fs.readFileSync('./test/example-post.html', 'utf8');
			let text = util.htmlToText(htmlBody);
			expect(text.length).to.equal(726);
		});
	});


	describe('util.getImageSize(url): Get image size for a given url', function() {
		it('should return expected width and height', async function() {
			let imageUrl = 'http://i.imgur.com/78f9eAs.jpg';
			let expectedWidth = 1280, expectedHeight = 720;
			let result = await util.getImageSize(imageUrl);
			expect(result.width).to.equal(expectedWidth);
			expect(result.height).to.equal(expectedHeight);
		});
	});
});

