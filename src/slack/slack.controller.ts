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
      console.log(`Slack URL Verification 요청을 받음: ${challenge}`);
      return res.status(200).json({ challenge });
    }

    // 🔹 봇이 멘션되었거나 메시지를 받은 경우 처리
    if (event && event.type === 'app_mention') {
      console.log(`🔹 Slack에서 멘션 수신: ${event.text}`);
      res.status(200).send('OK'); // Slack 응답을 빠르게 반환

      const command = event.text.trim().toLowerCase(); // 메시지에서 명령어 추출

      // 🔹 '/help' 명령어 처리
      if (command.includes('/help')) {
        const helpMessage = `🤖 사용할 수 있는 명령어 목록:
        \n• \`/help\` - 사용 가능한 명령어 목록 보기
        \n• \`/crawl <URL>\` - 주어진 URL을 크롤링
        \n• \`/status\` - 서버 상태 확인`;

        await this.slackService.sendMessage(event.channel, helpMessage);
      }

      return;
    }

    return res.sendStatus(200);
  }
}