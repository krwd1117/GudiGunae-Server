import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { forwardRef } from '@nestjs/common';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [forwardRef(() => CrawlerModule)],
  controllers: [SlackController],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}