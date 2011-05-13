/**
 * @fileoverview Compile this file to get the code you must run in the
 * 	SharedWorker.  Used by {@link cw.crosstab.CrossSharedWorker}.
 *
 * This is DEPRECATED and may be removed at any time.  See crosstab.js
 * for an explanation.
 */

goog.provide('cw.tabnexus_worker');

goog.require('cw.tabnexus');


goog.exportSymbol('onerror', cw.tabnexus.onErrorHandler);
goog.exportSymbol('onconnect', cw.tabnexus.onConnectHandler);
