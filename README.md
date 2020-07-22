# GitHub Action - Broadcast Message
This GtiHub Action allows you to broadcast a message through issue comments. It's helpful when you need to comment on many different issues.

The action is intended to work with the `workflow_dispatch` event.

![Screen Shot 2020-07-22 at 3 40 34 PM](https://user-images.githubusercontent.com/1865328/88226464-b7f56d00-cc31-11ea-81e2-f54a3aa34b24.png)


## Usage
### Pre-requisites
Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Example workflow

```yaml
name: Broadcast a message across multiple issues
on: 
  workflow_dispatch:
    inputs:
      message:
        required: false
      labels:
        required: false

jobs:
  broadcast:
    runs-on: ubuntu-latest
    steps:
        - uses: jenschelkopf/broadcast-action@master
