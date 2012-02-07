/**
 * @fileoverview Provides a Record that works sort of like a Python namedtuple
 * 	or a Clojure defrecord.
 */

goog.provide('cw.record');

goog.require('cw.repr');
goog.require('cw.eq');


/**
 * A Record is equal to Records that have the same constructor and contents.
 * Provides a nice repr as well.  This is useful only for immutable records,
 * because you cannot change Record's view of the record contents.
 *
 * See Test/TestRecord.js for an example.
 *
 * @param {string} recordName
 * @param {!Array.<*>} recordContents
 * @constructor
 */
cw.record.Record = function(recordName, recordContents) {
	/**
	 * @type {string}
	 * @private
	 */
	this.recordName_ = recordName;
	/**
	 * @type {!Array.<*>}
	 * @private
	 */
	this.recordContents_ = recordContents;
};

/**
 * Test two Records for equality.
 * @param {*} other
 * @param {Array.<string>=} eqLog
 * @return {boolean}
 */
cw.record.Record.prototype.equals = function(other, eqLog) {
	return (
		goog.isObject(other) &&
		this.constructor == other.constructor &&
		cw.eq.equals(this.recordContents_, other.recordContents_, eqLog));
};

/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.record.Record.prototype.__reprPush__ = function(sb, stack) {
	sb.push("new ", this.recordName_, "(");
	var comma = "";
	for(var i=0; i < this.recordContents_.length; i++) {
		sb.push(comma);
		comma = ", ";
		cw.repr.reprPush(this.recordContents_[i], sb, stack);
	}
	sb.push(")");
};
