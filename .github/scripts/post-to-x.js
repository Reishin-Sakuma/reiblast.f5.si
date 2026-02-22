const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const postFile = process.env.POST_FILE;
if (!postFile) {
  console.error('POST_FILE environment variable is not set');
  process.exit(1);
}

// Read blog post file (path is relative to repo root)
const repoRoot = path.join(__dirname, '..', '..');
const fullPath = path.join(repoRoot, postFile);
const content = fs.readFileSync(fullPath, 'utf-8');

// Parse frontmatter
const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatterMatch) {
  console.log('No frontmatter found, skipping');
  process.exit(0);
}

const frontmatter = frontmatterMatch[1];

// Extract fields
const titleMatch = frontmatter.match(/^title:\s*["'](.+?)["']\s*$/m)
  || frontmatter.match(/^title:\s*(.+?)\s*$/m);
const slugMatch = frontmatter.match(/^slug:\s*(.+?)\s*$/m);
const draftMatch = frontmatter.match(/^draft:\s*(.+?)\s*$/m);
const tagsMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m);

if (!titleMatch || !slugMatch) {
  console.error('Missing required frontmatter fields (title or slug)');
  process.exit(1);
}

const title = titleMatch[1];
const slug = slugMatch[1];
const draft = draftMatch ? draftMatch[1].trim() === 'true' : false;

if (draft) {
  console.log('Post is a draft, skipping');
  process.exit(0);
}

// Build hashtags from article tags (up to 3)
let hashtags = '#エンジニア #ブログ';
if (tagsMatch) {
  const tags = tagsMatch[1]
    .split(',')
    .map(t => t.trim().replace(/["']/g, ''))
    .filter(t => t.length > 0)
    .slice(0, 3)
    .map(t => `#${t.replace(/\s+/g, '')}`)
    .join(' ');
  if (tags) hashtags = tags;
}

const url = `https://reiblast.f5.si/blog/${slug}`;
const text = `📝 新記事を公開しました！\n\n「${title}」\n\n${url}\n\n${hashtags}`;

async function main() {
  console.log('Posting to X...');
  console.log('Text:', text);
  try {
    const tweet = await client.v2.tweet(text);
    console.log('Posted successfully! Tweet ID:', tweet.data.id);
  } catch (err) {
    console.error('Failed to post to X:', err);
    process.exit(1);
  }
}

main();
