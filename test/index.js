var path = require('path');
var fabricio = require('../index');
var chai = require('chai');
var root = path.resolve(path.join('test/application'));
var data = {
    foo: {
        version: '1.0.0',
        lazo: {
            component: true,
            dependencies: {
                moment: {
                    moduleId: 'moment',
                    install: 'common'
                }
            }
        },
        data: {},
        path: path.join(root, 'node_modules', 'foo')
    },
    bar: {
        version: '1.0.0',
        lazo: {
            component: true,
            dependencies: {
                moment: {
                    moduleId: 'moment',
                    install: 'common'
                },
                jquery: {
                    moduleId: 'jquery',
                    install: 'common'
                }
            }
        },
        data: {},
        path: path.join(root, 'node_modules', 'foo')
    }
};

describe('fabricio', function () {

    it('should get module data for lazo node module common dependencies', function (done) {
        fabricio(data, null, function (err, results) {
            if (err) {
                throw err;
            }

            chai.expect(results.length).to.equal(2);

            var fooModule = results[0];
            var fooMomentDep = fooModule.dependencies.moment;
            chai.expect(fooMomentDep.moduleId).to.be.equal('moment');
            chai.expect(fooMomentDep.conflicts.length).to.equal(2);
            chai.expect(fooMomentDep.module.version).to.equal('2.0.0');

            var barModule = results[1];
            var barMomentDep = barModule.dependencies.moment;
            var barJqueryDep = barModule.dependencies.jquery;
            chai.expect(barMomentDep.moduleId).to.be.equal('moment');
            chai.expect(barMomentDep.conflicts.length).to.equal(2);
            chai.expect(barMomentDep.module.version).to.equal('2.0.0');

            chai.expect(barJqueryDep.moduleId).to.be.equal('jquery');
            chai.expect(barJqueryDep.conflicts).to.be.undefined;
            chai.expect(barJqueryDep.module.version).to.equal('2.1.2');

            done();
        });
    });

});