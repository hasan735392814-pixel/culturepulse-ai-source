import {
  Film,
  Tv,
  Music,
  BookOpen,
  Gamepad2,
  Mic,
  ShoppingBag,
  MapPin,
  Plane,
  Users,
  Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Film, Tv, Music, BookOpen, Gamepad2, Mic, ShoppingBag, MapPin, Plane, Users,
};

export function EntityTypeIcon({ type, className }: { type: string; className?: string }) {
  const match = type.match(/urn:entity:(\w+)/);
  const key = match ? match[1] : '';
  const iconKey: Record<string, string> = {
    movie: 'Film', tv_show: 'Tv', artist: 'Music', book: 'BookOpen',
    video_game: 'Gamepad2', podcast: 'Mic', brand: 'ShoppingBag',
    place: 'MapPin', destination: 'Plane', person: 'Users',
  };
  const Icon = ICON_MAP[iconKey[key] || ''] || Sparkles;
  return <Icon className={className} />;
}
