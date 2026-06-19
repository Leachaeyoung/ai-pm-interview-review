import { getProfile } from '@/lib/data';
import ProfileClient from '@/components/ProfileClient';

export default function ProfilePage() {
  const profile = getProfile();
  return <ProfileClient profile={profile} />;
}
