import { Chess, ChessInstance, Move } from 'chess.js';
import { logger } from './util';
import dayjs from 'dayjs';

export type SerializedGame = {
  name: string;
  site: string;
  white: SerializedPlayer;
  black: SerializedPlayer;
  fen: string;
  opening: string;
  tablebase: string;
  stm: 'w' | 'b';
  moveNumber: number;
};

export type SerializedPlayer = {
  name: string;
  depth: number;
  score: number;
  nodes: number;
  usedTime: number;
  clockTime: number;
  startTime: number;
  lastMove: Move | null;
  pvAlg: string;
  pv: Array<string>;
  pvFen: string;
  pvMoveNumber: number;
};

export type LichessResponse = {
  opening: { eco: string; name: string } | null;
  category: string | null;
};

export class ChessGame {
  private _name: string;
  private _site: string;
  private _white: Player;
  private _black: Player;
  private _instance: ChessInstance;
  private _loaded: boolean;
  private _fen: string;
  private _opening: string;
  private _tablebase: string;
  private _moveNumber: number;

  constructor(name: string) {
    this._name = name;
    this._site = '';
    this._white = new Player();
    this._black = new Player();

    this._instance = new Chess();
    this._loaded = false;

    this._fen = this._instance.fen();
    this._opening = 'Unknown';
    this._tablebase = '';
    this._moveNumber = 1;

    this.setPGNHeaders();
  }

  private setPGNHeaders(): void {
    this._instance.header('Site', this._site);
    this._instance.header('Date', dayjs().format('YYYY.MM.DD'));
    this._instance.header('White', this._white.name);
    this._instance.header('Black', this._black.name);
  }

  reset(): void {
    this._instance = new Chess();
    this._loaded = true;

    this._fen = this._instance.fen();
    this._opening = 'Unknown';

    this.setPGNHeaders();
  }

  resetFromFen(): void {
    const { valid, ...err } = this._instance.validate_fen(this._fen);

    if (valid) {
      logger.info(`Setting fen for game ${this._name} to ${this._fen}`);
      this._loaded = this._instance.load(this._fen);
      this.setPGNHeaders();
    } else {
      logger.error(`Unable to load fen ${this._fen} for game ${this._name}`);
      logger.error(err.error);
    }
  }

  async setOpening(): Promise<void> {
    const history = this._instance.history({ verbose: true });
    if (!history.length) return;

    const moves = history.map((move) => `${move.from}${move.to}`).join(',');
    const url = `https://explorer.lichess.ovh/master?play=${moves}`;

    logger.info(`Requesting opening for game ${this._name} from ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data: LichessResponse = await response.json();

      logger.info(`Received response for game ${this._name}: ${JSON.stringify(data)}`);

      const { opening } = data;

      if (opening) {
        const { eco, name } = opening;

        logger.info(`Setting opening for game ${this._name} to ${eco} ${name}`);
        this._opening = `${eco} ${name}`;
      }
    } catch {
<<<<<<< HEAD
      logger.warn(`Error requesting opening for game ${this._name} @ ${url}`);
=======
      logger.warn(`Error requesting opening for game ${this._name} @ ${url}`)
>>>>>>> b9fd4c2 (Proper async for API requests)
    }
  }

  setTablebase(): void {
    let pieceCount = 0;

    const board = this._instance.board();

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] != null) {
          pieceCount++;
        }
      }
    }

    if (pieceCount > 7) {
      this._tablebase = '';
      return;
    }

    const url = `https://tablebase.lichess.ovh/standard?fen=${this._fen}`;

    logger.info(`Requesting tablebase for game ${this._name} from ${url}`);

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response: Response) => response.json())
      .then((data: LichessResponse) => {
        logger.info(`Received response for game ${this._name}: ${JSON.stringify(data)}`);

        const { category } = data;

        if (!category) {
          logger.info(`Setting tablebase for game ${this._name} to blank`);
          this._tablebase = '';
        } else {
          switch (category) {
            case 'win':
            case 'maybe-win':
              this._tablebase = this._instance.turn() === 'w' ? 'White Win' : 'Black Win';
              break;
            case 'cursed-win':
            case 'draw':
            case 'cursed-loss':
              this._tablebase = 'Draw';
              break;
            case 'loss':
            case 'maybe-loss':
              this._tablebase = this._instance.turn() === 'w' ? 'Black Win' : 'White Win';
              break;
            default:
              logger.warn(`Unknown tablebase category ${category} for game ${this._name}, setting tablebase to blank`);
              this._tablebase = '';
          }
          logger.info(`Set tablebase for game ${this._name} to ${this._tablebase}`);
        }
      })
      .catch((err: Error) => {
        logger.error(`Error requesting tablebase for game ${this._name}, setting tablebase to blank`);
        this._tablebase = '';
      });
  }

  toJSON(): SerializedGame {
    return {
      name: this._name,
      site: this._site,
      white: this._white.toJSON(),
      black: this._black.toJSON(),
      fen: this._instance.fen(),
      opening: this._opening,
      tablebase: this._tablebase,
      stm: this._instance.turn(),
      moveNumber: this._moveNumber,
    };
  }

  public get name(): string {
    return this._name;
  }

  public get site(): string {
    return this._site;
  }

  public set site(v: string) {
    this._site = v;
  }

  public get white(): Player {
    return this._white;
  }

  public get black(): Player {
    return this._black;
  }

  public get instance(): ChessInstance {
    return this._instance;
  }

  public get loaded(): boolean {
    return this._loaded;
  }

  public get fen(): string {
    return this._fen;
  }

  public set fen(v: string) {
    this._fen = v;
  }

  public get opening(): string {
    return this._opening;
  }

  public get moveNumber(): number {
    return this._moveNumber;
  }

  public set moveNumber(v: number) {
    this._moveNumber = v;
  }
}

