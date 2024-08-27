# Weekly Top Posts Aggregator

This script aggregates top posts from various subreddits and Hacker News, then sends a weekly email digest.

## Features

- Scrapes top posts from specified subreddits
- Fetches top posts from Hacker News
- Generates an HTML email with formatted content
- Sends the digest via email
- Supports testing and local output generation

## Prerequisites

- Bun v1.1.26

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/hanifcarroll/weekly-digest.git
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Install Playwright dependencies:

   ```bash
   bunx playwright install chromium
   ```

## Configuration

Set the following environment variables:

- `EMAIL_SERVER`: SMTP server address
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: Your email address
- `EMAIL_PASS`: Your email password
- `EMAIL_RECIPIENT`: Recipient's email address
- `REDDIT_CLIENT_ID`: Reddit API client ID
- `REDDIT_CLIENT_SECRET`: Reddit API client secret
- `REDDIT_USERNAME`: Reddit username
- `REDDIT_PASSWORD`: Reddit password
- `REDDIT_USER_AGENT`: Reddit API user agent## Usage

Run the script:

```bash
bun run script.ts
```

## Automated Workflow

This project includes a GitHub Actions workflow that runs the script automatically every Sunday at 9 AM. The workflow also supports manual triggering.

Remember to set the environment variables in the GitHub Actions workflow settings for the repository.

## Customization

- Modify `TECH_SUBREDDITS` and `BUSINESS_SUBREDDITS` arrays to change target subreddits
- Adjust `HckrNewsPostFilter` enum to change Hacker News post filtering

## Testing

To run tests and generate local HTML output:

```bash
bun run test.ts
```

The script gathers the content from the subreddits and Hacker News, generates the HTML email, then saves it to a file to verify the output.

## License

[MIT License](LICENSE)
