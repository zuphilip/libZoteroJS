'use strict';

var log = require('./Log.js').Logger('libZotero:TagColors');

var TagColors = function(tagColors = []){
	this.instance = 'Zotero.TagColors';
	this.colorsArray = tagColors;
	this.colors = new Map();

	this.colorsArray.forEach((color) => {
		this.colors.set(color.name.toLowerCase(), color.color);
	});
};

//take an array of tags and return subset of tags that should be colored, along with
//the colors they should be
TagColors.prototype.match = function(tags) {
	let resultTags = [];
	
	for(let i = 0; i < tags.length; i++){
		let lowerTag = tags[i].toLowerCase();
		if(this.colors.has(lowerTag) ) {
			resultTags.push(this.colors.get(lowerTag));
		}
	}
	return resultTags;
};

module.exports = TagColors;
