const github = require("@actions/github");
const core = require("@actions/core");

async function run() {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);
  const graphql = require("@octokit/graphql");
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  var labels = core.getInput('labels');
  var projectUrl = core.getInput("project-url");
  var columnName = core.getInput("column-name");
  var body = core.getInput('message');

  if(github.context.payload.inputs) {
    labels = github.context.payload.inputs.labels;
    projectUrl = github.context.payload.inputs.projectUrl;
    columnName = github.context.payload.inputs.columnName;
    body = github.context.payload.inputs.message;
  }

  var issueResponse = null;

  if(projectUrl) {
    issueResponse = await getColumnIssues(columnName, projectUrl, token);
  } else if(labels) {
    console.log('Using labels ' + labels)
    issueResponse = await octokit.issues.listForRepo({
       owner,
       repo,
       per_page: 100,
       labels
    });
  } else {
    console.log("Not using labels")
    issueResponse = await octokit.issues.listForRepo({
       owner,
       repo,
       per_page: 100
    });
  }

  const issues = issueResponse.data;
  console.log(`Found ${issues.length} issues`);

  for (const issue of issues) {
    if (issue) {
      console.log(`Adding '${body}' to ${issue.number}`);
//       await octokit.issues.createComment({
//         owner,
//         repo,
//         issue_number: issue.number,
//         body
//       });
    }
  }
}

async function getColumnIssues(columnName, projectUrl, token) {
    // if org project, we need to extract the org name
    // if repo project, need repo owner and name
    var columnId = null;
    var cardId = null;
    var currentColumnName = null;
    var splitUrl = projectUrl.split("/");
    var projectNumber = parseInt(splitUrl[6], 10);
    var issueNumbers = [];

    // check if repo or org project
    if(splitUrl[3] == "orgs"){
        // Org url will be in the format: https://github.com/orgs/github/projects/910
        var orgLogin = splitUrl[4];
        console.log(`This project is configured at the org level. Org Login:${orgLogin}, project number#${projectNumber}`);
        var orgInformation = await getOrgInformation(orgLogin, projectNumber, token);
        orgInformation.organization.project.columns.nodes.forEach(function(columnNode){
            var name = columnNode.name;
            if(name == columnName){
                columnId = columnNode.databaseId;
                columnNode.cards.edges.forEach(function(card){
                    // card level
                    if (card.node.content != null){
                        // only issues and pull requests have content
                        issueNumbers.push({number: card.node.content.number});
                    }
                });
            }
        });
    } else {
        // Repo url will be in the format: https://github.com/bbq-beets/konradpabjan-test/projects/1
        var repoOwner = splitUrl[3];
        var repoName = splitUrl[4];
        console.log(`This project is configured at the repo level. Repo Owner:${repoOwner}, repo name:${repoName} project number#${projectNumber}`);
        var repoColumnInfo = await getRepoInformation(repoOwner, repoName, projectNumber, token);
        repoColumnInfo.repository.project.columns.nodes.forEach(function(columnNode){
            var name = columnNode.name;
            if(name == columnName){
                columnId = columnNode.databaseId;
                columnNode.cards.edges.forEach(function(card){
                    // card level
                    if (card.node.content != null){
                        // only issues and pull requests have content
                        issueNumbers.push({number: card.node.content.number});
                    }
                });
            }
        });
    }
    return issueNumbers;
}

async function getOrgInformation(organizationLogin, projectNumber, token){
    // GraphQL query to get all of the cards in each column for a project
    // https://developer.github.com/v4/explorer/ is good to play around with
    const response = await graphql(
        `query ($loginVariable: String!, $projectVariable: Int!){
            organization(login:$loginVariable) {
                name
                project(number:$projectVariable) {
                    databaseId
                    name
                    url
                    columns(first:100){
                        nodes{
                            databaseId
                            name
                            cards {
                                edges {
                                    node {
                                        databaseId
                                            content {
                                                ... on Issue {
                                                    databaseId
                                                    number
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`,{
            loginVariable: organizationLogin,
            projectVariable: projectNumber,
            headers: {
                authorization: `bearer ${token}`
            }
        });
    return response;
}

async function getRepoInformation(repositoryOwner, repositoryName, projectNumber, token){
    // GraphQL query to get all of the columns in a project that is setup at that org level
    // https://developer.github.com/v4/explorer/ is good to play around with
    const response = await graphql(
        `query ($ownerVariable: String!, $nameVariable: String!, $projectVariable: Int!){
            repository(owner:$ownerVariable, name:$nameVariable) {
                project(number:$projectVariable){
                    id
                    number
                    databaseId
                    name
                    url
                    columns(first:100){
                        nodes{
                            databaseId
                            name
                            cards {
                                edges {
                                    node {
                                        databaseId
                                            content {
                                                ... on Issue {
                                                    databaseId
                                                    number
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }        
            }`, {
            ownerVariable: repositoryOwner,
            nameVariable: repositoryName,
            projectVariable: projectNumber,
            headers: {
                authorization: `bearer ${token}`
            }
        });
    return response;
}

run()
    .then(
        (response) => { console.log(`Finished running: ${response}`); },
        (error) => {
            console.log(`#ERROR# ${error}`);
            process.exit(1);
        }
    );
