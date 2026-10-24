import { ImageOff, MapPin } from 'lucide-react';
import type { QlooEntity } from '@/lib/types';
import {
  getEntityName,
  getEntityTypeLabel,
  getEntityImage,
  getEntityDescription,
  getEntityLocation,
  getEntityGenres,
  getEntityId,
} from '@/lib/qloo-client';
import { EntityTypeIcon } from '@/components/EntityTypeIcon';

interface EntityCardProps {
  entity: QlooEntity;
  rank?: number;
}

export function EntityCard({ entity, rank }: EntityCardProps) {
  const name = getEntityName(entity);
  const type = getEntityTypeLabel(entity);
  const image = getEntityImage(entity);
  const desc = getEntityDescription(entity);
  const loc = getEntityLocation(entity);
  const genres = getEntityGenres(entity);
  const id = getEntityId(entity);

  return (
    <div className="card card-hover p-4 animate-slide-up">
      <div className="flex gap-4">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-midnight-800 flex-shrink-0 border border-midnight-700">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {!image && (
            <div className="w-full h-full flex items-center justify-center text-midnight-500">
              <ImageOff className="w-6 h-6" />
            </div>
          )}
          {rank !== undefined && (
            <div className="absolute top-0 left-0 bg-violet-accent-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-br-lg">
              {rank}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-display font-semibold text-midnight-50 text-sm leading-tight truncate">{name}</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-violet">
              <EntityTypeIcon type={entity.subtype || entity.type || ''} className="w-3 h-3" />
              {type}
            </span>
            {genres.length > 0 && (
              <span className="badge badge-neutral">{genres.slice(0, 2).join(', ')}</span>
            )}
          </div>
          {desc && (
            <p className="text-xs text-midnight-400 line-clamp-2 mb-1">{desc}</p>
          )}
          {loc && (
            <div className="flex items-center gap-1 text-xs text-midnight-500">
              <MapPin className="w-3 h-3" />
              <span>{loc}</span>
            </div>
          )}
          {id && (
            <p className="text-[10px] text-midnight-600 mt-1 font-mono truncate">ID: {id}</p>
          )}
        </div>
      </div>
    </div>
  );
}
