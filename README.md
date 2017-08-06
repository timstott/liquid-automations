## Setup

```console
brew install awscli
brew install terraform

yarn install
```

## Deployment
Make sure the infrastructure has been provisioned see [documentation](./infrastructure/README.md)

```console
npm-exec serverless --aws-profile liquid-automations-dev-deployment --stage dev deploy
```
