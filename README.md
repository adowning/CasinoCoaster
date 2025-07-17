generator client {
  provider = "prisma-client-js"
  output = "../client"
}

generator json_types {
  provider = "prisma-json-types-generator"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator typescriptInterfaces {
  provider = "prisma-generator-typescript-interfaces"
}
// -----------------------------------------------------------------------------
// User and Authentication Models
// -----------------------------------------------------------------------------
model User {
  id                String       @id @default(cuid())
  username          String?
  avatar            String?
  rank              String       @default("user")
  balance           Float        @default(0)
  xp                Float        @default(0)
  anonymous         Boolean      @default(false)
  proxy             String?
  /// [IpInfo[]]
  ips               Json[]
  verifiedAt        DateTime?
  updatedAt         DateTime     @updatedAt
  createdAt         DateTime     @default(now())
  /// [UserLocal]
  local             Json?
  /// [UserRoblox]
  roblox            Json?
  /// [UserGoogle]
  google            Json?
  /// [UserDiscord]
  discord           Json?
  /// [UserVault]
  vault             Json         @default("{}")
  /// [UserStats]
  stats             Json         @default("{\"bet\":0,\"won\":0,\"deposit\":0,\"withdraw\":0}")
  /// [UserSlots]
  slots             Json         @default("{\"mascot\":false}")
  /// [UserLeaderboard]
  leaderboard       Json         @default("{\"points\":0}")
  /// [UserLimits]
  limits            Json         @default("{\"betToWithdraw\":0,\"betToRain\":0,\"blockAffiliate\":false,\"blockRain\":false,\"blockTip\":false,\"limitTip\":0,\"blockSponsor\":false,\"blockLeaderboard\":false}")
  /// [UserRakeback]
  rakeback          Json         @default("{\"earned\":0,\"available\":0}")
  /// [UserAffiliates]
  affiliates        Json         @default("{}")
  /// [UserFair]
  fair              Json         @default("{}")
  /// [UserMute]
  mute              Json?
  /// [UserBan]
  ban               Json?
  // Relations
  tokens            Token[]
  promoCodes        PromoCodeRedeemer[]
  rainParticipation RainParticipant[]
  tipSent           TipTransaction[]    @relation("TipSender")
  tipReceived       TipTransaction[]    @relation("TipReceiver")
  cryptoAddresses   CryptoAddress[]
  userSeeds         UserSeed[]
  crashBets         CrashBet[]
  rollBets          RollBet[]
  blackjackBets     BlackjackBet[]
  duelsBets         DuelsBet[]
  combatLegendBets  CombatLegendBet[]
  minesGames        MinesGame[]
  towersGames       TowersGame[]
  unboxGames        UnboxGame[]
  upgraderGames     UpgraderGame[]
  battlesBets       BattlesBet[]
  slotsUsers        SlotsUser[]
  inventories       UserInventory[]
  inGameLinks       InGameModeLinks[]

  @@map("users")
}

model Token {
  id        String   @id @default(cuid())
  token     String
  type      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("tokens")
}

// -----------------------------------------------------------------------------
// Game Models
// -----------------------------------------------------------------------------
model CrashSeed {
  id         String      @id @default(cuid())
  seedServer String
  hash       String
  seedPublic String?
  chain      String?
  state      String
  createdAt  DateTime    @default(now())
  games      CrashGame[]

  @@map("crash_seeds")
}

model CrashGame {
  id        String     @id @default(cuid())
  outcome   Float?
  state     String
  seedId    String
  seed      CrashSeed  @relation(fields: [seedId], references: [id])
  updatedAt DateTime   @updatedAt
  createdAt DateTime   @default(now())
  bets      CrashBet[]

  @@map("crash_games")
}

model CrashBet {
  id          String    @id @default(cuid())
  amount      Float
  payout      Float?
  multiplier  Float?
  autoCashout Float?
  gameId      String
  userId      String
  game        CrashGame @relation(fields: [gameId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  updatedAt   DateTime  @updatedAt
  createdAt   DateTime  @default(now())

  @@map("crash_bets")
}

model RollSeed {
  id         String     @id @default(cuid())
  seedServer String
  hash       String
  seedPublic String?
  chain      String?
  state      String
  createdAt  DateTime   @default(now())
  games      RollGame[]

  @@map("roll_seeds")
}

model RollGame {
  id        String    @id @default(cuid())
  outcome   Float?
  state     String
  seedId    String
  seed      RollSeed  @relation(fields: [seedId], references: [id])
  updatedAt DateTime  @updatedAt
  createdAt DateTime  @default(now())
  bets      RollBet[]

  @@map("roll_games")
}

model RollBet {
  id         String   @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  gameId     String
  userId     String
  game       RollGame @relation(fields: [gameId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("roll_bets")
}

model BlackjackGame {
  id          String   @id @default(cuid())
  /// [Card[]]
  deck        Json
  /// [Card[]]
  dealerCards Json
  /// [GameFair]
  fair        Json
  table       Int
  type        String
  state       String
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
  bets        BlackjackBet[]

  @@map("blackjack_games")
}

model BlackjackBet {
  id              String   @id @default(cuid())
  /// [BlackjackBetAmount]
  amount          Json
  payout          Float?
  multiplier      Float?
  /// [Card[]]
  cards           Json
  /// [Card[]]
  cardsLeft       Json?
  /// [Card[]]
  cardsRight      Json?
  actions         String[]
  seat            Int
  gameId          String
  userId          String
  game            BlackjackGame @relation(fields: [gameId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  updatedAt       DateTime      @updatedAt
  createdAt       DateTime      @default(now())

  @@map("blackjack_bets")
}

model DuelsGame {
  id          String     @id @default(cuid())
  amount      Float
  playerCount Int
  winnerId    String? @unique
  /// [GameFair]
  fair        Json
  state       String
  updatedAt   DateTime   @updatedAt
  createdAt   DateTime   @default(now())
  winner      DuelsBet?  @relation("DuelsWinner", fields: [winnerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  bets        DuelsBet[]

  @@map("duels_games")
}

model DuelsBet {
  id         String     @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  roll       Float?
  gameId     String
  userId     String
  bot        Boolean
  game       DuelsGame  @relation(fields: [gameId], references: [id])
  user       User       @relation(fields: [userId], references: [id])
  updatedAt  DateTime   @updatedAt
  createdAt  DateTime   @default(now())
  gameWon    DuelsGame? @relation("DuelsWinner")

  @@map("duels_bets")
}

model CombatLegendGame {
  id                 String            @id @default(cuid())
  amount             Float
  playerCount        Int
  winnerId           String? @unique
  /// [GameFair]
  fair               Json
  roblox_server_link String?
  robloxStartTime    Json?
  server_created     Boolean?
  state              String
  updatedAt          DateTime          @updatedAt
  createdAt          DateTime          @default(now())
  winner             CombatLegendBet?  @relation("CombatLegendWinner", fields: [winnerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  bets               CombatLegendBet[]

  @@map("combat_legend_games")
}

model CombatLegendBet {
  id         String            @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  roll       Float?
  gameId     String
  userId     String
  bot        Boolean
  game       CombatLegendGame  @relation(fields: [gameId], references: [id])
  user       User              @relation(fields: [userId], references: [id])
  updatedAt  DateTime          @updatedAt
  createdAt  DateTime          @default(now())
  gameWon    CombatLegendGame? @relation("CombatLegendWinner")

  @@map("combat_legend_bets")
}

model MinesGame {
  id         String   @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  minesCount Int
   /// [Card[]]
  deck       String[]
  /// [MinesRevealedTile[]]
  revealed   Json
  /// [SeedInfo]
  fair       Json
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("mines_games")
}

model TowersGame {
  id         String   @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  risk       String
    deck       Json     // Corrected from String[][] to Json
  /// [TowersRevealedTile[]]
  revealed   Json
  /// [SeedInfo]
  fair       Json
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("towers_games")
}

model UnboxGame {
  id         String   @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  outcome    Float?
  boxId      String
  box        Box      @relation(fields: [boxId], references: [id])
  /// [SeedInfo]
  fair       Json
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("unbox_games")
}

model BattlesGame {
  id          String   @id @default(cuid())
  amount      Float
  playerCount Int
  mode        String
  /// [BoxItemRelation[]]
  boxes       Json
  /// [BattlesGameOptions]
  options     Json
  /// [GameFair]
  fair        Json
  state       String
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
  bets        BattlesBet[]

  @@map("battles_games")
}

model BattlesBet {
  id         String      @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  outcomes   Int[]
  slot       Int
  gameId     String
  game       BattlesGame @relation(fields: [gameId], references: [id])
  userId     String? // userId is optional because of bots
  user       User?       @relation(fields: [userId], references: [id])
  bot        Boolean
  updatedAt  DateTime    @updatedAt
  createdAt  DateTime    @default(now())

  @@map("battles_bets")
}

model UpgraderGame {
  id         String   @id @default(cuid())
  amount     Float
  payout     Float?
  multiplier Float?
  mode       String
  outcome    Float?
  /// [SeedInfo]
  fair       Json
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("upgrader_games")
}

model UserSeed {
  id         String   @id @default(cuid())
  seedClient String?
  seedServer String
  hash       String
  nonce      Int
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("user_seeds")
}

// -----------------------------------------------------------------------------
// Content and Item Models
// -----------------------------------------------------------------------------
model Box {
  id         String   @id @default(cuid())
  name       String
  slug       String
  amount     Float
  levelMin   Int
  /// [BoxItemContent[]]
  items      Json
  categories String[]
  type       String
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())
  unboxGames UnboxGame[]

  @@map("boxes")
}

model LimitedItem {
  id          String   @id @default(cuid())
  assetId     String
  name        String
  image       String
  amount      Float
  amountFixed Float?
  accepted    Boolean?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@map("limited_items")
}

model FilterPhrase {
  id        String   @id @default(cuid())
  phrase    String
  createdAt DateTime @default(now())

  @@map("filter_phrases")
}

// -----------------------------------------------------------------------------
// Transaction and Financial Models
// -----------------------------------------------------------------------------
model BalanceTransaction {
  id        String   @id @default(cuid())
  amount    Float
  type      String
  userId    String
  state     String
  createdAt DateTime @default(now())

  @@map("balance_transactions")
}

model TipTransaction {
  id         String   @id @default(cuid())
  amount     Float
  senderId   String
  receiverId String
  state      String
  sender     User     @relation("TipSender", fields: [senderId], references: [id])
  receiver   User     @relation("TipReceiver", fields: [receiverId], references: [id])
  createdAt  DateTime @default(now())

  @@map("tip_transactions")
}

model CryptoAddress {
  id        String   @id @default(cuid())
  name      String
  address   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@map("crypto_addresses")
}

model CryptoPrice {
  id    String @id @default(cuid())
  name  String
  price Float
  fee   Float

  @@map("crypto_prices")
}

model CryptoTransaction {
  id        String   @id @default(cuid())
  amount    Float
  /// [CryptoTransactionData]
  data      Json
  type      String
  userId    String
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("crypto_transactions")
}

model RobuxOffer {
  id              String   @id @default(cuid())
  amount          Float
  amountProcessed Float    @default(0)
  type            String
  userId          String
  state           String
  updatedAt       DateTime @updatedAt
  createdAt       DateTime @default(now())

  @@map("robux_offers")
}

model RobuxTransaction {
  id         String   @id @default(cuid())
  amount     Float
  /// [RobuxTransactionData]
  data       Json
  /// [TransactionUserOffer]
  deposit    Json?
  /// [TransactionUserOffer]
  withdraw   Json?
  state      String
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())

  @@map("robux_transactions")
}

model LimitedTransaction {
  id        String   @id @default(cuid())
  amount    Float
  /// [LimitedTransactionData]
  data      Json
  /// [LimitedTransactionItems]
  deposit   Json?
  /// [LimitedTransactionItems]
  withdraw  Json?
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("limited_transactions")
}

model SteamTransaction {
  id        String   @id @default(cuid())
  amount    Float
  /// [SteamTransactionData]
  data      Json
  type      String
  userId    String
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("steam_transactions")
}

model GiftTransaction {
  id        String   @id @default(cuid())
  amount    Float
  /// [GiftTransactionData]
  data      Json
  type      String
  userId    String
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("gift_transactions")
}

model CreditTransaction {
  id        String   @id @default(cuid())
  amount    Float
  /// [CreditTransactionData]
  data      Json
  type      String
  userId    String
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("credit_transactions")
}

// -----------------------------------------------------------------------------
// Site Feature Models
// -----------------------------------------------------------------------------
model Setting {
  id      String @id @default(cuid())
  /// [GeneralSettings]
  general Json
  /// [ChatSettings]
  chat    Json
  /// [GameSettings]
  games   Json
  /// [PaymentSettings]
  robux   Json
  /// [PaymentSettings]
  limited Json
  /// [PaymentSettings]
  steam   Json
  /// [PaymentSettings]
  crypto  Json
  /// [PaymentSettings]
  gift    Json
  /// [PaymentSettings]
  credit  Json

  @@map("settings")
}

model Leaderboard {
  id        String              @id @default(cuid())
  duration  Int
  type      String
  state     String
  updatedAt DateTime            @updatedAt
  createdAt DateTime            @default(now())
  winners   LeaderboardWinner[]

  @@map("leaderboards")
}

model LeaderboardWinner {
  id            String      @id @default(cuid())
  prize         Float
  points        Float
  userId        String
  leaderboardId String
  leaderboard   Leaderboard @relation(fields: [leaderboardId], references: [id])
  // No direct relation to User needed as per original schema, only userId is stored.

  @@map("leaderboard_winners")
}

model Rain {
  id           String            @id @default(cuid())
  amount       Float
  creatorId    String?
  type         String
  state        String
  updatedAt    DateTime          @updatedAt
  createdAt    DateTime          @default(now())
  participants RainParticipant[]

  @@map("rains")
}

model RainParticipant {
  id     String @id @default(cuid())
  rainId String
  userId String
  rain   Rain   @relation(fields: [rainId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@map("rain_participants")
}

model PromoCode {
  id                String              @id @default(cuid())
  code              String
  reward            Float
  levelMin          Int
  redeemptionsTotal Int                 @default(0)
  redeemptionsMax   Int
  updatedAt         DateTime            @updatedAt
  createdAt         DateTime            @default(now())
  redeemers         PromoCodeRedeemer[]

  @@map("promo_codes")
}

model PromoCodeRedeemer {
  id          String    @id @default(cuid())
  promoCodeId String
  userId      String
  promoCode   PromoCode @relation(fields: [promoCodeId], references: [id])
  user        User      @relation(fields: [userId], references: [id])

  @@map("promo_code_redeemers")
}

model GiftCode {
  id         String   @id @default(cuid())
  code       String
  reward     Float
  redeemerId String?  @unique
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())
  // No direct relation to User needed, redeemer is stored by ID.

  @@map("gift_codes")
}

model Report {
  id      String   @id @default(cuid())
  /// [ReportStats]
  stats   Json
  createdAt DateTime @default(now())

  @@map("reports")
}

model SlotsUser {
  id        String   @id @default(cuid())
  id_legacy String   @map("Id")
  nick      String   @map("Nick")
  amount    Float
  /// [SlotsUserData]
  data      Json
  type      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  state     String
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("slots_users")
}

model UserInventory {
  id     String @id @default(cuid())
  /// [UserInventoryItem[]]
  items  Json
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  @@map("user_inventories")
}

model InGameModeLinks {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
  /// [InGameLinksData]
  links  Json
  /// [InGameLinksData]
  uid    Json

  @@map("in_game_mode_links")
}
// This file was auto-generated by prisma-generator-typescript-interfaces

export interface User {
  id: string;
  username: string | null;
  avatar: string | null;
  rank: string;
  balance: number;
  xp: number;
  anonymous: boolean;
  proxy: string | null;
  ips: JsonValue[];
  verifiedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  local: JsonValue | null;
  roblox: JsonValue | null;
  google: JsonValue | null;
  discord: JsonValue | null;
  vault: JsonValue;
  stats: JsonValue;
  slots: JsonValue;
  leaderboard: JsonValue;
  limits: JsonValue;
  rakeback: JsonValue;
  affiliates: JsonValue;
  fair: JsonValue;
  mute: JsonValue | null;
  ban: JsonValue | null;
  tokens?: Token[];
  promoCodes?: PromoCodeRedeemer[];
  rainParticipation?: RainParticipant[];
  tipSent?: TipTransaction[];
  tipReceived?: TipTransaction[];
  cryptoAddresses?: CryptoAddress[];
  userSeeds?: UserSeed[];
  crashBets?: CrashBet[];
  rollBets?: RollBet[];
  blackjackBets?: BlackjackBet[];
  duelsBets?: DuelsBet[];
  combatLegendBets?: CombatLegendBet[];
  minesGames?: MinesGame[];
  towersGames?: TowersGame[];
  unboxGames?: UnboxGame[];
  upgraderGames?: UpgraderGame[];
  battlesBets?: BattlesBet[];
  slotsUsers?: SlotsUser[];
  inventories?: UserInventory[];
  inGameLinks?: InGameModeLinks[];
}

export interface Token {
  id: string;
  token: string;
  type: string;
  userId: string;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
}

export interface CrashSeed {
  id: string;
  seedServer: string;
  hash: string;
  seedPublic: string | null;
  chain: string | null;
  state: string;
  createdAt: Date;
  games?: CrashGame[];
}

export interface CrashGame {
  id: string;
  outcome: number | null;
  state: string;
  seedId: string;
  seed?: CrashSeed;
  updatedAt: Date;
  createdAt: Date;
  bets?: CrashBet[];
}

export interface CrashBet {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  autoCashout: number | null;
  gameId: string;
  userId: string;
  game?: CrashGame;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
}

export interface RollSeed {
  id: string;
  seedServer: string;
  hash: string;
  seedPublic: string | null;
  chain: string | null;
  state: string;
  createdAt: Date;
  games?: RollGame[];
}

export interface RollGame {
  id: string;
  outcome: number | null;
  state: string;
  seedId: string;
  seed?: RollSeed;
  updatedAt: Date;
  createdAt: Date;
  bets?: RollBet[];
}

export interface RollBet {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  gameId: string;
  userId: string;
  game?: RollGame;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
}

export interface BlackjackGame {
  id: string;
  deck: JsonValue;
  dealerCards: JsonValue;
  fair: JsonValue;
  table: number;
  type: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  bets?: BlackjackBet[];
}

export interface BlackjackBet {
  id: string;
  amount: JsonValue;
  payout: number | null;
  multiplier: number | null;
  cards: JsonValue;
  cardsLeft: JsonValue | null;
  cardsRight: JsonValue | null;
  actions: string[];
  seat: number;
  gameId: string;
  userId: string;
  game?: BlackjackGame;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
}

export interface DuelsGame {
  id: string;
  amount: number;
  playerCount: number;
  winnerId: string | null;
  fair: JsonValue;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  winner?: DuelsBet | null;
  bets?: DuelsBet[];
}

export interface DuelsBet {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  roll: number | null;
  gameId: string;
  userId: string;
  bot: boolean;
  game?: DuelsGame;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
  gameWon?: DuelsGame | null;
}

export interface CombatLegendGame {
  id: string;
  amount: number;
  playerCount: number;
  winnerId: string | null;
  fair: JsonValue;
  roblox_server_link: string | null;
  robloxStartTime: JsonValue | null;
  server_created: boolean | null;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  winner?: CombatLegendBet | null;
  bets?: CombatLegendBet[];
}

export interface CombatLegendBet {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  roll: number | null;
  gameId: string;
  userId: string;
  bot: boolean;
  game?: CombatLegendGame;
  user?: User;
  updatedAt: Date;
  createdAt: Date;
  gameWon?: CombatLegendGame | null;
}

export interface MinesGame {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  minesCount: number;
  deck: string[];
  revealed: JsonValue;
  fair: JsonValue;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface TowersGame {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  risk: string;
  deck: JsonValue;
  revealed: JsonValue;
  fair: JsonValue;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface UnboxGame {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  outcome: number | null;
  boxId: string;
  box?: Box;
  fair: JsonValue;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface BattlesGame {
  id: string;
  amount: number;
  playerCount: number;
  mode: string;
  boxes: JsonValue;
  options: JsonValue;
  fair: JsonValue;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  bets?: BattlesBet[];
}

export interface BattlesBet {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  outcomes: number[];
  slot: number;
  gameId: string;
  game?: BattlesGame;
  userId: string | null;
  user?: User | null;
  bot: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface UpgraderGame {
  id: string;
  amount: number;
  payout: number | null;
  multiplier: number | null;
  mode: string;
  outcome: number | null;
  fair: JsonValue;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserSeed {
  id: string;
  seedClient: string | null;
  seedServer: string;
  hash: string;
  nonce: number;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface Box {
  id: string;
  name: string;
  slug: string;
  amount: number;
  levelMin: number;
  items: JsonValue;
  categories: string[];
  type: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  unboxGames?: UnboxGame[];
}

export interface LimitedItem {
  id: string;
  assetId: string;
  name: string;
  image: string;
  amount: number;
  amountFixed: number | null;
  accepted: boolean | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface FilterPhrase {
  id: string;
  phrase: string;
  createdAt: Date;
}

export interface BalanceTransaction {
  id: string;
  amount: number;
  type: string;
  userId: string;
  state: string;
  createdAt: Date;
}

export interface TipTransaction {
  id: string;
  amount: number;
  senderId: string;
  receiverId: string;
  state: string;
  sender?: User;
  receiver?: User;
  createdAt: Date;
}

export interface CryptoAddress {
  id: string;
  name: string;
  address: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface CryptoPrice {
  id: string;
  name: string;
  price: number;
  fee: number;
}

export interface CryptoTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  type: string;
  userId: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface RobuxOffer {
  id: string;
  amount: number;
  amountProcessed: number;
  type: string;
  userId: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface RobuxTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  deposit: JsonValue | null;
  withdraw: JsonValue | null;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface LimitedTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  deposit: JsonValue | null;
  withdraw: JsonValue | null;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface SteamTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  type: string;
  userId: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface GiftTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  type: string;
  userId: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  data: JsonValue;
  type: string;
  userId: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface Setting {
  id: string;
  general: JsonValue;
  chat: JsonValue;
  games: JsonValue;
  robux: JsonValue;
  limited: JsonValue;
  steam: JsonValue;
  crypto: JsonValue;
  gift: JsonValue;
  credit: JsonValue;
}

export interface Leaderboard {
  id: string;
  duration: number;
  type: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  winners?: LeaderboardWinner[];
}

export interface LeaderboardWinner {
  id: string;
  prize: number;
  points: number;
  userId: string;
  leaderboardId: string;
  leaderboard?: Leaderboard;
}

export interface Rain {
  id: string;
  amount: number;
  creatorId: string | null;
  type: string;
  state: string;
  updatedAt: Date;
  createdAt: Date;
  participants?: RainParticipant[];
}

export interface RainParticipant {
  id: string;
  rainId: string;
  userId: string;
  rain?: Rain;
  user?: User;
}

export interface PromoCode {
  id: string;
  code: string;
  reward: number;
  levelMin: number;
  redeemptionsTotal: number;
  redeemptionsMax: number;
  updatedAt: Date;
  createdAt: Date;
  redeemers?: PromoCodeRedeemer[];
}

export interface PromoCodeRedeemer {
  id: string;
  promoCodeId: string;
  userId: string;
  promoCode?: PromoCode;
  user?: User;
}

export interface GiftCode {
  id: string;
  code: string;
  reward: number;
  redeemerId: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface Report {
  id: string;
  stats: JsonValue;
  createdAt: Date;
}

export interface SlotsUser {
  id: string;
  id_legacy: string;
  nick: string;
  amount: number;
  data: JsonValue;
  type: string;
  userId: string;
  user?: User;
  state: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserInventory {
  id: string;
  items: JsonValue;
  userId: string;
  user?: User;
}

export interface InGameModeLinks {
  id: string;
  userId: string;
  user?: User;
  links: JsonValue;
  uid: JsonValue;
}

type JsonValue = string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null;
