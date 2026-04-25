import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseURL = 'http://localhost:5173';

async function takeScreenshot(page, url, outputPath, theme = 'dark', waitTime = 3000) {
  console.log(`Taking screenshot: ${outputPath} (${theme} theme)`);
  
  // Set theme
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Wait for page to fully load
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  // Take full page screenshot
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png'
  });
  
  console.log(`✓ Generated ${outputPath}`);
}

async function main() {
  const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Home page - Dark theme
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-dark.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated home-dark.png');
    
    // Home page - Light theme
    const themeToggle = await page.$('button[aria-label="Toggle theme"]');
    if (themeToggle) {
      await themeToggle.click();
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for theme to apply
    }
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-light.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated home-light.png');
    
    // Graph page - Dark theme (toggle back to dark)
    await page.goto(`${baseURL}/stock/2330`, { waitUntil: 'networkidle0' });
    const themeToggle2 = await page.$('button[aria-label="Toggle theme"]');
    if (themeToggle2) {
      // Check current theme and toggle if needed
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (!isDark) {
        await themeToggle2.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for graph to load
    await page.screenshot({
      path: path.join(screenshotsDir, 'stock-dark.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated stock-dark.png');
    
    // Graph page - Light theme
    const themeToggle3 = await page.$('button[aria-label="Toggle theme"]');
    if (themeToggle3) {
      await themeToggle3.click();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for theme to apply
    }
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for graph to render
    await page.screenshot({
      path: path.join(screenshotsDir, 'stock-light.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated stock-light.png');

    // News page - Dark theme
    await page.goto(`${baseURL}/news/1`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: path.join(screenshotsDir, 'news-dark.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated news-dark.png');

    // Channel page - Dark theme
    await page.goto(`${baseURL}/podcaster/股癌%20Gooaye`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: path.join(screenshotsDir, 'channel-dark.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated channel-dark.png');

    // Tag page - Dark theme
    await page.goto(`${baseURL}/tag/AI伺服器`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({
      path: path.join(screenshotsDir, 'tag-dark.png'),
      fullPage: true,
      type: 'png'
    });
    console.log('✓ Generated tag-dark.png');
    
  } catch (error) {
    console.error('Error generating screenshots:', error);
    console.log('\nMake sure the dev server is running: npm run dev');
  } finally {
    await browser.close();
  }
  
  console.log('\nDone! Screenshots saved to public/screenshots/');
}

main().catch(console.error);

