/**
 * @fileoverview Tests for cw.record
 */

goog.provide('cw.Test.TestRecord');

goog.require('cw.UnitTest');
goog.require('cw.record');

// An example of cw.record.Record usage:

/**
 * @param {*} body
 * @param {number} qid
 * @extends {cw.record.Record}
 * @constructor
 */
cw.Test.TestRecord.Question = function(body, qid) {
	cw.record.Record.call(this, 'Question', [body, qid]);
	/** @type {*} */
	this.body = body;
	/** @type {number} */
	this.qid = qid;
};
goog.inherits(cw.Test.TestRecord.Question, cw.record.Record);


// TODO: add some actual tests
