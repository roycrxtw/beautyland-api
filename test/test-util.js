
'use strict';

var expect = require('chai').expect;	
var fs = require('fs');

var util = require('../util.js');

describe('Testing for util.js', function(){
	this.timeout(5000);
	
	describe('util.loadHtml(): Get HTML contents by url', function(){
		it('statusCode should be 200', async function(){
			let url = 'https://www.google.com.tw';
			let result = await util.loadHtml(url);
			expect(result.statusCode).to.equal(200);
	
			url = 'https://www.ptt.cc/bbs/Beauty/index.html';
			result = await util.loadHtml(url);
			expect(result.statusCode).to.equal(200);
		});
	});

	
	describe('util.htmlToText(): Get plain text from specified html content', function(){
		it('should return expected text length', function(){
			let htmlBody = fs.readFileSync('./test/example-post.html', 'utf8');
			let text = util.htmlToText(htmlBody);
			expect(text.length).to.equal(726);
		});
	});
});

