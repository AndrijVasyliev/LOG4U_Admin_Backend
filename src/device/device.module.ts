import { Module } from '@nestjs/common';
import { NetSocketService } from './netSocket.service';

@Module({
  imports: [
    /*MongooseModule.forFeature(
      [{ name: Driver.name, schema: DriverSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,*/
  ],
  exports: [NetSocketService],
  controllers: [],
  providers: [NetSocketService],
})
export class DeviceModule {}
