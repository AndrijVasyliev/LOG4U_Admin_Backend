import { UpdateTruckDto } from '../truck/truck.dto';
import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  PreconditionFailedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PersonService } from '../person/person.service';
import { DriverService } from '../driver/driver.service';
import { LoggerService } from '../logger';

export const TransformToUpdateDto = <
  T extends {
    deviceId: string;
    location: { coords: { latitude: number; longitude: number } };
  },
>(
  initialBody: T,
): UpdateTruckDto => {
  return {
    lastLocation: [
      initialBody.location.coords.latitude,
      initialBody.location.coords.longitude,
    ],
  };
};

@Injectable()
export class GetTruckId
  implements PipeTransform<string, Promise<Types.ObjectId>>
{
  constructor(
    private readonly log: LoggerService,
    private readonly personService: PersonService,
    private readonly driverService: DriverService,
  ) {}

  async transform(
    deviceId: string,
    metadata: ArgumentMetadata,
  ): Promise<Types.ObjectId> {
    if (metadata.type !== 'body') {
      return deviceId as unknown as Types.ObjectId;
    }

    this.log.debug(`Searching truck by deviceId ${deviceId}`);

    const person = await this.personService.getPersonByDeviceId(deviceId);
    if (!person) {
      throw new PreconditionFailedException(
        `Driver with deviceId ${deviceId} does not found`,
      );
    }
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }

    const truckId = new Types.ObjectId(driver.driveTrucks[0].id);

    this.log.debug(`Found truck ${truckId} by deviceId ${deviceId}`);

    return truckId;
  }
}
