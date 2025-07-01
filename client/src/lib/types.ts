import { type CurationItem, type UserPreference } from "@shared/schema";

export type OutputType = 'text' | 'bounding-box' | 'svg';

export interface CurationState {
  currentItem: CurationItem | null;
  currentItemIndex: number;
  totalItems: number;
  outputType: OutputType | null;
  preference: UserPreference | null;
}
