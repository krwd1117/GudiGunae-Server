import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { RestaurantService } from './restaurant.service';
import { forwardRef } from '@nestjs/common';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [forwardRef(() => SlackModule)],
  providers: [CrawlerService, RestaurantService],
  exports: [CrawlerService, RestaurantService],
})
export class CrawlerModule {}