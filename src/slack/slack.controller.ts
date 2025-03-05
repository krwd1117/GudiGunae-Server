import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get('events')
  async checkSlackEvent(@Res() res: Response) {
    return res.status(200).json({ message: 'Slack Events Endpoint is Working!' });
  }

  @Post('events')
  async handleSlackEvent(@Req() req: Request, @Res() res: Response) {
    const { type, challenge, event } = req.body;

    if (type === 'url_verification') {
      return res.status(200).json({ challenge });
    }

    if (event.type === 'message') {
      res.status(200).send('OK');

      const command = event.text.trim().toLowerCase();

      if (command === '/help') {
        const helpMessage = `
🤖 사용할 수 있는 명령어 목록:
• \`/help\` - 사용 가능한 명령어 목록 보기
• \`/crawl\` - 미리 설정된 모든 사이트 크롤링
        `;
        await this.slackService.sendMessage(event.channel, helpMessage);
        return;
      }

      if (command === '/crawl') {
        await this.slackService.sendMessage(event.channel, '🔄 모든 사이트 크롤링을 시작합니다...');
        await this.slackService.crawlAllWebsites(event.channel);
        return;
      }
    }

    return res.sendStatus(200);
  }
}