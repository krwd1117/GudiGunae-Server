import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { RestaurantService } from './restaurant.service';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SlackService } from '../slack/slack.service';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  /**
   * 식당 프로필 페이지 URL과 UUID 매핑
   */
  private profileImageUrls: Record<string, { url: string; uuid: string }> = {
    '벽산더이룸': { url: 'https://pf.kakao.com/_xdLzxgG', uuid: '6803f840-c325-4063-817c-13884da1cfb0' },
    '한신IT타워구내식당': { url: 'https://pf.kakao.com/_QRALxb', uuid: '7400a6dd-3356-422f-a8af-ee458085a528' },
    '미가푸드빌': { url: 'https://pf.kakao.com/_xjQpls', uuid: '9a0817ac-9e4d-4c88-8462-852074c23db7' },
    '윤쉐프 코오롱': { url: 'https://pf.kakao.com/_Xxhxkhs', uuid: 'ad7802ff-d8b4-436e-96d1-915c8fe2bddc' },
    '더이츠푸드': { url: 'https://pf.kakao.com/_QLvRn', uuid: 'c3e88513-9be0-4709-a509-82d3ec5ae413' },
    '윤쉐프-구로E&C': { url: 'https://pf.kakao.com/_mWmPs', uuid: 'cc7b8403-dd93-4988-8abe-3530e8711ba8' },
  };

  /**
   * 식당 피드 페이지 URL과 UUID 매핑
   */
  private feedImageUrls: Record<string, { url: string; uuid: string }> = {
    '구로 e스페이스 더드림푸드': { url: 'https://pf.kakao.com/_lPpZn/posts', uuid: '2c558a91-c256-4128-bfad-6f2d78bf8189' },
    '알찬푸드': { url: 'https://pf.kakao.com/_wbeAn/posts', uuid: 'f037605c-bbee-47fb-87b9-9fd1c2978a3b' },
    '아티스테이블': { url: 'https://pf.kakao.com/_ixetln/posts', uuid: '6466846f-9a8a-4d45-b524-8a37a465468e' },
    '자연푸드 구내식당': { url: 'https://pf.kakao.com/_xaYxgFG/posts', uuid: '70bbe58e-efc6-40ea-aa19-d8797e4d3b36' },
    '푸드1번가(구로)': { url: 'https://pf.kakao.com/_hMlAG/posts', uuid: 'c0754a20-82eb-4a45-8bfa-ca4fa8d068c3' },
    '우림더이룸푸드': { url: 'https://pf.kakao.com/_hBxoxjG/posts', uuid: 'f791021a-0500-4a6c-86eb-7da2f39e8112' },
  }

  constructor(
  private readonly restaurantService: RestaurantService,
  @Inject(forwardRef(() => SlackService))
  private readonly slackService: SlackService,
) {}


  /**
   * 단일 웹사이트를 크롤링하여 식당 이름과 프로필 이미지를 추출
   */
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`재시도 ${attempt}/${maxRetries}: ${error.message}`);
        if (attempt === maxRetries) throw error;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('최대 재시도 횟수 초과');
  }

  async crawlWebsite(url: string): Promise<{ name: string; image: string }> {
    // 운영체제별 Puppeteer 설정
    const launchOptions: puppeteer.LaunchOptions = {
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    };

    // 리눅스(라즈베리파이)인 경우 chromium-browser 경로 지정
    if (process.platform === 'linux') {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
    }
    // macOS인 경우 Chrome 경로 지정
    else if (process.platform === 'darwin') {
      launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(90000);
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      console.log(`🔍 크롤링 시작: ${url}`);
      await this.retryOperation(async () => {
        await page.goto(url, { 
          waitUntil: ['networkidle2', 'domcontentloaded'],
          timeout: 90000
        });
        // 페이지 로딩을 위한 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

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
    const feedUrls = Object.values(this.feedImageUrls).map(info => info.url);
    if (feedUrls.includes(url)) {
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
  async crawlAllRegisteredSites(
    channel: string,
    onSiteCrawled?: (siteName: string, result: { success: boolean; message: string }) => Promise<void>
  ): Promise<{ success: string[]; fail: string[] }> {
    const successList: string[] = [];
    const failList: string[] = [];

    // URL과 UUID 정보 통합
    const allUrls = { ...this.profileImageUrls, ...this.feedImageUrls };

    // 병렬 처리를 위한 Promise 배열 생성
    const crawlingPromises = Object.entries(allUrls).map(async ([siteName, info]) => {
      try {
        const { image } = await this.crawlWebsite(info.url);
        
        // 크롤링 성공 시 데이터베이스 업데이트 (RestaurantService 사용)
        await this.restaurantService.updateRestaurantImage(info.uuid, image);
        
        const successMessage = `✅ ${siteName} : ${image}`;
        successList.push(successMessage);
        
        if (onSiteCrawled) {
          await onSiteCrawled(siteName, { 
            success: true, 
            message: successMessage 
          });
        }
      } catch (error) {
        const failMessage = `❌ ${siteName}: ${error.message}`;
        failList.push(failMessage);
        
        if (onSiteCrawled) {
          await onSiteCrawled(siteName, { 
            success: false, 
            message: failMessage 
          });
        }

        // 에러 로깅 강화
        this.logger.error(`크롤링 실패 - ${siteName}:`, {
          error: error.message,
          stack: error.stack,
          url: info.url
        });
      }
    });

    // 모든 크롤링 작업을 병렬로 실행
    await Promise.all(crawlingPromises);

    return { success: successList, fail: failList };
  }
  
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async handleCronCrawling() {
    this.logger.debug('크롤링 작업 시작 - 매일 오전 11시');
    try {
      // 슬랙으로 바로 결과 전송
      await this.slackService.crawlAllSitesAndNotifySlack('gudigunae');
    } catch (error) {
      this.logger.error('크론 크롤링/슬랙 전송 중 오류 발생:', error);
    }
  }
}
