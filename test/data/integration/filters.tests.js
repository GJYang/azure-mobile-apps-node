// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
var queries = require('../../../src/query'),
    config = require('../../appFactory').configuration(),
    expect = require('chai').use(require('chai-subset')).use(require('chai-as-promised')).expect;

describe('azure-mobile-apps.data.integration.filters', function () {
    var index = require('../../../src/data'),
        data = index(config),
        cleanUp = require('../' + config.data.provider + '/integration.cleanUp'),
        context = { filterValue: '3', propertyValue: '1' },
        table = {
            name: 'filters',
            softDelete: true,
            seed: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            filters: [function (query, context) {
                return query.where(function (value) { return this.id >= value; }, context.filterValue);
            }],
            transforms: [function (item) {
                return { id: item.id };
            }, function (item, context) {
                item.property = context.propertyValue;
            }]
        },
        operations;

    beforeEach(function (done) {
        operations = data(table, context);
        operations.initialize().then(function (inserted) { }).then(done, done);
    });

    afterEach(function (done) {
        cleanUp(config.data, table).then(function (arg) { done() }, done);
    });

    it('attaches filter to read queries', function () {
        return read().then(function (results) {
            expect(results.length).to.equal(2);
            expect(results[0].id).to.equal('3');
            expect(results[1].id).to.equal('4');
        });
    });

    it('attaches filter to update queries', function () {
        return expect(update({ id: '1', value: '1' })).to.be.rejectedWith('Error: No records were updated')
            .then(function () {
                return expect(update({ id: '3', value: '1' })).to.be.fulfilled;
            });
    });

    it('attaches filter to delete queries', function () {
        return expect(del('1')).to.be.rejectedWith('Error: No records were updated')
            .then(function () {
                return expect(del('3')).to.be.fulfilled;
            });
    });

    it('applies transforms to inserted items', function () {
        return insert({ id: '5' }).then(function (inserted) {
            expect(inserted.property).to.equal('1');
        });
    });

    it('applies transforms to updated items', function () {
        return update({ id: '3' }).then(function (updated) {
            expect(updated.property).to.equal('1');
        });
    });

    function read() {
        return operations.read(queries.create('filters'));
    }

    function insert(item) {
        return operations.insert(item);
    }

    function update(item) {
        return operations.update(item);
    }

    function del(id) {
        return operations.delete(queries.create('filters').where({ id: id }));
    }

    function undelete(id) {
        return operations.undelete(queries.create('filters').where({ id: id }));
    }
});