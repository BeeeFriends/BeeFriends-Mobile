import { MAJOR_ENDPOINTS } from "@beefriends/shared-kernel";
import type { MajorRecordDto } from "@beefriends/shared-kernel/types";

import { requestJson } from "./client";
import {
  getMasterDataItems,
  type MasterDataResponse,
  type SelectOption,
} from "./types";

export async function getMajorOptions(): Promise<SelectOption[]> {
  const majors = await requestJson<MasterDataResponse<MajorRecordDto>>(
    MAJOR_ENDPOINTS.LIST,
  );

  return getMasterDataItems(majors)
    .filter((major) => major.Stsrc === "A")
    .map((major) => ({
      label: major.DepartmentName,
      value: String(major.DepartmentID),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
