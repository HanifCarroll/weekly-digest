import { chromium, Browser, Page } from 'playwright';
import nodemailer from 'nodemailer';

// List of subreddits to scrape
const TECH_SUBREDDITS = ['experienceddevs', 'node', 'reactjs'];
const BUSINESS_SUBREDDITS = ['entrepreneur', 'startups', 'saas', 'sideproject'];
const SUBREDDITS = [...TECH_SUBREDDITS, ...BUSINESS_SUBREDDITS];

enum HckrNewsPostFilter {
  Top10 = 10,
  Top20 = 20,
  Top50Percent = 0.5,
}

type Post = {
  numberOfComments: number;
  numberOfUpvotes: number;
  title: string;
  url: string;
};

async function getTopPostsOfTheWeekForSubreddit(
  page: Page,
  subredditName: string,
  limit: number = 25
): Promise<Post[]> {
  try {
    console.log(`Fetching posts for /r/${subredditName}`);
    await page.goto(
      `https://old.reddit.com/r/${subredditName}/top/?sort=top&t=week`,
      { waitUntil: 'networkidle' }
    );

    // Wait for a specific element that indicates the content has loaded
    await page.waitForSelector('div[data-context="listing"]', {
      timeout: 10000,
    });

    // Add a delay after each request
    await page.waitForTimeout(5000); // 5 seconds delay

    console.log(`Evaluating page for /r/${subredditName}`);
    const posts: (Post | null)[] = await page.evaluate((limit) => {
      const postElements = Array.from(
        document.querySelectorAll('div[data-context="listing"]')
      );
      return postElements.slice(0, limit).map((element) => {
        const titleElement = element.querySelector('p.title');
        const urlElement = element.querySelector('a.title');
        const upvotesElement = element.querySelector('div.score.unvoted');
        const commentsElement = element.querySelector(
          'a[data-event-action="comments"]'
        );
        let title = titleElement?.textContent?.trim() || '';
        // Remove subreddit name from title (self.ExperiencedDevs)
        title = title.replace(/\s*\(self\.[^)]+\)/, '').trim();
        const url = urlElement?.getAttribute('href') || '';
        const upvotes = parseInt(
          upvotesElement?.textContent?.trim() || '0',
          10
        );
        const comments = parseInt(
          commentsElement?.textContent?.trim() || '0',
          10
        );

        // Skip ads
        if (isNaN(upvotes) || isNaN(comments)) {
          return null;
        }

        return {
          title,
          url,
          numberOfUpvotes: upvotes,
          numberOfComments: comments,
        };
      });
    }, limit);
    console.log(`Found ${posts.length} posts for /r/${subredditName}`);

    return posts
      .filter((post) => post !== null)
      .map((post) => ({
        ...post,
        url: post.url.startsWith('/')
          ? `https://www.reddit.com${post.url}`
          : post.url,
      }));
  } catch (error) {
    console.error(`Error fetching posts for /r/${subredditName}:`, error);
    return [];
  }
}

async function getTopPostsOfTheWeekForHackerNews(
  page: Page,
  limitPerDay: HckrNewsPostFilter = HckrNewsPostFilter.Top10
): Promise<{ date: string; posts: Post[] }[]> {
  try {
    await page.goto('https://hckrnews.com/', { waitUntil: 'networkidle' });

    // Click the appropriate filter button based on limitPerDay
    switch (limitPerDay) {
      case HckrNewsPostFilter.Top10:
        await page.click('a.filtertop.by10');
        break;
      case HckrNewsPostFilter.Top20:
        await page.click('a.filtertop.by20');
        break;
      case HckrNewsPostFilter.Top50Percent:
        await page.click('a.filtertop.byhalf');
        break;
    }

    // Wait for the page to update after clicking the filter
    await page.waitForLoadState('networkidle');

    // Scroll to load more posts
    await page.evaluate(async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const targetDate = eightDaysAgo
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

      while (true) {
        const lastDateElement = document.querySelector(
          'ul.entries.unstyled:last-child'
        );
        if (lastDateElement && lastDateElement.id <= targetDate) {
          break;
        }

        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second between scrolls
      }
    });

    const postsGroupedByDay: { date: string; posts: Post[] }[] =
      await page.evaluate(() => {
        const groupedPosts: { date: string; posts: Post[] }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of the day
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        document.querySelectorAll('ul.entries.unstyled').forEach((dayList) => {
          const dateId = dayList.id;
          const year = parseInt(dateId.slice(0, 4));
          const month = parseInt(dateId.slice(4, 6)) - 1;
          const day = parseInt(dateId.slice(6, 8));
          const postDate = new Date(year, month, day);

          // Skip today's date and include posts from yesterday up to one week ago
          if (postDate >= oneWeekAgo && postDate < today) {
            const posts: Post[] = [];
            dayList.querySelectorAll('li.entry.row').forEach((postElement) => {
              // Skip posts that don't fit the filter
              if (window.getComputedStyle(postElement).display === 'none') {
                return;
              }

              const title =
                postElement
                  .querySelector('a.link.story')
                  ?.textContent?.trim() || '';
              const url =
                postElement
                  .querySelector('a.link.story')
                  ?.getAttribute('href') || '';
              const numberOfUpvotes = parseInt(
                postElement.querySelector('span.points')?.textContent?.trim() ||
                  '0',
                10
              );
              const numberOfComments = parseInt(
                postElement
                  .querySelector('span.comments')
                  ?.textContent?.trim() || '0',
                10
              );

              posts.push({
                title,
                url,
                numberOfUpvotes,
                numberOfComments,
              });
            });

            if (posts.length > 0) {
              groupedPosts.push({
                date: postDate.toDateString(),
                posts,
              });
            }
          }
        });

        return groupedPosts;
      });

    // Sort the grouped posts by date in descending order (most recent first)
    return postsGroupedByDay.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching posts for Hacker News:', error);
    return [];
  }
}

