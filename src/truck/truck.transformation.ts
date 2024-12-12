import { CreateTruckDto, UpdateTruckDto } from './truck.dto';

const SetUpdatedByFactory =
  (locationUpdatedBy: string) =>
  <T extends CreateTruckDto | UpdateTruckDto>(initialBody: T): T => {
    if (initialBody.lastLocation) {
      return {
        ...initialBody,
        locationUpdatedBy: locationUpdatedBy,
      };
    }
    return initialBody;
  };

export const SetUpdatedByToAdmin = SetUpdatedByFactory('Manually from admin');
export const SetUpdatedByToApp = SetUpdatedByFactory('Manually from app');
export const SetUpdatedByToTracking = SetUpdatedByFactory('Tracking app');
