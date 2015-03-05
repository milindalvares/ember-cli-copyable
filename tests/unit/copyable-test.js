import Ember from 'ember';
import DS from 'ember-data';
import { test } from 'ember-qunit';
import { module } from 'qunit';
import startApp from '../helpers/start-app';
import setupModels from '../helpers/setup-models';

var store, app;
var foo1, foo2, foo3, bar, baz;

var setupRelations = function(){
  Ember.run(function() {

    var createFoo = function(index) {
      return store.createRecord('foo', {
        id: index,
        prop: 'prop' + index
      });
    };

    foo1 = createFoo(1);
    foo2 = createFoo(2);
    foo3 = createFoo(3);

    bar = store.createRecord('bar', {
      id: 1,
      foo: foo1
    });

    baz = store.createRecord('baz', {
      id: 1,
    });

    baz.get('foos').pushObjects([foo2,foo3]);

  });
};

module('copyable - synchronous shallow relations', {
  beforeEach: function() {
    app = startApp();
    store = app.__container__.lookup('store:main');

    setupModels(app, false);

    app.Foo = DS.Model.extend( {
      prop: DS.attr('string')
    });

    setupRelations();
  }
});

test('it shallow copies belongsTo relations', function(assert) {
  assert.expect(1);
  Ember.run(function() {

    bar.copy().then(function(copy) {

      assert.equal(copy.get('foo.id'), bar.get('foo.id'), 'copy.relation is the original object');

    });

  });
});

test('it shallow copies hasMany relations', function(assert) {
  assert.expect(2);
  Ember.run(function() {

    baz.copy().then(function(copy) {

      assert.equal(copy.get('foos.firstObject.id'), baz.get('foos.firstObject.id'), 'copy.relation is the original object');
      assert.equal(copy.get('foos.lastObject.id'), baz.get('foos.lastObject.id'), 'copy.relation is the original object');

    });

  });
});

module('copyable - synchronous deep relations', {
  beforeEach: function() {

    app = startApp();
    store = app.__container__.lookup('store:main');

    setupModels(app, false);
    setupRelations();

  }
});

test('it copies attributes', function(assert) {
  assert.expect(2);
  Ember.run(function() {

    foo1.copy().then(function(copy) {

      assert.notEqual(copy.get('id'), foo1.get('id'), 'copy is a different object');
      assert.equal(copy.get('prop'), foo1.get('prop'), 'attributes are identical');

    });

  });
});

test('it deep copies belongsTo relations', function(assert) {
  assert.expect(2);
  Ember.run(function() {

    bar.copy().then(function(copy) {

      assert.notEqual(copy.get('foo.id'), bar.get('foo.id'), 'copy.relation is a different object');
      assert.equal(copy.get('foo.prop'), bar.get('foo.prop'), 'attributes are identical');

    });

  });
});

test('it deep copies hasMany relations', function(assert) {
  assert.expect(4);
  Ember.run(function() {

    baz.copy().then(function(copy) {

      assert.notEqual(copy.get('foos.firstObject.id'), baz.get('foos.firstObject.id'), 'copy.relation is a different object');
      assert.equal(copy.get('foos.firstObject.prop'), baz.get('foos.firstObject.prop'), 'attributes are identical');
      assert.notEqual(copy.get('foos.lastObject.id'), baz.get('foos.lastObject.id'), 'copy.relation is a different object');
      assert.equal(copy.get('foos.lastObject.prop'), baz.get('foos.lastObject.prop'), 'attributes are identical');

    });

  });
});

test('it deep copies through multiple belongsTo/hasMany relations', function(assert) {
  assert.expect(4);
  Ember.run(function() {

    var multi = store.createRecord('multiBaz');
    multi.set('baz', baz);
    multi.set('id', 1);

    multi.copy().then(function(copy) {

      assert.notEqual(copy.get('id'), multi.get('id'), 'copy is a different object');
      assert.notEqual(copy.get('baz.id'), multi.get('baz.id'), 'copy.relation is a different object');
      assert.notEqual(copy.get('baz.foos.firstObject.id'), multi.get('baz.foos.firstObject.id'), 'copy.relation is a different object');
      assert.equal(copy.get('baz.foos.firstObject.prop'), multi.get('baz.foos.firstObject.prop'), 'attributes are identical');

    });

  });
});

test('it deep copies through multiple hasMany/belongsTo relations', function(assert) {
  assert.expect(4);
  Ember.run(function() {

    var multi = store.createRecord('multiBar');
    multi.get('bars').pushObject(bar);
    multi.set('id', 1);

    multi.copy().then(function(copy) {

      assert.notEqual(copy.get('id'), multi.get('id'), 'copy is a different object');
      assert.notEqual(copy.get('bars.firstObject.id'), multi.get('bars.firstObject.id'), 'copy.relation is a different object');
      assert.notEqual(copy.get('bars.firstObject.foo.id'), multi.get('bars.firstObject.foo.id'), 'copy.relation.relation is a different object');
      assert.equal(copy.get('bars.firstObject.foo.prop'), multi.get('bars.firstObject.foo.prop'), 'attributes are identical');

    });

  });
});

test('it deep copies through every relation combination', function(assert) {
  assert.expect(7);
  Ember.run(function() {

    var multi = store.createRecord('multiBarBaz');
    multi.get('bars').pushObject(bar);
    multi.set('baz', baz);
    multi.set('id', 1);

    multi.copy().then(function(copy) {

      assert.notEqual(copy.get('id'), multi.get('id'), 'copy is a different object');

      assert.notEqual(copy.get('baz.id'), multi.get('baz.id'), 'copy.relation is a differnt object');
      assert.notEqual(copy.get('baz.foos.firstObject.id'), multi.get('baz.foos.firstObject.id'), 'copy.relation is a different object');
      assert.equal(copy.get('baz.foos.firstObject.prop'), multi.get('baz.foos.firstObject.prop'), 'attributes are identical');

      assert.notEqual(copy.get('bars.firstObject.id'), multi.get('bars.firstObject.id'), 'copy.relation.relation is a different object');
      assert.notEqual(copy.get('bars.firstObject.foo.id'), multi.get('bars.firstObject.foo.id'), 'copy.relation.relation is a different object');
      assert.equal(copy.get('bars.firstObject.foo.prop'), multi.get('bars.firstObject.foo.prop'), 'attributes are identical');

    });

  });
});

test('it works with empty relations', function(assert) {
  assert.expect(3);
  Ember.run(function() {

    var multi = store.createRecord('multiBarBaz');
    multi.set('id', 1);

    multi.copy().then(function(copy) {

      assert.notEqual(copy.get('id'), multi.get('id'), 'copy is a different object');
      assert.equal(copy.get('baz'), null, 'relation is empty');
      assert.equal(copy.get('bars.length'), 0, 'relation is empty');

    });

  });
});
