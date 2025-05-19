import { Injectable, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class SlackService {
  private slackToken = process.env.SLACK_BOT_TOKEN;

  constructor(
  @Inject(forwardRef(() => CrawlerService))
  private readonly crawlerService: CrawlerService,
) {}

  async sendMessage(channel: string, text: string) {
    try {
      console.log(`[SlackService] Slack 메시지 전송 시도: 채널=${channel}, 내용=${text}`);
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text },
        { headers: { Authorization: `Bearer ${this.slackToken}` } }
      );
      console.log(`[SlackService] Slack API 응답:`, response.data);
    } catch (error) {
      console.error(`❌ Slack 메시지 전송 오류:`, error);
    }
  }

  async crawlAllSitesAndNotifySlack(channel: string): Promise<void> {
    await this.sendMessage(channel, '🔄 모든 사이트 크롤링을 시작합니다...');

    const { success, fail } = await this.crawlerService.crawlAllRegisteredSites(
      channel,
      async (siteName: string, result: { success: boolean; message: string }) => {
        // Send real-time updates for each site
        // await this.sendMessage(channel, `${siteName} 크롤링 결과:\n${result.message}`);
      }
    );

    // Send final summary
    let resultMessage = `✅ 크롤링 완료!\n\n`;
    resultMessage += `✅ 성공한 사이트 (${success.length}개):\n${success.join('\n') || '없음'}\n\n`;
    resultMessage += `❌ 실패한 사이트 (${fail.length}개):\n${fail.join('\n') || '없음'}`;

    await this.sendMessage(channel, resultMessage);
  }
}