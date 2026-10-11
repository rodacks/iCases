/** Official body dimensions; camera and corner measurements are visual estimates,
 * not manufacturing CAD. Reference photographs are linked, never shipped as textures. */
const imageRoot = 'https://cdsassets.apple.com/live/7WUAS350/images/iphone/';
export type PhoneProfile = {
  width: number;
  height: number;
  depth: number;
  generation: number;
  pro: boolean;
  camera: 'diagonal' | 'triple' | 'vertical';
  cameraSize: number;
  lensDiameter: number;
  front: 'notch' | 'island';
  frame: 'aluminum' | 'steel' | 'titanium';
  actionButton: boolean;
  cameraControl: boolean;
  port: 'lightning' | 'usb-c';
  image: string;
  specs: string;
};
const rows: [string, number, number, number, string, string][] = [
  ['iphone-13', 71.5, 146.7, 7.65, '111872', '2022-spring-iphone13-colors.png'],
  ['iphone-13-mini', 64.2, 131.5, 7.65, '111873', '2022-iphone13-mini-colors.png'],
  ['iphone-13-pro', 71.5, 146.7, 7.65, '111871', '2022-spring-iphone13-pro-colors.png'],
  ['iphone-13-pro-max', 78.1, 160.8, 7.65, '111870', '2022-spring-iphone13-pro-max-colors.png'],
  ['iphone-14', 71.5, 146.7, 7.8, '111850', 'iphone-14-colors-spring-2023.png'],
  ['iphone-14-plus', 78.1, 160.8, 7.8, '111854', 'iphone-14-plus-colors-spring-2023.png'],
  ['iphone-14-pro', 71.5, 147.5, 7.85, '111849', 'iphone-14-pro-colors.png'],
  ['iphone-14-pro-max', 77.6, 160.7, 7.85, '111846', 'iphone-14-pro-max-colors.png'],
  ['iphone-15', 71.6, 147.6, 7.8, '111831', 'fall-2023-iphone-colors-iphone-15.png'],
  ['iphone-15-plus', 77.8, 160.9, 7.8, '111830', 'fall-2023-iphone-colors-iphone-15-plus.png'],
  ['iphone-15-pro', 70.6, 146.6, 8.25, '111829', 'fall-2023-iphone-colors-iphone-15-pro.png'],
  [
    'iphone-15-pro-max',
    76.7,
    159.9,
    8.25,
    '111828',
    'fall-2023-iphone-colors-iphone-15-pro-max.png',
  ],
  ['iphone-16', 71.6, 147.6, 7.8, '121029', 'iphone-16-colors.png'],
  ['iphone-16-plus', 77.8, 160.9, 7.8, '121030', 'iphone-16-plus-colors.png'],
  ['iphone-16-pro', 71.5, 149.6, 8.25, '121031', 'iphone-16-pro-colors.png'],
  ['iphone-16-pro-max', 77.6, 163, 8.25, '121032', 'iphone-16-pro-max-colors.png'],
];
export const phoneProfiles: Record<string, PhoneProfile> = Object.fromEntries(
  rows.map(([id, width, height, depth, spec, image]) => {
    const generation = Number(id.split('-')[1]),
      pro = id.includes('pro');
    return [
      id,
      {
        width,
        height,
        depth,
        generation,
        pro,
        camera: pro ? 'triple' : generation === 16 ? 'vertical' : 'diagonal',
        cameraSize: pro ? (generation === 13 ? 36 : 38.5) : generation === 13 ? 28 : 30,
        lensDiameter: pro ? (generation === 13 ? 13.2 : 15.2) : generation === 13 ? 11.5 : 13,
        front: generation >= 15 || (generation === 14 && pro) ? 'island' : 'notch',
        frame: pro ? (generation >= 15 ? 'titanium' : 'steel') : 'aluminum',
        actionButton: generation === 16 || (generation === 15 && pro),
        cameraControl: generation === 16,
        port: generation >= 15 ? 'usb-c' : 'lightning',
        image: imageRoot + image,
        specs: 'https://support.apple.com/en-us/' + spec,
      } satisfies PhoneProfile,
    ];
  }),
);
export function phoneProfile(id: string) {
  return phoneProfiles[id] ?? phoneProfiles['iphone-16'];
}

export function calibratedGeometry(id: string) {
  const p = phoneProfile(id),
    unit = 268 / p.width,
    vertical = p.camera === 'vertical';
  const cameraWidth = (vertical ? 16.5 : p.cameraSize) * unit;
  const cameraHeight = (vertical ? 32 : p.cameraSize) * unit;
  const lensRadius = (p.lensDiameter * unit) / 2;
  const inset = lensRadius + 4;
  const lenses = p.pro
    ? [
        [21 + inset, 21 + inset],
        [21 + inset, 21 + cameraHeight - inset],
        [21 + cameraWidth - inset, 21 + cameraHeight / 2],
      ]
    : vertical
      ? [
          [21 + cameraWidth / 2, 21 + inset],
          [21 + cameraWidth / 2, 21 + cameraHeight - inset],
        ]
      : [
          [21 + inset, 21 + inset],
          [21 + cameraWidth - inset, 21 + cameraHeight - inset],
        ];
  const flash = vertical
    ? [21 + cameraWidth + 14, 21 + cameraHeight / 2]
    : [21 + cameraWidth - inset, 21 + inset - 3];
  return {
    height: 12 + (268 * p.height) / p.width,
    cameraWidth,
    cameraHeight,
    pro: p.pro,
    vertical,
    lensRadius,
    lenses,
    flash,
    cameraRadius: vertical ? cameraWidth / 2 : 19,
    flashHole: vertical,
    unit,
  };
}
