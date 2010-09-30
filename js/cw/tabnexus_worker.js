/**
 * @fileoverview Compile this file to get the code you must run in the
 * 	SharedWorker.  Used by {@link cw.crosstab.CrossSharedWorker}.
 */

goog.require('cw.tabnexus');


goog.exportSymbol('onerror', cw.tabnexus.onErrorHandler);
goog.exportSymbol('onconnect', cw.tabnexus.onConnectHandler);
