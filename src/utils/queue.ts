import { ObjectId } from 'mongoose';
import { runWithId } from 'cls-rtracer';
import { LoggerService } from '../logger';

export type ChangeDocument = {
  _id: { data: string };
  documentKey: { _id: ObjectId };
};

class TimeoutError extends Error {}

export class Queue<T> {
  private readonly log: LoggerService;
  private readonly getNext: () => Promise<T>;
  private readonly process: (data: T) => Promise<void>;
  private readonly maxParalel: number;
  private readonly jobTimeout: number;
  private currentParalel: number = 0;
  private isStopCalled: boolean = false;
  private isAwaitingNewData: boolean = false;
  private resolveOnAllStopped: (value: void | PromiseLike<void>) => void;
  constructor(
    getNextData: () => Promise<T>,
    processData: (data: T) => Promise<void>,
    maxParalel: number,
    jobTimeout: number,
    logger: LoggerService,
  ) {
    this.getNext = getNextData;
    this.process = processData;
    this.maxParalel = maxParalel;
    this.jobTimeout = jobTimeout;
    this.log = logger;
    this.startNew();
  }

  private async startNew(): Promise<void> {
    this.log.debug('In start new task');
    if (this.isStopCalled) {
      this.log.debug('Can not start, stopping');
      return;
    }
    if (this.isAwaitingNewData) {
      this.log.debug('Can not start, awaiting');
      return;
    }

    let newData: T;
    try {
      this.isAwaitingNewData = true;
      newData = await this.getNext();
      this.log.debug('New data received');
      this.isAwaitingNewData = false;
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(error);
      } else {
        this.log.error(JSON.stringify(error));
      }
      await this.stop();
      process.emit('SIGTERM');
      return;
    }

    try {
      this.currentParalel++;
      runWithId(this.processData.bind(this, newData)).finally(() => {
        if (this.isStopCalled && this.currentParalel === 0) {
          this.log.debug('Task queue is empty');
          this.resolveOnAllStopped();
        }
        if (!this.isStopCalled) {
          this.startNew();
        }
      });
      if (this.currentParalel < this.maxParalel) {
        this.log.debug('Pool not full yet, starting another');
        this.startNew();
      }
    } catch (error) {
      this.log.error('Error in queue', error);
    }
    return;
  }
  private async processData(nextData: any): Promise<void> {
    await Promise.race([
      this.process(nextData),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new TimeoutError(
                `Executer running more then ${this.jobTimeout} ms`,
              ),
            ),
          this.jobTimeout,
        ),
      ),
    ]).finally((result?: TimeoutError) => {
      if (result instanceof TimeoutError) {
        this.log.warn('Timeout');
      } else if (result) {
        this.log.warn('Result: ', result);
      }
      this.currentParalel--;
      this.log.debug('Job is done');
    });
  }
  public async stop(): Promise<void> {
    this.log.debug('Stop is called');
    this.isStopCalled = true;
    return new Promise((resolve) => {
      if (this.currentParalel === 0) {
        this.log.debug('Task queue is empty');
        return resolve();
      }
      this.resolveOnAllStopped = resolve;
    });
  }
}
