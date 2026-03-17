import React, { useState } from 'react';

interface VercelAvatarProps {
  /** Nome do lead, agente ou usuário — determina o gradiente único */
  name: string;
  /** URL de foto real (Supabase Storage, etc). Se fornecida, tem prioridade */
  src?: string | null;
  /** Tamanho em px (padrão: 36) */
  size?: number;
  /** Formato (padrão: circle) */
  shape?: 'circle' | 'rounded';
  className?: string;
}

/**
 * Avatar com gradiente único gerado pelo serviço avatar.vercel.sh.
 * Cada nome produz sempre o mesmo gradiente — útil para leads e agentes sem foto.
 * Se `src` for fornecida, exibe a foto real; ao falhar, cai para o gradiente.
 */
export const VercelAvatar: React.FC<VercelAvatarProps> = ({
  name,
  src,
  size = 36,
  shape = 'circle',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : '?';

  // URL do avatar.vercel.sh — 2× o tamanho para telas retina
  const gradientUrl = `https://avatar.vercel.sh/${encodeURIComponent(name)}?size=${size * 2}`;

  // Se tem foto real e não deu erro, usa ela; senão usa o gradiente da Vercel
  const imgSrc = src && !imgError ? src : gradientUrl;
  const isGradientFallback = !src || imgError;

  return (
    <img
      src={imgSrc}
      alt={initials}
      width={size}
      height={size}
      onError={() => {
        if (!isGradientFallback) {
          setImgError(true);
        }
      }}
      className={`flex-shrink-0 object-cover ring-1 ring-white/10 ${shapeClass} ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
