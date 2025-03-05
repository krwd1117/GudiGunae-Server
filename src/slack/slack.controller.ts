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
          const command = event.text.trim().toLowerCase();
  
          // ✅ 클라이언트에게 먼저 응답을 보낸다
          res.status(200).send('OK');
  
          // ✅ setImmediate를 사용해 비동기 작업을 별도로 실행
          setImmediate(async () => {
              try {
                  if (command === '/help') {
                      const helpMessage = `
  🤖 사용할 수 있는 명령어 목록:
  • \`/help\` - 사용 가능한 명령어 목록 보기
  • \`/crawl\` - 미리 설정된 모든 사이트 크롤링
                      `;
                      await this.slackService.sendMessage(event.channel, helpMessage);
                  } else if (command === '/crawl') {
                      await this.slackService.crawlAllWebsites(event.channel);
                  }
              } catch (error) {
                  console.error('Slack 명령 실행 중 오류 발생:', error);
              }
          });
  
          return;
      }
  
      return res.sendStatus(200);
  }
}