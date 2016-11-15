A serverless framework plugin so that your functions know how to use resources created by cloudformation.

[![Build Status](https://travis-ci.org/rurri/serverless-fetch-stack-resources.svg?branch=master)](https://travis-ci.org/rurri/serverless-fetch-stack-resources)

## Why?

You have a CloudFormation template all set, and you are writing your functions. Now you are ready to use the
resources created as part of your CF template. Well, you need to know about them! This plugin, will fetch
all the CF resources for the current stack (stage i.e. 'dev'), and make then available as a JSON file
keyed by the logical name you used to set them up.

This means no code changes, or config changes no matter how many regions, and stages you deploy to.
The lambdas always know exactly where to find their resources.

## Example of Lambda Usage:

```
const resourceList = JSON.parse(fs.readFileSync('.cfResources'));
const ec2Id = resourceList.myInstance;
const sqsId = resourceList.mySqs;
```

## Install

`npm install serverless-fetch-stack-resources --save`

Add the plugin to the serverless.yml.

```
plugins:
  - serverless-fetch-stack-resources
```

## Config

By default, the mapping is written to a JSON file located at `.cfResources`. This can be modified by
setting an option in serverless.yml.

```
custom:
  resource-output-file: .alt-resource-file
```

## How it works

This plugin attaches to the function pre-deploy hook. Prior to deploying functions (but after the resources are created),
the plugin determines the name of the cloud formation stack, and queries AWS for all resources in this stack.

Once received, these are mapped from their 'LogicalResourceId' to their 'PhysicalResourceId'.

## PreRequisite

Only works with the aws provider