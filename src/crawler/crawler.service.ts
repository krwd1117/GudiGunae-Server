import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  private predefinedUrls: Record<string, string> = {
    '벽산더이룸': 'http://pf.kakao.com/_xdLzxgG',
    '한신아이티': 'http://pf.kakao.com/_QRALxb',
    '미가푸드빌': 'https://pf.kakao.com/_xjQpls',
    '윤쉐프코오롱': 'https://pf.kakao.com/_Xxhxkhs',
    '더이츠푸드': 'http://pf.kakao.com/_QLvRn',
    '윤쉐프구로': 'https://pf.kakao.com/_mWmPs',
    '자연푸드구내식당': 'https://pf.kakao.com/_xaYxgFG',
    '푸드1번가': 'https://pf.kakao.com/_hMlAG/posts',
  };

  async crawlWebsite(url: string): Promise<{ name: string; image: string }> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      console.log(`🔍 크롤링 시작: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      // 식당 이름 가져오기
      const name = await page.$eval('.tit_name', (el) => el.textContent?.trim() || '이름 없음');

      // 버튼 클릭 (이미지 로딩을 위해)
      const button = await page.$('.btn_thumb');
      if (button) {
        await button.click();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 대기 코드 수정
      }

      // 이미지 URL 가져오기 (null 방지)
      const image = await page.$eval('.view_thumb .img_thumb', (img) => img.getAttribute('src') || '이미지 없음');

      await browser.close();
      return { name, image };
    } catch (error) {
      await browser.close();
      throw new Error(`크롤링 실패: ${error.message}`);
    }
  }

  async crawlAllWebsites(): Promise<{ success: string[]; fail: string[] }> {
    const successList: string[] = [];
    const failList: string[] = [];

    for (const [siteName, url] of Object.entries(this.predefinedUrls)) {
      try {
        const { name, image } = await this.crawlWebsite(url);
        successList.push(`✅ ${name}\n🖼️ 이미지: ${image}`);
      } catch (error) {
        failList.push(`❌ ${siteName}: ${error.message}`);
      }
    }

    return { success: successList, fail: failList };
  }
}