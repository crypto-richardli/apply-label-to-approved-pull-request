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
