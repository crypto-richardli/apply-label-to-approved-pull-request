import {GitHub} from '@actions/github/lib/utils'

export type EnvVariables = {
  accessToken: string
}

export type Metadata = {
  repo: string
  owner: string
  pullNumber: number
  pullLabels: string[]
}

export type Inputs = {
  requiredApprovals: number
  approvedLabel: string
}

export type Results = {
  [user: string]: string
}

export type Label = {
  name: string
}

export type Octokit = InstanceType<typeof GitHub>
