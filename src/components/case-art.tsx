'use client';
import { useId, type PointerEvent, type SVGProps } from 'react';
import { geometry, type Design, type Element } from '@/lib/catalog';
export function Sticker({ kind, color }: { kind: string; color: string }) {
  const common = { fill: color };
  switch (kind) {
    case 'heart':
      return <path {...common} d="M50 88 12 51C-12 18 29-2 50 24 71-2 112 18 88 51Z" />;
    case 'star':
      return <path {...common} d="m50 0 12 36 38 14-38 13-12 37-13-37L0 50l37-14Z" />;
    case 'flower':
      return (
        <g fill={color}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="50" cy="25" rx="17" ry="24" transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="14" fill="#f5d882" />
        </g>
      );
    case 'smile':
      return (
        <g>
          <circle cx="50" cy="50" r="46" fill={color} />
          <circle cx="34" cy="37" r="5" fill="#292d28" />
          <circle cx="66" cy="37" r="5" fill="#292d28" />
          <path
            d="M25 59Q50 88 75 59"
            fill="none"
            stroke="#292d28"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      );
    case 'diamond':
      return <path {...common} d="m50 0 50 50-50 50L0 50Z" />;
    case 'sun':
      return (
        <g stroke={color} strokeWidth="7" strokeLinecap="round">
          <circle fill={color} cx="50" cy="50" r="23" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M50 3v10" transform={`rotate(${i * 45} 50 50)`} />
          ))}
        </g>
      );
    default:
      return (
        <path
          d="M50 3Q50 50 97 50 50 50 50 97 50 50 3 50 50 50 50 3Z"
          fill="none"
          stroke={color}
          strokeWidth="4"
        />
      );
  }
}
type Props = {
  design: Design;
  selected?: string;
  onElementDown?: (
    event: PointerEvent<SVGGElement>,
    element: Element,
    mode: 'move' | 'resize' | 'rotate',
  ) => void;
  printOnly?: boolean;
} & SVGProps<SVGSVGElement>;
export function CaseArt({ design, selected, onElementDown, printOnly = false, ...props }: Props) {
  const id = useId().replaceAll(':', ''),
    g = geometry(design.modelId, design.templateVersion),
    h = g.height;
  const outline = `M48 6H232Q274 6 274 48V${h - 48}Q274 ${h - 6} 232 ${h - 6}H48Q6 ${h - 6} 6 ${h - 48}V48Q6 6 48 6Z`;
  const r = g.cameraRadius,
    right = 21 + g.cameraWidth,
    bottom = 21 + g.cameraHeight;
  const camera =
    design.templateVersion === 2
      ? `M${21 + r} 21H${right - r}Q${right} 21 ${right} ${21 + r}V${bottom - r}Q${right} ${bottom} ${right - r} ${bottom}H${21 + r}Q21 ${bottom} 21 ${bottom - r}V${21 + r}Q21 21 ${21 + r} 21Z`
      : `M34 21H${g.cameraWidth + 8}Q${g.cameraWidth + 21} 21 ${g.cameraWidth + 21} 38V${g.cameraHeight + 8}Q${g.cameraWidth + 21} ${g.cameraHeight + 21} ${g.cameraWidth + 4} ${g.cameraHeight + 21}H38Q21 ${g.cameraHeight + 21} 21 ${g.cameraHeight + 4}V38Q21 21 34 21Z`;
  const flashCut = g.flashHole
    ? `M${g.flash[0] - 10} ${g.flash[1]}a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z`
    : '';
  const lenses = g.lenses;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 280 ${h}`}
      aria-label="Vista ilustrativa de tu funda"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor="#ffffff" stopOpacity=".9" />
          <stop offset=".18" stopColor={design.color} />
          <stop offset=".55" stopColor="#4a514b" stopOpacity=".32" />
          <stop offset=".8" stopColor="#ffffff" stopOpacity=".65" />
          <stop offset="1" stopColor="#27372c" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id={`${id}-lens`} cx=".36" cy=".28" r=".76">
          <stop stopColor="#405c75" />
          <stop offset=".28" stopColor="#132b36" />
          <stop offset=".6" stopColor="#080d17" />
          <stop offset="1" stopColor="#1b2530" />
        </radialGradient>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#c6d0ca" />
          <stop offset=".32" stopColor="#46514c" />
          <stop offset=".65" stopColor="#151c19" />
          <stop offset="1" stopColor="#aab4ac" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={`${outline} ${camera} ${flashCut}`} clipRule="evenodd" fillRule="evenodd" />
        </clipPath>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".65" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={design.patternColor} />
          <stop offset=".5" stopColor={design.color} />
          <stop offset="1" stopColor="#bd8bab" />
        </linearGradient>
        <pattern
          id={`${id}-pattern`}
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${design.patternX} ${design.patternY}) scale(${design.patternScale})`}
        >
          {design.pattern === 'check' && (
            <path d="M0 0h40v40H0ZM40 40h40v40H40Z" fill={design.patternColor} opacity=".65" />
          )}
          {design.pattern === 'stripes' && (
            <path
              d="M20 0v80M60 0v80"
              stroke={design.patternColor}
              strokeWidth="10"
              opacity=".55"
            />
          )}
          {design.pattern === 'dots' && (
            <g fill={design.patternColor}>
              <circle cx="20" cy="20" r="5" />
              <circle cx="60" cy="60" r="5" />
            </g>
          )}
          {design.pattern === 'flowers' && (
            <g transform="translate(15 15) scale(.5)">
              <Sticker kind="flower" color={design.patternColor} />
            </g>
          )}
          {design.pattern === 'minimal' && (
            <g fill="none" stroke={design.patternColor} opacity=".5">
              <path d="M0 70Q80 0 80 70M0 60Q80-10 80 60" />
            </g>
          )}
        </pattern>
      </defs>
      {!printOnly && (
        <path
          d={outline}
          fill={design.materialId === 'clear' ? '#edf1ec' : design.color}
          stroke={`url(#${id}-rim)`}
          strokeWidth="8"
        />
      )}
      <g clipPath={`url(#${id}-clip)`}>
        <path d={outline} fill={design.color} opacity={design.materialId === 'clear' ? 0.4 : 1} />
        {design.pattern === 'gradient' ? (
          <path d={outline} fill={`url(#${id}-gradient)`} />
        ) : design.pattern === 'abstract' ? (
          <g
            fill={design.patternColor}
            opacity=".5"
            transform={`translate(${design.patternX} ${design.patternY}) scale(${design.patternScale})`}
          >
            <path d="M-40 180Q140 0 190 240T330 490H220Q130 350 120 240T-40 270Z" />
            <path d="M120-20Q350 80 180 220L250 240Q420 70 200-20Z" />
          </g>
        ) : (
          design.pattern !== 'none' && <path d={outline} fill={`url(#${id}-pattern)`} />
        )}
        {design.elements.map((el) => (
          <g
            key={el.id}
            data-element={el.id}
            onPointerDown={onElementDown ? (e) => onElementDown(e, el, 'move') : undefined}
            transform={`translate(${el.x} ${el.y}) rotate(${el.rotation})`}
            style={onElementDown ? { cursor: 'move' } : undefined}
          >
            {el.type === 'image' ? (
              <image
                href={el.value}
                x={-el.width / 2}
                y={-el.height / 2}
                width={el.width}
                height={el.height}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : el.type === 'text' ? (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={el.font}
                fontSize={el.height * 0.72}
                fill={el.color}
                textLength={el.width}
                lengthAdjust="spacingAndGlyphs"
              >
                {el.value}
              </text>
            ) : (
              <svg
                x={-el.width / 2}
                y={-el.height / 2}
                width={el.width}
                height={el.height}
                viewBox="0 0 100 100"
              >
                <Sticker kind={el.value} color={el.color} />
              </svg>
            )}
          </g>
        ))}
        {!printOnly && (
          <path
            pointerEvents="none"
            d={outline}
            fill={`url(#${id}-shine)`}
            opacity={
              design.materialId === 'gloss' ? 0.65 : design.materialId === 'matte' ? 0.08 : 0.2
            }
          />
        )}
      </g>
      {!printOnly && (
        <g pointerEvents="none">
          <path d={outline} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="7" />
          <path d={outline} fill="none" stroke="#33472c" strokeOpacity=".18" strokeWidth="1" />
          <path d={camera} fill={design.color} stroke={`url(#${id}-rim)`} strokeWidth="6" />
          {lenses.map(([x, y], i) => (
            <g
              key={i}
              transform={`translate(${x} ${y}) scale(${g.lensRadius / 23}) translate(${-x} ${-y})`}
            >
              <circle cx={x + 1} cy={y + 2} r="24" fill="#17231c" fillOpacity=".3" />
              <circle cx={x} cy={y} r="23" fill={`url(#${id}-steel)`} />
              <circle cx={x} cy={y} r="20" fill="#0c1215" />
              <circle
                cx={x}
                cy={y}
                r="17.5"
                fill={`url(#${id}-lens)`}
                stroke="#687e88"
                strokeWidth=".8"
              />
              <circle
                cx={x}
                cy={y}
                r="11"
                fill="none"
                stroke="#385871"
                strokeWidth="1"
                strokeOpacity=".7"
              />
              <circle cx={x} cy={y} r="7" fill="#070e1b" />
              <ellipse
                cx={x - 5}
                cy={y - 7}
                rx="4.5"
                ry="2"
                fill="#b6d6e4"
                opacity=".48"
                transform={`rotate(-35 ${x - 5} ${y - 7})`}
              />
              <circle cx={x + 7} cy={y + 6} r="3" fill="#406c8b" opacity=".45" />
            </g>
          ))}
          <circle cx={g.flash[0]} cy={g.flash[1]} r="7" fill="#efeddc" />
          {g.pro && (
            <circle
              cx={g.flash[0]}
              cy={21 + g.cameraHeight - g.lensRadius - 3}
              r="8"
              fill="#151a1d"
            />
          )}
          <path
            d={`M24 ${h - 40}Q140 ${h - 28} 256 ${h - 40}`}
            stroke="#fff"
            strokeOpacity=".3"
            fill="none"
          />
        </g>
      )}
      {selected &&
        design.elements
          .filter((e) => e.id === selected)
          .map((el) => (
            <g
              key={el.id}
              data-editor-ui="true"
              transform={`translate(${el.x} ${el.y}) rotate(${el.rotation})`}
            >
              <rect
                pointerEvents="none"
                x={-el.width / 2 - 4}
                y={-el.height / 2 - 4}
                width={el.width + 8}
                height={el.height + 8}
                rx="3"
                fill="none"
                stroke="#526442"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              <path d={`M0 ${-el.height / 2 - 4}v-22`} stroke="#526442" />
              <circle
                aria-label="Rotar elemento"
                cx="0"
                cy={-el.height / 2 - 28}
                r="10"
                fill="#fff"
                stroke="#526442"
                strokeWidth="2"
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => onElementDown?.(e, el, 'rotate')}
              />
              <rect
                aria-label="Cambiar tamaño"
                x={el.width / 2 - 7}
                y={el.height / 2 - 7}
                width="18"
                height="18"
                rx="4"
                fill="#fff"
                stroke="#526442"
                strokeWidth="2"
                style={{ cursor: 'nwse-resize' }}
                onPointerDown={(e) => onElementDown?.(e, el, 'resize')}
              />
            </g>
          ))}
    </svg>
  );
}