export class Player {
  private _name: string;
  private _depth: number;
  private _score: number;
  private _nodes: number;
  private _usedTime: number;
  private _clockTime: number;
  private _startTime: number;
  private _lastMove: Move | null;
  private _pv: Array<string>; // san representation
  private _pvFen: string;
  private _pvMoveNumber: number;
  private _pvAlg: string;

  constructor() {
    this._name = 'Unknown';
    this._depth = 0;
    this._score = 0.0;
    this._nodes = 0;
    this._usedTime = 0;
    this._clockTime = 0;
    this._startTime = 0;
    this._lastMove = null;
    this._pv = new Array<string>();
    this._pvFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    this._pvMoveNumber = 0;
    this._pvAlg = '';
  }

  reset(): void {
    this._name = 'Unknown';
    this._depth = 0;
    this._score = 0.0;
    this._nodes = 0;
    this._usedTime = 0;
    this._clockTime = 0;
    this._startTime = 0;
    this._lastMove = null;
    this._pv = new Array<string>();
    this._pvMoveNumber = 0;
    this._pvAlg = '';
  }

  toJSON(): SerializedPlayer {
    return {
      name: this._name,
      depth: this._depth,
      score: this._score,
      nodes: this._nodes,
      usedTime: this._usedTime,
      clockTime: this._clockTime,
      startTime: this._startTime,
      lastMove: this._lastMove,
      pv: this._pv,
      pvFen: this._pvFen,
      pvMoveNumber: this._pvMoveNumber,
      pvAlg: this._pvAlg,
    };
  }

  public get name(): string {
    return this._name;
  }

  public set name(v: string) {
    this._name = v;
  }

  public get depth(): number {
    return this._depth;
  }

  public set depth(v: number) {
    this._depth = v;
  }

  public get score(): number {
    return this._score;
  }

  public set score(v: number) {
    this._score = v;
  }

  public get nodes(): number {
    return this._nodes;
  }

  public set nodes(v: number) {
    this._nodes = v;
  }

  public get usedTime(): number {
    return this._usedTime;
  }

  public set usedTime(v: number) {
    this._usedTime = v;
  }

  public get clockTime(): number {
    return this._clockTime;
  }

  public set clockTime(v: number) {
    this._clockTime = v;
  }

  public get startTime(): number {
    return this._startTime;
  }

  public set startTime(v: number) {
    this._startTime = v;
  }

  public get lastMove(): Move | null {
    return this._lastMove;
  }

  public set lastMove(v: Move | null) {
    this._lastMove = v;
  }

  public get pv(): Array<string> {
    return this._pv;
  }

  public set pv(v: Array<string>) {
    this._pv = v;
  }

  public set pvFen(fen: string) {
    this._pvFen = fen;
  }

  public get pvFen(): string {
    return this._pvFen;
  }

  public set pvAlg(move: string) {
    this._pvAlg = move;
  }

  public get pvAlg(): string {
    return this._pvAlg;
  }

  public get pvMoveNumber(): number {
    return this._pvMoveNumber;
  }

  public set pvMoveNumber(v: number) {
    this._pvMoveNumber = v;
  }
}
