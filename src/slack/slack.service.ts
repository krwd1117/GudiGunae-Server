import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private slackToken = process.env.SLACK_BOT_TOKEN;

  async sendMessage(channel: string, text: string) {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text },
        { headers: { Authorization: `Bearer ${this.slackToken}` } }
      );

      console.log(`📤 Slack 메시지 전송 응답:`, response.data);

      if (!response.data.ok) {
        console.error(`❌ Slack 메시지 전송 실패:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Slack 메시지 전송 중 오류 발생:`, error);
    }
  }
}