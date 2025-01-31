export interface AutoBoardLogsEntity {
  guildId: string;
  name: string;
  channelId: string;
  webhook: {
    id: string;
    token: string;
  } | null;
  boardType: string;
  color: number | null;
  limit: number;
  offset: number;
  messageId: string;
  updatedAt: Date;
  createdAt: Date;
}
