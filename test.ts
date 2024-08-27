import { writeFile } from 'fs/promises';
import { chromium, Browser } from 'playwright';
import { generateWeeklyTopPostsHTML } from './script';

async function saveOutputToFile(content: string) {
  const filename = `weekly_digest_test_${new Date().toISOString().split('T')[0]}.html`;
  await writeFile(filename, content, 'utf-8');
  console.log(`Output saved to ${filename}`);
}

async function runWeeklyTopPostsTest() {
  try {
    // Generate the HTML content
    const emailContent = await generateWeeklyTopPostsHTML();

    await saveOutputToFile(emailContent);
    console.log('Test run completed successfully. Output saved to file.');
  } catch (error) {
    console.error('Error running weekly top posts script:', error);
    throw error;
  }
}

// Run the test script
runWeeklyTopPostsTest().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