function formatRedditPosts(subreddit: string, posts: Post[]): string {
  let html = `
    <div style="margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
      <h2 style="color: #1a1a1b; font-family: Arial, sans-serif; border-bottom: 2px solid #ff4500; padding-bottom: 10px;">Top 25 posts from /r/${subreddit}</h2>
      <ul style="list-style-type: none; padding: 0;">
  `;
  posts.forEach((post) => {
    html += `
      <li style="margin-bottom: 15px; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
        <a href="${post.url}" style="color: #0079d3; text-decoration: none; font-weight: bold; font-size: 16px;">${post.title}</a>
        <div style="color: #7c7c7c; font-size: 12px; margin-top: 5px;">
          ${post.numberOfUpvotes} upvotes | ${post.numberOfComments} comments
        </div>
      </li>
    `;
  });
  html += '</ul></div>';
  return html;
}

function formatHackerNewsPosts(
  postsGroupedByDay: { date: string; posts: Post[] }[]
): string {
  let html = `
    <div style="margin-bottom: 30px; background-color: #f6f6ef; border-radius: 8px; padding: 20px;">
      <h2 style="color: #ff6600; font-family: Verdana, Geneva, sans-serif; border-bottom: 2px solid #ff6600; padding-bottom: 10px;">Top 10 posts from Hacker News</h2>
  `;
  postsGroupedByDay.forEach(({ date, posts }) => {
    html += `
      <h3 style="color: #828282; font-size: 18px; margin-top: 20px;">${date}</h3>
      <ul style="list-style-type: none; padding: 0;">
    `;
    posts.forEach((post) => {
      html += `
        <li style="margin-bottom: 15px; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
          <a href="${post.url}" style="color: #000000; text-decoration: none; font-weight: bold; font-size: 16px;">${post.title}</a>
          <div style="color: #828282; font-size: 12px; margin-top: 5px;">
            ${post.numberOfUpvotes} points | ${post.numberOfComments} comments
          </div>
        </li>
      `;
    });
    html += '</ul>';
  });
  html += '</div>';
  return html;
}

// Function to send email
async function sendEmail(subject: string, content: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject,
    html: content,
  });
}

// New function to generate the complete HTML document
async function generateWeeklyTopPostsHTML(page: Page): Promise<string> {
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
    const posts = await getTopPostsOfTheWeekForSubreddit(page, subreddit);
    emailContent += formatRedditPosts(subreddit, posts);
  }

  // Get top posts from Hacker News
  const hnPostsGroupedByDay = await getTopPostsOfTheWeekForHackerNews(
    page,
    HckrNewsPostFilter.Top10
  );
  emailContent += formatHackerNewsPosts(hnPostsGroupedByDay);

  emailContent += `
      </body>
    </html>
  `;

  return emailContent;
}

// Main function to run the script
async function runWeeklyTopPosts() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    const page = await browser.newPage();

    // Generate the HTML content
    const emailContent = await generateWeeklyTopPostsHTML(page);

    // Send email
    await sendEmail('Weekly Top Posts', emailContent);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error running weekly top posts script:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
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

export {
  generateWeeklyTopPostsHTML,
  getTopPostsOfTheWeekForSubreddit,
  getTopPostsOfTheWeekForHackerNews,
  formatRedditPosts,
  formatHackerNewsPosts,
  HckrNewsPostFilter,
  SUBREDDITS,
};
