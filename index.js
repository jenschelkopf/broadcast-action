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
    message = github.context.payload.inputs.message;
  }

  const issueResponse = await octokit.issues.listForRepo({
     owner,
     repo,
     per_page: 100,
     labels
  });
  const issues = issueResponse.data;
  console.log(`Found ${issues.length} issues`);
  console.log(JSON.stringify(issues));


  for (const issue in issues) {
    console.log(`Adding '${body}' to ${JSON.stringify(issue)}`);
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issue.number,
      body
    });
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
