/**
 * Set the text content of DOM node C{e} to C{text}.
 */
CW.DOM.setText = function setText(e, text) {
	if(e.textContent !== undefined) {
		e.textContent = text;
	} else {
		e.innerHTML = text;
	}
}
