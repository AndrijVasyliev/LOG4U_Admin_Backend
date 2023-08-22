import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('main')
  // @Public()
  getRoot(): string {
    return this.appService.getRoot();
  }
}
