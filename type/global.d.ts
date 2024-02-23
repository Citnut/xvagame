declare class Manager {
  public items: any[];

  constructor(items?: any[]);

  getLength(): number;

  top(): any;

  bottom(): any;

  clear(): void;

  find(query: Record<string, string>, options?: { returnIndex?: boolean }): any;

  add(item: any, findQuery?: Record<string, string>): any;

  delete(queryObject: Record<string, string>): void;
}

declare class GameManager extends Manager {
  public games: Record<string, InstanceType<typeof GameSchema>>;

  constructor(games?: Record<string, InstanceType<typeof GameSchema>>);

  import(games: InstanceType<typeof GameSchema>, clear?: boolean): void;

  run(name: string, gameOptions: any): void;

  clean(threadID: string): Promise<void> | void;

  findGameByName(name: string): InstanceType<typeof GameSchema>;

  isValid(name: string): boolean;

  isPlaying(threadID: string): boolean;

  playing(threadID: string): any;

  getList(): string[];
}

declare class State {
  public items: any[];
  public index: number;

  constructor(states?: any[]);

  next(): any;

  previous(): any;

  getCurrent(): any;

  reset(): void;

  end(): void;

  is(item: any): boolean;

  isEnd(): boolean;
}

declare class GameSchema {
  id: string;
  name: string;
  masterID: string;
  threadID: string;
  param: string;
  isGroup: boolean;
  participants: string[];
  send: (message: string, threadID: string) => void;
  getLang: () => void | string;

  constructor(options: {
    name?: string;
    masterID: string;
    threadID: string;
    param?: string;
    isGroup?: boolean;
    participants?: string[];
    send: (message: string, threadID: string) => void;
    getLang: () => void | string;
  });

  onMessage(): Promise<void> | void;

  clean(): Promise<void> | void;

  addParticipant(id: string, duplicateCheck?: boolean): boolean;
}

declare const gameClass = {
  Manager,
  GameManager,
  State,
  GameSchema
}
declare global {
  namespace NodeJS {
    interface Global {
      mainPath: string;
      corePath: string;
      cachePath: string;
      assetsPath: string;
    }
  }
}