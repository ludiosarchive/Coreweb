/**
 * @fileoverview Math and special numbers
 */

goog.provide('cw.math');


/**
 * The largest integer that can be represented in JavaScript without
 * losing integral precision.
 */
cw.math.LARGEST_INTEGER = Math.pow(2, 53);


/**
 * A number larger than the largest integer than can be represented
 * in JavaScript.  Note: the ` + 1`ed number is not larger.
 */
cw.math.LARGER_THAN_LARGEST_INTEGER = cw.math.LARGEST_INTEGER + 2;
