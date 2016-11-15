"use strict"

const expect = require('chai').expect;
const sinon = require('sinon');

const ServerlessFetchStackResources = require('../index');
const _ = require('lodash');

const serverlessStub = {
  config: {},
  service: { provider: {} },
  cli: {
    log: sinon.stub(),
  },
  getProvider: () => ({
    sdk: {
      CloudFormation: Object
    }
  }),
};

describe('serverless-fetch-stack-resource', function () {

  describe('constructor', function () {
    it('should setup to listen for hooks', function () {

      const instance = new ServerlessFetchStackResources(serverlessStub, {});
      expect(instance.hooks).to.have.keys(
          'before:deploy:function:deploy',
          'before:deploy:createDeploymentArtifacts'
      );

      expect(instance.provider).to.equal('aws');
      expect(instance.serverless).to.equal(serverlessStub);
    });
  });

  describe('getStage', function () {
    it('uses dev if no options set', function () {
      const instance = new ServerlessFetchStackResources(
          serverlessStub, {});
      expect(instance.getStage()).to.equal('dev');
    });

    it('uses stage of option if set', function () {
      const instance = new ServerlessFetchStackResources(
          serverlessStub, { stage: 'from_option' });
      expect(instance.getStage()).to.equal('from_option');
    });

    it('uses stage of config if set', function () {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, {
            config: { stage: 'from_config' },
            service: { provider: {} }
          }), {});
      expect(instance.getStage()).to.equal('from_config');
    });

    it('uses stage of config if set', function () {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, { service: { provider: { stage: 'from_provider' } } }), {});
      expect(instance.getStage()).to.equal('from_provider');
    });

    it('options will preempt other stages set', function () {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, {
            config: { stage: 'from_config' },
            service: { provider: { stage: 'from_provider' } }
          }), { stage: 'from_option' });
      expect(instance.getStage()).to.equal('from_option');
    });
  });

  describe('getStackName', function () {
    it('simple combination of service and stage', function () {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, {
            config: {},
            service: { service: 'a_service', provider: {} }
          }), { stage: 'from_option' });
      expect(instance.getStackName()).to.equal('a_service-from_option');
    });
  });

  describe('createCFFile', function () {
    it('fetches CF info and attempts to save empty file', function (done) {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, {
            config: {},
            service: { service: 'a_service', provider: {} }
          }), { stage: 'from_option' });
      instance.cloudFormation.describeStackResources =
          (params, callback) => {
            callback(null, {
              StackResources: []
            })
          };
      expect(instance.getStackName()).to.equal('a_service-from_option');
      instance.fs.writeFile = function (name, data, callback) {
        callback();
        done();
      };
      instance.createCFFile();
    });

    it('fetches CF info and attempts to save mapped file', function (done) {
      const instance = new ServerlessFetchStackResources(
          _.extend({}, serverlessStub, {
            config: {},
            service: { service: 'a_service', provider: {} }
          }), { stage: 'from_option' });
      instance.cloudFormation.describeStackResources =
          (params, callback) => {
            callback(null, {
              StackResources: [
                { LogicalResourceId: 'a', PhysicalResourceId: '1' },
                { LogicalResourceId: 'b', PhysicalResourceId: '2' },
                { LogicalResourceId: 'c', PhysicalResourceId: '3' },
              ]
            })
          };
      expect(instance.getStackName()).to.equal('a_service-from_option');
      instance.fs.writeFile = function (name, data, callback) {
        expect(data).to.deep.equal(JSON.stringify({ "a": "1", "b": "2", "c": "3" }));
        callback();
        done();
      };
      instance.createCFFile();
    });
  });
});