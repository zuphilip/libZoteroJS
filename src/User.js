'use strict';

module.exports = function () {this.instance = 'Zotero.User';};
module.exports.prototype = new Zotero.ApiObject();
module.exports.prototype.loadObject = function(ob){
	this.title = ob.title;
	this.author = ob.author;
	this.tagID = ob.tagID;
	this.published = ob.published;
	this.updated = ob.updated;
	this.links = ob.links;
	this.numItems = ob.numItems;
	this.items = ob.items;
	this.tagType = ob.tagType;
	this.modified = ob.modified;
	this.added = ob.added;
	this.key = ob.key;
};

module.exports.prototype.parseXmlUser = function (tel) {
	this.parseXmlEntry(tel);
	
	var tagEl = tel.find('content>tag');
	if(tagEl.length !== 0){
		this.tagKey = tagEl.attr('key');// find("zapi\\:itemID").text();
		this.libraryID = tagEl.attr('libraryID');
		this.tagName = tagEl.attr('name');
		this.dateAdded = tagEl.attr('dateAdded');
		this.dateModified = tagEl.attr('dateModified');
	}
	
};
