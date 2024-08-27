import { chromium } from 'playwright';
import { HckrNewsPostFilter, SUBREDDITS } from './constants';
import { getTopPostsOfTheWeekForSubredditAPI } from './reddit';
import { getTopPostsOfTheWeekForHackerNews } from './hacker-news';
import { formatRedditPosts, formatHackerNewsPosts } from './formatters';
import { sendEmail } from './email-service';

// New function to generate the complete HTML document
export async function generateWeeklyTopPostsHTML(): Promise<string> {
  let emailContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2c3e50; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Weekly Top Posts</h1>
  `;

  // Get top posts from subreddits
  for (const subreddit of SUBREDDITS) {
    const posts = await getTopPostsOfTheWeekForSubredditAPI(subreddit);
    emailContent += formatRedditPosts(subreddit, posts);
  }

  // Get top posts from Hacker News
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage();
  const hnPostsGroupedByDay = await getTopPostsOfTheWeekForHackerNews(
    page,
    HckrNewsPostFilter.Top10
  );
  await browser.close();
  emailContent += formatHackerNewsPosts(hnPostsGroupedByDay);

  emailContent += `
      </body>
    </html>
  `;

  return emailContent;
}

// Main function to run the script
async function runWeeklyTopPosts() {
  try {
    // Generate the HTML content
    const emailContent = await generateWeeklyTopPostsHTML();

    // Send email
    await sendEmail('Weekly Top Posts', emailContent);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error running weekly top posts script:', error);
    throw error;
  }
}

// Only run the script if this file is being executed directly
// @ts-ignore
if (import.meta.main) {
  runWeeklyTopPosts().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
