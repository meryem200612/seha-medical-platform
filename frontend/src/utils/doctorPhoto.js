import { storageUrl } from '../api/baseUrl';

/**
 * Resolve doctor photo URL from API fields.
 */
export function getDoctorPhotoUrl(doctor) {
  if (!doctor) return null;
  if (doctor.photo_url) return doctor.photo_url;
  const profile = doctor.doctor_profile ?? doctor.doctorProfile;
  if (profile?.photo_url) return profile.photo_url;
  if (doctor.photo_path) {
    return storageUrl(doctor.photo_path);
  }
  return null;
}
