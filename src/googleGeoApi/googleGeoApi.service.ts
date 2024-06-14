import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Client } from '@googlemaps/google-maps-services-js';
import { LoggerService } from '../logger';
import { MILES_IN_KM } from '../utils/constants';
import { GeoPointType } from '../utils/general.dto';
import {
  Status,
  TravelMode,
  UnitSystem,
} from '@googlemaps/google-maps-services-js';

@Injectable()
export class GoogleGeoApiService {
  private readonly apiKey?: string;
  private readonly client?: Client;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('google.key');
    this.client = new Client({ axiosInstance: this.httpService.axiosRef });
  }
  /*public async getDistanceByRoads({
    origins,
    destinations,
  }: {
    origins: GeoPointType[];
    destinations: GeoPointType[];
  }): Promise<(number | undefined)[] | undefined> {
    if (origins.length !== destinations.length) {
      this.log.warn('Origins and Destinations does not match');
      return undefined;
    }
    if (!this.apiKey) {
      this.log.warn('No Google maps api key');
      return undefined;
    }
    try {
      const result: (number | undefined)[] = [];
      const response = await this.client?.distancematrix({
        params: {
          key: this.apiKey,
          origins,
          destinations,
          mode: TravelMode.driving,
          units: UnitSystem.imperial,
        },
      });
      if (response?.status === 200 && response.data.status === Status.OK) {
        response.data.rows.forEach(
          (row, index) =>
            (result[index] =
              row.elements[0].status === Status.OK
                ? (row.elements[0].distance.value * MILES_IN_KM) / 1000
                : undefined),
        );
      }
      return result;
    } catch (e) {
      if (e instanceof Error) {
        this.log.info(`Unable to calculate: ${e.message}`);
      } else {
        this.log.info(`Unable to calculate: ${JSON.stringify(e)}`);
      }
      return undefined;
    }
  }*/
  public async getDistance(
    source?: GeoPointType,
    dest?: GeoPointType,
  ): Promise<number | undefined> {
    this.log.info(
      `Calculating distance: ${JSON.stringify(source)} -> ${JSON.stringify(
        dest,
      )}`,
    );
    if (!source || !dest || !this.apiKey) {
      this.log.info(
        `Unable to calculate ${!this.apiKey ? 'API Key not provided' : ''}`,
      );
      return undefined;
    }
    try {
      const response = await this.client?.distancematrix({
        params: {
          key: this.apiKey,
          origins: [source],
          destinations: [dest],
          mode: TravelMode.driving,
          units: UnitSystem.imperial,
        },
      });
      this.log.silly(
        `Response [${response?.status}]: ${JSON.stringify(response?.data)}`,
      );

      if (
        response?.status === 200 &&
        response.data.status === Status.OK &&
        response.data.rows[0].elements[0].status === Status.OK
      ) {
        const distance =
          (response.data.rows[0].elements[0].distance.value * MILES_IN_KM) /
          1000;
        this.log.info(`Calculated distance: ${distance}`);
        return distance;
      }
      this.log.info(
        `Unable to calculate: ${response?.status}, ${response?.data?.status}, ${
          response?.data?.rows &&
          response?.data?.rows[0]?.elements &&
          response?.data?.rows[0]?.elements[0]?.status
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
