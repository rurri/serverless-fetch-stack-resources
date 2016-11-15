'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

const DEFAULT_FILENAME = '.cfResources';

class ServerlessFetchStackResources {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = 'aws';

    this.hooks = {
      'before:deploy:function:deploy': this.createCFFile.bind(this),
      'before:deploy:createDeploymentArtifacts': this.createCFFile.bind(this),
    };

    const awsProvider = this.serverless.getProvider('aws');
    this.cloudFormation = new awsProvider.sdk.CloudFormation();
    this.fs = fs;
  }

  createCFFile() {
    const stackName = this.getStackName();
    this.serverless.cli.log(`[serverless-resources-env] Looking up resources for CF Named: ${stackName}`);
    return Promise.promisify(this.cloudFormation.describeStackResources.bind(this.cloudFormation))({
      StackName: stackName,
    }).then((result) => {
      const fileName =
          this.serverless.service.custom && this.serverless.service.custom['resource-output-file'] ?
              this.serverless.service.custom['resource-output-file'] : DEFAULT_FILENAME;

      this.serverless.cli.log(`[serverless-resources-env] Writing ${result.StackResources.length}` +
          `CloudFormation resources to ${fileName}`);

      const fullFileName = `${this.serverless.config.servicePath}/${fileName}`;
      const data = _.reduce(result.StackResources, (all, item) => {
        all[item.LogicalResourceId] = item.PhysicalResourceId;
        return all;
      }, {});
      return Promise.promisify(this.fs.writeFile)(fullFileName, JSON.stringify(data));
    });
  }

  getStage() {
    let returnValue = 'dev';
    if (this.options && this.options.stage) {
      returnValue = this.options.stage;
    } else if (this.serverless.config.stage) {
      returnValue = this.serverless.config.stage;
    } else if (this.serverless.service.provider.stage) {
      returnValue = this.serverless.service.provider.stage;
    }
    return returnValue;
  }

  getStackName() {
    return `${this.serverless.service.service}-${this.getStage()}`;
  }
}

module.exports = ServerlessFetchStackResources;
