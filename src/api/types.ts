export type MasterDataResponse<T> =
  | T[]
  | {
  value: T[];
      Count?: number;
    };

export function getMasterDataItems<T>(response: MasterDataResponse<T>): T[] {
  return Array.isArray(response) ? response : response.value;
}

export type SelectOption = {
  label: string;
  value: string;
};
