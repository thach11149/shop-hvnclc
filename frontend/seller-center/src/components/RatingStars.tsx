import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
}

const LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

export default function RatingStars({ value = 0, onChange, readonly = false, size = 20, showLabel = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  const display = readonly ? value : (hovered || value);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              size={size}
              className={
                star <= display
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-100'
              }
            />
          </button>
        ))}
      </div>
      {showLabel && display > 0 && (
        <span className="text-sm text-gray-600 ml-1">{LABELS[display]}</span>
      )}
    </div>
  );
}
