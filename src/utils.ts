import * as core from '@actions/core'
import * as github from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'
import {Inputs, Metadata, Results} from './types'

export const handleEvent = async (): Promise<void> => {
  const accessToken = process.env.GITHUB_TOKEN
  if (!accessToken) {
    throw new Error('GITHUB_TOKEN is undefined')
  }

  const {requiredApprovals, approvedLabel} = getInputs()

  const octokit = github.getOctokit(accessToken)
  const metadata = getMetadata()
  const approvals = await getApprovals(octokit, metadata)

  const enough = approvals >= requiredApprovals
  const includes = metadata.pullLabels.includes(approvedLabel)

  if (enough && !includes) {
    await applyLabel(octokit, metadata, approvedLabel)
    return
  }

  if (!enough && includes) {
    await removeLabel(octokit, metadata, approvedLabel)
  }
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

  return {
    repo: repository.name,
    owner: repository.owner.login,
    pullNumber: pullRequest.number,
    pullLabels: pullRequest.labels
  }
}

const getApprovals = async (
  octokit: InstanceType<typeof GitHub>,
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
  return states.filter(state => state === 'APPROVED').length
}

const applyLabel = async (
  octokit: InstanceType<typeof GitHub>,
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
  octokit: InstanceType<typeof GitHub>,
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
