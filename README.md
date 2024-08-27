# Weekly Top Posts Aggregator

This script aggregates top posts from various subreddits and Hacker News, then sends a weekly email digest.

## Features

- Scrapes top posts from specified subreddits
- Fetches top posts from Hacker News
- Generates an HTML email with formatted content
- Sends the digest via email

## Prerequisites

- Bun v1.1.26

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/weekly-digest.git
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

## Configuration

Set the following environment variables:

- `EMAIL_SERVER`: SMTP server address
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: Your email address
- `EMAIL_PASS`: Your email password
- `EMAIL_RECIPIENT`: Recipient's email address

## Usage

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

To run tests:

```bash
bun run test.ts
```

The script gathers the content from the subreddits and Hacker News, generates the HTML email, then saves it to a file to verify the output.

## License

[MIT License](LICENSE)
