import { Post } from './constants';

let redditAccessToken: string = '';
let tokenExpirationTime: number = 0;

async function getRedditOAuthToken(): Promise<string> {
  if (redditAccessToken && Date.now() < tokenExpirationTime) {
    return redditAccessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  const userAgent = process.env.REDDIT_USER_AGENT;

  if (!clientId || !clientSecret || !username || !password || !userAgent) {
    throw new Error('Missing Reddit API credentials');
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    // This might fail if you have special characters in your password.
    // Unfortunately, I couldn't find a way to escape them, so I just
    // changed my password to one without special characters.
    throw new Error('Failed to obtain Reddit OAuth token');
  }

  redditAccessToken = data.access_token;
  tokenExpirationTime = Date.now() + data.expires_in * 1000;

  return redditAccessToken;
}

export async function getTopPostsOfTheWeekForSubredditAPI(
  subredditName: string,
  limit: number = 25
): Promise<Post[]> {
  try {
    console.log(`Fetching posts for /r/${subredditName} using API`);
    const token = await getRedditOAuthToken();
    const apiUrl = `https://oauth.reddit.com/r/${subredditName}/top?t=week&limit=${limit}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `bearer ${token}`,
        'User-Agent':
          process.env.REDDIT_USER_AGENT || 'WeeklyTopPosts/1.0 by YourUsername',
      },
    });

    const data = await response.json();

    if (!data.data || !data.data.children) {
      console.error(`Invalid response for /r/${subredditName}`);
      return [];
    }

    const posts: Post[] = data.data.children
      .map((child: any) => {
        const post = child.data;
        return {
          title: post.title,
          url: post.url,
          numberOfUpvotes: post.ups,
          numberOfComments: post.num_comments,
        };
      })
      .filter((post: Post) => post.title && post.url);

    console.log(`Found ${posts.length} posts for /r/${subredditName}`);

    return posts;
  } catch (error) {
    console.error(
      `Error fetching posts for /r/${subredditName} using API:`,
      error
    );
    return [];
  }
}
