# Apply label to approved pull request

## Example

```yaml
name: Apply label to approved pull request
on: pull_request_review
jobs:
  checkApprovals:
    runs-on: ubuntu-latest
    steps:
      - uses: crypto-richardli/apply-label-to-approved-pull-request@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          requiredApprovals: 2
          approvedLabel: approved
```
