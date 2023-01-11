<div align="center">
<h1>Google Analytics 4 GitHub Action</h1>

<img alt="GA4 Logo" src="./images/GA4-logo.png" height=200>

[![Continuous Integration](https://github.com/Dylan700/ga4-action/actions/workflows/ci.yaml/badge.svg)](https://github.com/Dylan700/ga4-action/actions/workflows/ci.yaml)
[![CodeQL](https://github.com/Dylan700/ga4-action/actions/workflows/codeql-analysis.yaml/badge.svg)](https://github.com/Dylan700/ga4-action/actions/workflows/codeql-analysis.yaml)

</div>

<hr>

This action sends offline events to Google Analytics 4 from your repository workflows.

The most common use case is to record deployment events in Google Analytics when updates to your app, website or other system occur. This allows you to attribute changes in other analytics data (such as number of views), against changes in your system (such as a new release or UI update).
</div>

## Inputs

## `event-name`

The name of the event to record in GA4. Default `"update_github"`.

> Please Note: It is usually best to start event names with verbs, and to keep it consistent for reporting purposes in GA4.

All events will contain the description and URL of the commit that triggered the workflow.

## `measurement-id`

**Required** The [measurement id](https://support.google.com/analytics/answer/12270356?hl=en) for your GA4 property.
>

## `api-secret`

**Required** The API secret for you GA4 property.

> The API secret can be generated through the GA4 UI.
>
> To create a new secret, navigate in the Google Analytics UI to *Admin > Data Streams > choose your stream > Measurement Protocol > Create*

## `dry-run`

When "true", only the validation server will be used to validate the request, and the request will not be sent to your GA4 property.

## Example usage

```yaml
uses: Dylan700/ga4-action@v1.0.0
with:
  event-name: update_website
  measurement-id: ${{secrets.ga4_measurement_id}}
  api-secret: ${{secrets.ga4_api_secret}}
```