import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
    // Slack 서비스 주입
    constructor(private readonly slackService: SlackService) { }

    // Slack 이벤트 엔드포인트 상태 확인
    @Get('events')
    async checkSlackEvent(@Res() res: Response) {
        return res.status(200).json({ message: 'Slack Events Endpoint is Working!' });
    }

    // Slack 이벤트 처리 엔드포인트
    @Post('events')
    async handleSlackEvent(@Req() req: Request, @Res() res: Response) {
        const { type, challenge, event } = req.body;

        // Slack URL 검증 처리
        if (type === 'url_verification') {
            return res.status(200).json({ challenge });
        }

        // 메시지 이벤트 처리
        if (event?.type === 'app_mention') {
            console.log(`🔹 Slack에서 멘션 수신: ${event.text}`);
            // 멘션 부분을 제거하고 실제 명령어만 추출
            const command = event.text?.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase() || '';

            // ✅ 3초 타임아웃 방지를 위해 클라이언트에게 먼저 응답을 보낸다
            res.status(200).send('OK');

            // ✅ 비동기 작업을 이벤트 루프의 다음 틱으로 연기
            setImmediate(async () => {
                try {
                    // 도움말 명령어 처리
                    if (command === '/help') {
                        const helpMessage = `
                        🤖 사용할 수 있는 명령어 목록:
                        • \`/help\` - 사용 가능한 명령어 목록 보기
                        • \`/crawl\` - 미리 설정된 모든 사이트 크롤링
                      `;
                        await this.slackService.sendMessage(event.channel, helpMessage);
                    } 
                    // 크롤링 명령어 처리
                    else if (command === '/crawl') {
                        await this.slackService.crawlAllWebsites(event.channel);
                    }
                } catch (error) {
                    console.error('Slack 명령 실행 중 오류 발생:', error);
                }
            });

            return;
        }

        // 기타 이벤트에 대한 기본 응답
        return res.sendStatus(200);
    }
}