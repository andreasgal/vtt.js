// This implements a minimum fake window object constructor that is sufficient
// to test constructing a DOM Tree for cue content.
module.exports = function FakeWindow() {
  this.DocumentFragment = function () {
    function appendChild(node) {
      this.childNodes = this.childNodes || [];
      this.childNodes.push(node);
      node.parentNode = this;
    }
    this.createElement = function(tagName) {
      return { tagName: tagName, appendChild: appendChild };
    };
    this.createTextNode = function(text) {
      return { textContent: text };
    };
    this.appendChild = appendChild;
  };
  this.ProcessingInstruction = function () {
  };
};
