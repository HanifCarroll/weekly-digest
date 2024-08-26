import { writeFile } from 'fs/promises';
import { chromium, Browser } from 'playwright';
import { generateWeeklyTopPostsHTML } from './script';

async function saveOutputToFile(content: string) {
  const filename = `weekly_digest_test_${new Date().toISOString().split('T')[0]}.html`;
  await writeFile(filename, content, 'utf-8');
  console.log(`Output saved to ${filename}`);
}

async function runWeeklyTopPostsTest() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: false,
    });
    const page = await browser.newPage();

    // Generate the HTML content
    const emailContent = await generateWeeklyTopPostsHTML(page);

    // Save output to file
    await saveOutputToFile(emailContent);
    console.log('Test run completed successfully');
  } catch (error) {
    console.error('Error running weekly top posts script:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test script
runWeeklyTopPostsTest().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
