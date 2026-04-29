import { HOBBY_ENDPOINTS } from "@beefriends/shared-kernel";
import type { HobbyRecordDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "./client";
import {
  getMasterDataItems,
  type MasterDataResponse,
  type SelectOption,
} from "./types";

export async function getHobbyOptions(): Promise<SelectOption[]> {
  const hobbies = await requestJson<MasterDataResponse<HobbyRecordDto>>(
    HOBBY_ENDPOINTS.LIST,
  );

  return getMasterDataItems(hobbies)
    .filter((hobby) => hobby.Stsrc === "A")
    .map((hobby) => ({
      label: hobby.HobbyName,
      value: String(hobby.HobbyID),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
