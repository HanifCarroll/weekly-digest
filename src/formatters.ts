import { Post } from './constants';

export function formatRedditPosts(subreddit: string, posts: Post[]): string {
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

export function formatHackerNewsPosts(
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