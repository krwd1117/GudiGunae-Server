import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { RestaurantService } from './restaurant.service';

@Module({
  providers: [CrawlerService, RestaurantService],
  exports: [CrawlerService, RestaurantService],
})
export class CrawlerModule {}