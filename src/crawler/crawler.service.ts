import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  /**
   * 식당 프로필 페이지 URL 모음
   * 이 URL들은 식당 정보를 찾을 수 있는 메인 프로필
   */
  private profileImageUrls: Record<string, string> = {
    '벽산더이룸': 'http://pf.kakao.com/_xdLzxgG',
    '한신아이티': 'http://pf.kakao.com/_QRALxb',
    '미가푸드빌': 'https://pf.kakao.com/_xjQpls',
    '윤쉐프코오롱': 'https://pf.kakao.com/_Xxhxkhs',
    '더이츠푸드': 'http://pf.kakao.com/_QLvRn',
    '윤쉐프구로': 'https://pf.kakao.com/_mWmPs',
  };

  /**
   * 식당 피드 페이지 URL 모음
   * 이 URL들은 피드 형식으로 이미지를 표시하므로 다른 이미지 추출 방법 필요
   */
  private feedImageUrls: Record<string, string> = {
    '자연푸드구내식당': 'https://pf.kakao.com/_xaYxgFG/posts',
    '푸드1번가': 'https://pf.kakao.com/_hMlAG/posts',
  }

  /**
   * 단일 웹사이트를 크롤링하여 식당 이름과 프로필 이미지를 추출
   */
  async crawlWebsite(url: string): Promise<{ name: string; image: string }> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      console.log(`🔍 크롤링 시작: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      // 프로필 페이지에서 식당 이름 추출
      const name = await this.extractRestaurantName(page);

      // 페이지 유형(피드 또는 프로필)에 따라 이미지 URL 추출
      const image = await this.extractImageUrl(page, url);
      
      await browser.close();
      return { name, image };
    } catch (error) {
      await browser.close();
      throw new Error(`크롤링 실패: ${error.message}`);
    }
  }

  /**
   * 프로필 페이지에서 식당 이름을 추출
   */
  private async extractRestaurantName(page: puppeteer.Page): Promise<string> {
    return await page.$eval('.tit_name', (el) => el.textContent?.trim() || '이름 없음');
  }

  /**
   * 페이지 유형에 따라 이미지 URL을 추출
   */
  private async extractImageUrl(page: puppeteer.Page, url: string): Promise<string> {
    // URL이 피드 페이지인지 확인
    if (Object.values(this.feedImageUrls).includes(url)) {
      return this.extractFeedImage(page);
    }
    return this.extractProfileImage(page);
  }

  /**
   * 피드 페이지에서 이미지 URL을 추출
   */
  private async extractFeedImage(page: puppeteer.Page): Promise<string> {
    return await page.$eval('.wrap_fit_thumb', (el) => {
      const style = el.getAttribute('style');
      if (!style) return '이미지 없음';
      const match = style.match(/background-image:\s*url\(["']?([^"'\)]+)["']?\)/);
      return match ? match[1] : '이미지 없음';
    });
  }

  /**
   * 프로필에서 이미지 URL을 추출합니다
   */
  private async extractProfileImage(page: puppeteer.Page): Promise<string> {
    const button = await page.$('.btn_thumb');
    if (button) {
      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return await page.$eval('.view_thumb .img_thumb', (img) => img.getAttribute('src') || '이미지 없음');
  }

  /**
   * 등록된 모든 웹사이트를 크롤링하고 정보를 수집
   */
  async crawlAllWebsites(onSiteCrawled?: (siteName: string, result: { success: boolean; message: string }) => Promise<void>): Promise<{ success: string[]; fail: string[] }> {
    const successList: string[] = [];
    const failList: string[] = [];

    // 프로필과 피드 컬렉션의 URL 통합
    const allUrls = { ...this.profileImageUrls, ...this.feedImageUrls };

    // 각 URL 처리 및 결과 수집
    for (const [siteName, url] of Object.entries(allUrls)) {
      try {
        const { name, image } = await this.crawlWebsite(url);
        const successMessage = `✅ ${name} : ${image}`;
        successList.push(successMessage);
        
        // 콜백이 제공된 경우 진행 상황 알림
        if (onSiteCrawled) {
          await onSiteCrawled(siteName, { 
            success: true, 
            message: successMessage 
          });
        }
      } catch (error) {
        const failMessage = `❌ ${siteName}: ${error.message}`;
        failList.push(failMessage);
        
        // 콜백이 제공된 경우 실패 알림
        if (onSiteCrawled) {
          await onSiteCrawled(siteName, { 
            success: false, 
            message: failMessage 
          });
        }
      }
    }

    return { success: successList, fail: failList };
  }
}