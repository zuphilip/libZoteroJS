'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const fetchMock = require('fetch-mock');

const bookTemplateFixture = require('./fixtures/book-template.json');
const conferencePaperTemplateFixture = require('./fixtures/conference-paper-template.json');
const itemjsonFixture = require('./fixtures/item-1.json');
const journalTemplateFixture = require('./fixtures/journal-article-template.json');

describe('Zotero.Item', () => {
	describe('Construct', () => {
		it('should instantiate an empty item', () => {
			const item = new Zotero.Item();

			assert.equal(item.instance, 'Zotero.Item');
			assert.equal(item.key, '');
			assert.equal(item.version, 0);
		});

		it('should instantiate item from api object', () => {
			const item = new Zotero.Item(itemjsonFixture);

			assert.equal(item.instance, 'Zotero.Item');
			assert.equal(item.key, 'NSBERGDK');
			assert.equal(item.version, 6821);
			assert.deepEqual(item.pristineData, itemjsonFixture.data);
			assert.equal(item.apiObj.data.title, '3D virtual worlds as collaborative communities enriching human endeavours: Innovative applications in e-Learning');
			assert.equal(item.get('title'), '3D virtual worlds as collaborative communities enriching human endeavours: Innovative applications in e-Learning');
			assert.lengthOf(item.get('creators'), 4);
		});
	});

	describe('Properties', () => {
		it('should correctly set/get item properties', () => {
			const item = new Zotero.Item();
			item.initEmptyFromTemplate(journalTemplateFixture);

			item.set('title', 'Journal Article Title');
			item.set('key', 'ASDF1234');
			item.set('version', 74);
			item.set('itemType', 'conferencePaper');
			item.set('deleted', 1);
			item.set('parentItem', 'HJKL9876');
			item.set('abstractNote', 'This is a test item.');
			item.set('notRealField', 'Not a real field value.');

			//test that get returns what it should for each set
			assert.equal(item.get('title'), 'Journal Article Title', 'get title should return what was set.');
			assert.equal(item.get('key'), 'ASDF1234', 'get key should return what was set.');
			assert.equal(item.get('version'), 74, 'get version should return what was set.');
			assert.equal(item.get('itemType'), 'conferencePaper', 'get itemType should return what was set.');
			assert.equal(item.get('deleted'), 1, 'get deleted should return what was set.');
			assert.equal(item.get('parentItem'), 'HJKL9876', 'get parentItem should return what was set');
			assert.equal(item.get('abstractNote'), 'This is a test item.', 'get abstractNote should return what was set.');
			assert.equal(item.get('notRealField'), null, 'get fake field value should return null.');

			assert.equal(item.apiObj.data.title, 'Journal Article Title', 'title should be set on item apiObj');
			assert.equal(item.pristineData.title, '', 'title should not be set on item pristine');

			assert.equal(item.key, 'ASDF1234', 'key should be set on item object');
			assert.equal(item.apiObj.key, 'ASDF1234', 'key should be set on item apiObj');
			assert.equal(item.pristineData.key, undefined, 'key should be undefined on pristine');

			assert.equal(item.version, 74, 'version should be set on item object');
			assert.equal(item.apiObj.data.version, 74, 'version should be set on item apiObj');
			assert.equal(item.pristineData.version, undefined, 'version should be undefined on item pristine');

			assert.equal(item.deleted, undefined, 'deleted should not be set on item object');
			assert.equal(item.apiObj.data.deleted, 1, 'deleted should be set on item apiObj');
		});
	});

	describe('Write', () => {
		beforeEach(() => {
			fetchMock.get(
				/https:\/\/api\.zotero\.org\/items\/new\?itemType=book\&?/i,
				bookTemplateFixture
			);
			fetchMock.get(
				/https:\/\/api\.zotero\.org\/items\/new\?itemType=conferencePaper\&?/i,
				conferencePaperTemplateFixture
			);

			fetchMock.catch(request => {
				throw(new Error(`A request to ${request.url} was not expected`));
			});
		});

		afterEach(fetchMock.restore);
		
		it('should create item', done => {
			const library = new Zotero.Library('user', 1, '', '');
			const item = new Zotero.Item();

			fetchMock.post(
				/https:\/\/api\.zotero\.org\/users\/1\/items\??/i,
				request => {
					let item = JSON.parse(request.body)[0];
					item.version = 12;
					return {
						headers: {
							'Last-Modified-Version': 12
						},
						body: {
							'successful': item,
							'success': {
								'0': item.key
							},
							'unchanged': {},
							'failed': {}
						}
					};
				}
				);

			item.associateWithLibrary(library);
			item.initEmpty('book')
				.then(item => {
					item.set('title', 'book-1');
					item.writeItem()
						.then(responses => {
							let itemsArray = responses[0].returnItems;
							assert.equal(itemsArray.length, 1, 'We expect 1 items was written');
							assert.isOk(itemsArray[0].key, 'We expect the first item to have an itemKey');
							assert.equal(item.version, 12, 'We expect version number to be updated');
							done();
					}).catch(done);
			}).catch(done);
		});

		it('should create item with associated notes', () => {
			const library = new Zotero.Library('user', 1, '', '');
			const item = new Zotero.Item();

			fetchMock.post(
				/https:\/\/api\.zotero\.org\/users\/1\/items\??/i,
				request => {
					let items = JSON.parse(request.body);
					items = items.map(i => i.version = 123);
					return {
						headers: {
							'Last-Modified-Version': 12
						},
						body: {
							'successful': items.reduce((a, v, i) => a[i] = v, {}),
							'success': items.reduce((a, v, i) => a[i] = v.key, {}),
							'unchanged': {},
							'failed': {}
						}
					};
				}
				);

			item.associateWithLibrary(library);
			item.initEmpty('conferencePaper')
				.then(item => {
					item.set('title', 'conference paper 1');
					item.set('conferenceName', 'The Best Conference');

					const childNote1 = new Zotero.Item();
					childNote1.initEmptyNote();
					childNote1.set('note', 'Note Content 1');

					const childNote2 = new Zotero.Item();
					childNote2.initEmptyNote();
					childNote2.set('note', 'Note Content 2');

					item.notes = [];
					item.notes.push(childNote1);
					item.notes.push(childNote2);

					item.writeItem().then(responses => {
						let itemsArray = responses[0].returnItems;
						assert.equal(itemsArray.length, 3, 'We expect 3 items were written');
						assert.isOk(itemsArray[0].key, 'We expect the first item to have an itemKey');
						assert.isOk(itemsArray[1].key, 'We expect the second item to have an itemKey');
						assert.isOk(itemsArray[2].key, 'We expect the third item to have an itemKey');

						assert.isOk(itemsArray[0].get('version') > 0, 'We expect to have an updated itemVersion since it\'s on the server now');
						assert.isOk(itemsArray[1].get('version') > 0, 'We expect to have an updated itemVersion since it\'s on the server now');
						assert.isOk(itemsArray[2].get('version') > 0, 'We expect to have an updated itemVersion since it\'s on the server now');

						assert.isOk(itemsArray[1].get('version') == itemsArray[2].get('version'), 'Expect itemVersion for child notes to be assert.equal');
					});
				});
		});

		it('should handle error responses', done => {
			const library = new Zotero.Library('user', 1, '', '');
			const item = new Zotero.Item();

			fetchMock.post(
				/https:\/\/api\.zotero\.org\/users\/1\/items\??/i,
				request => {
					let item = JSON.parse(request.body)[0];
					item.version = 12;
					return {
						headers: {
							'Last-Modified-Version': 12
						},
						body: {
							'successful': {},
							'success': {},
							'unchanged': {},
							'failed': {
								'0': {
									'code': 400,
									'message': 'bad input error'
								}
							}
						}
					};
				}
			);

			item.associateWithLibrary(library);
			item.initEmpty('book')
				.then(item => {
					item.set('title', 'book-1');
					item.writeItem()
						.then(responses => {
							let itemsArray = responses[0].returnItems;
							assert.isOk(itemsArray[0].writeFailure);
							assert.isOk('code' in itemsArray[0].writeFailure);
							assert.equal(itemsArray[0].writeFailure.code, 400);
							assert.equal(itemsArray[0].writeFailure.message, 'bad input error');
							done();
					}).catch(done);
			}).catch(done);
		});
	});
});