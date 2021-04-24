import * as core from '@actions/core'
import * as github from '@actions/github'
import {EnvVariables, Inputs, Label, Metadata, Octokit, Results} from './types'

export const handleEvent = async (): Promise<void> => {
  const {accessToken} = getEnvVariables()
  const octokit = github.getOctokit(accessToken)
  const metadata = getMetadata()
  const approvals = await getApprovals(octokit, metadata)

  const {requiredApprovals, approvedLabel} = getInputs()
  const enough = approvals >= requiredApprovals
  const {pullLabels} = metadata
  const includes = pullLabels.includes(approvedLabel)

  if (enough && !includes) {
    await applyLabel(octokit, metadata, approvedLabel)
    return
  }

  if (!enough && includes) {
    await removeLabel(octokit, metadata, approvedLabel)
  }
}

const getEnvVariables = (): EnvVariables => {
  const accessToken = process.env.GITHUB_TOKEN
  if (!accessToken) {
    throw new Error('GITHUB_TOKEN is undefined')
  }

  return {accessToken}
}

const getInputs = (): Inputs => {
  const requiredApprovals = core.getInput('requiredApprovals')
  const approvedLabel = core.getInput('approvedLabel')

  return {
    requiredApprovals: parseInt(requiredApprovals),
    approvedLabel
  }
}

const getMetadata = (): Metadata => {
  const {repository, pull_request: pullRequest} = github.context.payload

  if (!repository || !pullRequest) {
    throw new Error('Invalid payload')
  }

  const pullLabels = pullRequest.labels.map((label: Label) => label.name)

  return {
    repo: repository.name,
    owner: repository.owner.login,
    pullNumber: pullRequest.number,
    pullLabels
  }
}

const getApprovals = async (
  octokit: Octokit,
  {owner, repo, pullNumber}: Metadata
): Promise<number> => {
  const {data: reviews} = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber
  })

  const results: Results = {}

  for (const review of reviews) {
    const reviewer = review.user?.login
    const state = review.state

    if (reviewer) {
      results[reviewer] = state
    }
  }

  const states = Object.values(results)
  const approvals = states.filter(state => state === 'APPROVED')
  return approvals.length
}

const applyLabel = async (
  octokit: Octokit,
  {owner, repo, pullNumber}: Metadata,
  approvedLabel: string
): Promise<void> => {
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pullNumber,
    labels: [approvedLabel]
  })
}

const removeLabel = async (
  octokit: Octokit,
  {owner, repo, pullNumber}: Metadata,
  approvedLabel: string
): Promise<void> => {
  await octokit.issues.removeLabel({
    owner,
    repo,
    issue_number: pullNumber,
    name: approvedLabel
  })
}
