import { EARTH_RADIUS_MILES } from './constants';
import { GeoPointType } from './general.dto';

const toRadians = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const calcDistance = (
  point1: GeoPointType,
  point2: GeoPointType,
): number => {
  const dLat = toRadians(point2[0] - point1[0]);
  const dLon = toRadians(point2[1] - point1[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1[0])) *
      Math.cos(toRadians(point2[0])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
};
