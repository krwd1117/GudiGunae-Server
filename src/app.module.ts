import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CrawlerModule,
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}