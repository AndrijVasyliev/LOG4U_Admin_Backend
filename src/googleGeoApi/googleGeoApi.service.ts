import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../logger/logger.service';
import { MILES_IN_KM } from '../utils/constants';

@Injectable()
export class GoogleGeoApiService {
  private readonly matrixUri?: string;
  private readonly apiKey?: string;
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.matrixUri = this.configService.get<string>(
      'google.distanceMatrixBaseUri',
    );
    this.apiKey = this.configService.get<string>('google.key');
  }
  public async getDistance(
    source?: [number, number],
    dest?: [number, number],
  ): Promise<number | undefined> {
    this.log.info(
      `Calculating distance: ${JSON.stringify(source)} -> ${JSON.stringify(
        dest,
      )}`,
    );
    if (!source || !dest || !this.matrixUri || !this.apiKey) {
      this.log.info(
        `Unable to calculate ${!this.matrixUri ? 'API URI not provided' : ''} ${
          !this.apiKey ? 'API Key not provided' : ''
        }`,
      );
      return undefined;
    }
    const url = new URL(this.matrixUri);
    url.searchParams.append('origins', `${source.join(',')}`);
    url.searchParams.append('destinations', `${dest.join(',')}`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('units', 'imperial');
    this.log.silly(`Request: ${url.toString()}`);
    try {
      const res = await this.httpService.axiosRef.get(url.toString());
      this.log.silly(`Response [${res.status}]: ${JSON.stringify(res.data)}`);

      if (
        res.status === 200 &&
        res.data.status === 'OK' &&
        res.data.rows[0].elements[0].status === 'OK'
      ) {
        const distance =
          (res.data.rows[0].elements[0].distance.value * MILES_IN_KM) / 1000;
        this.log.info(`Calculated distance: ${distance}`);
        return distance;
      }
      this.log.info(
        `Unable to calculate: ${res?.status}, ${res?.data?.status}, ${
          res?.data?.rows &&
          res?.data?.rows[0]?.elements &&
          res?.data?.rows[0]?.elements[0]?.status
        }`,
      );
      return undefined;
    } catch (e) {
      if (e instanceof Error) {
        this.log.info(`Unable to calculate: ${e.message}`);
      } else {
        this.log.info(`Unable to calculate: ${JSON.stringify(e)}`);
      }
      return undefined;
    }
  }
}
