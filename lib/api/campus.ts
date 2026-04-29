import { CAMPUS_ENDPOINTS } from "@beefriends/shared-kernel";
import type { CampusRecordDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "./client";
import {
  getMasterDataItems,
  type MasterDataResponse,
  type SelectOption,
} from "./types";

export async function getCampusOptions(): Promise<SelectOption[]> {
  const campuses = await requestJson<MasterDataResponse<CampusRecordDto>>(
    CAMPUS_ENDPOINTS.LIST,
  );

  return getMasterDataItems(campuses)
    .filter((campus) => campus.Stsrc === "A")
    .map((campus) => ({
      label: campus.CampusName,
      value: String(campus.CampusID),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
