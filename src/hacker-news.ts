import { Post, HckrNewsPostFilter } from './constants';
import { Page } from 'playwright';

export async function getTopPostsOfTheWeekForHackerNews(
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
