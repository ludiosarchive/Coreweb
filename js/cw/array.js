/**
 * @fileoverview More array utilities
 */

goog.provide('cw.array');

goog.require('goog.asserts');


/**
 * Return the `uniq' array for {@code a}. The returned array will be shorter,
 * or the same size. The returned array will always be sorted, though
 * maybe not in the way you want.
 *
 * This implementation doesn't add the array elements to an object
 * to check uniqueness, so it works with any mixture of types.
 *
 * This implementation jumps through a lot of hoops to avoid doing
 * a naive O(N^2) uniq where every item would be ==='ed to every
 * other item.
 *
 * See also {@code goog.array.removeDuplicates}, but it has problems
 * when there are a mixture of primitive types in the array. TODO: combine
 * the best of both, by using {@code goog.getUid} for objects/arrays here.
 *
 * @param {!Array} a The array object to "uniq"
 * @return {!Array} the uniq'ed array.
 */
cw.array.uniq = function(a) {
	// Because JavaScript's Array.prototype.sort ignores types, it doesn't
	// actually work. Observe:
	// >>> a = [3, 3, 2, 0, -2, '2', '3', 3, '3', '3', 3, 3, 3, '3', 3, '3', 3, 3.0, 3.0]
	// >>> a.sort()
	// [-2, 0, 2, "2", 3, 3, "3", 3, "3", "3", 3, 3, 3, "3", 3, "3", 3, 3, 3]
	//
	// So, we use a custom sort function that compares the 'goog.typeOf'
	// value too. This should work most of the time.

	var typeToPrefix = {
		'number': '1',
		'string': '2',
		'boolean': '3',
		'object': '4',
		'function': '5',
		'undefined': '6',
		'array': '7', // from goog.typeOf
		'null': '8', // from goog.typeOf
		'unknown': '9' // rare and IE-only
	};

	// slice to copy
	var sorted = a.slice(0).sort(function(a, b) {
		goog.asserts.assert(typeToPrefix[goog.typeOf(a)] !== undefined, "no typeToPrefix for " + goog.typeOf(a));
		goog.asserts.assert(typeToPrefix[goog.typeOf(b)] !== undefined, "no typeToPrefix for " + goog.typeOf(b));
		return (
			typeToPrefix[goog.typeOf(a)] + a <
			typeToPrefix[goog.typeOf(b)] + b) ? -1 : 1;
	});

	// Iterate over the sorted array and push items
	// that have no identical neighbors into newArray.
	var newArray = [];
	for (var i = 0; i < sorted.length; i++) {
		if (i === 0 || sorted[i - 1] !== sorted[i]) {
			newArray.push(sorted[i]);
		}
	}
	return newArray;
}
