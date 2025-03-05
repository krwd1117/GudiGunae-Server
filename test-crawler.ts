import * as puppeteer from 'puppeteer';

const predefinedUrls: Record<string, string> = {
  '벽산더이룸': 'http://pf.kakao.com/_xdLzxgG',
  '한신아이티': 'http://pf.kakao.com/_QRALxb',
  '미가푸드빌': 'https://pf.kakao.com/_xjQpls',
  '윤쉐프코오롱': 'https://pf.kakao.com/_Xxhxkhs',
  '더이츠푸드': 'http://pf.kakao.com/_QLvRn',
  '윤쉐프구로': 'https://pf.kakao.com/_mWmPs',
  '자연푸드구내식당': 'https://pf.kakao.com/_xaYxgFG',
  '푸드1번가': 'https://pf.kakao.com/_hMlAG/posts',
};

async function testCrawl(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`🔍 크롤링 시작: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    const name = await page.$eval('.tit_name', (el) => el.textContent?.trim() || '이름 없음');

    const button = await page.$('.btn_thumb');
    if (button) {
      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const image = await page.$eval('.view_thumb .img_thumb', (img) => img.getAttribute('src') || '이미지 없음');

    console.log(`✅ 크롤링 완료: ${name}`);
    console.log(`🖼️ 이미지 URL: ${image}`);
  } catch (error) {
    console.error(`❌ 크롤링 실패: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// ✅ 테스트할 사이트 선택
const testSite = '벽산더이룸'; // 변경 가능
const testUrl = predefinedUrls[testSite];

// 크롤링 실행
if (testUrl) {
  testCrawl(testUrl);
} else {
  console.error(`❌ 테스트할 URL이 없습니다.`);
}