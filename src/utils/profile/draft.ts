import type { UserProfileDto } from "@beefriends/shared-kernel/types";

import { getGalleryPhotoUris, getProfilePhotoUri } from "@/utils/profile/photo";

export const MAX_HOBBY_SELECTIONS = 10;
export const MAX_GALLERY_PHOTOS = 3;

export type EditProfileDraft = {
  displayName: string;
  phoneNumber: string;
  description: string;
  age: string;
  profilePhotoUrl: string;
  photoUrls: string[];
  campusId: string;
  majorId: string;
  hobbyIds: string[];
};

export function createEditProfileDraft(profile: UserProfileDto): EditProfileDraft {
  return {
    displayName: profile.displayName || "",
    phoneNumber: profile.phoneNumber || "",
    description: profile.description || "",
    age: profile.age ? String(profile.age) : "",
    profilePhotoUrl: getProfilePhotoUri(profile),
    photoUrls: getGalleryPhotoUris(profile),
    campusId: profile.campus?.id ? String(profile.campus.id) : "",
    majorId: profile.major?.id ? String(profile.major.id) : "",
    hobbyIds: profile.hobbies?.map((hobby) => String(hobby.id)) ?? [],
  };
}
