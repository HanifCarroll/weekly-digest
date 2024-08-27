const clientId = process.env.REDDIT_CLIENT_ID;
const clientSecret = process.env.REDDIT_CLIENT_SECRET;
const username = process.env.REDDIT_USERNAME;
const password = process.env.REDDIT_PASSWORD;
const userAgent = process.env.REDDIT_USER_AGENT;
const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getRedditAccessToken() {
  if (!clientId || !clientSecret || !username || !password || !userAgent) {
    throw new Error('Missing required environment variables');
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
    });
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Access Token Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

getRedditAccessToken();
