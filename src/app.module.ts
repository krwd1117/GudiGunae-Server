import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module'; // SlackModule 추가

@Module({
  imports: [SlackModule], // SlackModule을 imports에 포함
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}