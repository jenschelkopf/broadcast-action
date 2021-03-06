const github = require("@actions/github");
const core = require("@actions/core");

async function run() {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  var labels = core.getInput('labels');
  var body = core.getInput('message');

  if(github.context.payload.inputs) {
    labels = github.context.payload.inputs.labels;
    body = github.context.payload.inputs.message;
  }

  var issueResponse = null;

  if(labels) {
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
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: issue.number,
        body
      });
    }
  }
}

run()
    .then(
        (response) => { console.log(`Finished running: ${response}`); },
        (error) => {
            console.log(`#ERROR# ${error}`);
            process.exit(1);
        }
    );
