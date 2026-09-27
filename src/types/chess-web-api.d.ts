declare module 'chess-web-api' {
  interface ChessWebAPIOptions {
    queue?: boolean;
  }

  interface APIResponse<T = any> {
    body: T;
    headers: {
      etag?: string;
      [key: string]: string | undefined;
    };
  }

  interface GameData {
    pgn?: string;
    url?: string;
    [key: string]: any;
  }

  class ChessWebAPI {
    constructor(options?: ChessWebAPIOptions);
    
    getGameByID(id: string | number, options?: object): Promise<APIResponse<GameData>>;
    getPlayer(username: string, options?: object): Promise<APIResponse>;
    getPlayerStats(username: string, options?: object): Promise<APIResponse>;
    getPlayerCurrentDailyChess(username: string, options?: object): Promise<APIResponse>;
    getPlayerMonthlyArchives(username: string, options?: object): Promise<APIResponse>;
    getPlayerCompleteMonthlyArchives(
      username: string, 
      year: string | number, 
      month: string | number, 
      options?: object
    ): Promise<APIResponse>;
    
    dispatch(
      method: Function,
      callback: Function,
      parameters: any[],
      options?: object,
      callbackParameters?: any[],
      priority?: number
    ): void;
    
    clearQueue(): void;
    
    ifChanged(
      etag: string,
      method: Function,
      parameters: any[],
      options?: object,
      callback?: Function
    ): Promise<{ changed: boolean; response?: APIResponse }>;
  }

  export = ChessWebAPI;
}
