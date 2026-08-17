import { Asset } from 'expo-asset';

const modules: Record<string, number> = {
  'AN01.png': require('../assets/menu/AN01.png'),
  'AN02.png': require('../assets/menu/AN02.png'),
  'AN03.png': require('../assets/menu/AN03.png'),
  'AN04.jpg': require('../assets/menu/AN04.jpg'),
  'AN05.jpg': require('../assets/menu/AN05.jpg'),
  'AN06.png': require('../assets/menu/AN06.png'),
  'AN07.jpg': require('../assets/menu/AN07.jpg'),
  'AN08.jpg': require('../assets/menu/AN08.jpg'),
  'AN09.png': require('../assets/menu/AN09.png'),
  'AN10.jpg': require('../assets/menu/AN10.jpg'),
  'AN11.png': require('../assets/menu/AN11.png'),
  'AN12.jpg': require('../assets/menu/AN12.jpg'),
  'AN13.png': require('../assets/menu/AN13.png'),
  'AN14.png': require('../assets/menu/AN14.png'),
  'AN15.png': require('../assets/menu/AN15.png'),
  'AN16.png': require('../assets/menu/AN16.png'),
  'AN17.png': require('../assets/menu/AN17.png'),
  'AN18.jpg': require('../assets/menu/AN18.jpg'),
  'BI01.jpg': require('../assets/menu/BI01.jpg'),
  'BI02.jpg': require('../assets/menu/BI02.jpg'),
  'BI03.jpg': require('../assets/menu/BI03.jpg'),
  'BI04.jpg': require('../assets/menu/BI04.jpg'),
  'BI05.jpg': require('../assets/menu/BI05.jpg'),
  'BI06.jpg': require('../assets/menu/BI06.jpg'),
  'BI07.png': require('../assets/menu/BI07.png'),
  'BI08.png': require('../assets/menu/BI08.png'),
  'BI09.jpg': require('../assets/menu/BI09.jpg'),
  'BU01.jpg': require('../assets/menu/BU01.jpg'),
  'BU02.jpg': require('../assets/menu/BU02.jpg'),
  'BV01.jpg': require('../assets/menu/BV01.jpg'),
  'BV02.jpg': require('../assets/menu/BV02.jpg'),
  'BV03.jpg': require('../assets/menu/BV03.jpg'),
  'BV04.png': require('../assets/menu/BV04.png'),
  'BV05.jpg': require('../assets/menu/BV05.jpg'),
  'BV06.jpg': require('../assets/menu/BV06.jpg'),
  'BV07.jpg': require('../assets/menu/BV07.jpg'),
  'BV08.jpg': require('../assets/menu/BV08.jpg'),
  'BV09.jpg': require('../assets/menu/BV09.jpg'),
  'BV10.jpg': require('../assets/menu/BV10.jpg'),
  'BV11.jpg': require('../assets/menu/BV11.jpg'),
  'BV12.jpg': require('../assets/menu/BV12.jpg'),
  'BV13.jpg': require('../assets/menu/BV13.jpg'),
  'BV14.jpg': require('../assets/menu/BV14.jpg'),
  'BV15.png': require('../assets/menu/BV15.png'),
  'BV16.png': require('../assets/menu/BV16.png'),
  'BV17.jpg': require('../assets/menu/BV17.jpg'),
  'BV18.jpg': require('../assets/menu/BV18.jpg'),
  'BV19.jpg': require('../assets/menu/BV19.jpg'),
  'BV20.jpg': require('../assets/menu/BV20.jpg'),
  'KB01.png': require('../assets/menu/KB01.png'),
  'KB07.png': require('../assets/menu/KB07.png'),
  'KB09.png': require('../assets/menu/KB09.png'),
  'MC01.png': require('../assets/menu/MC01.png'),
  'MC04.png': require('../assets/menu/MC04.png'),
  'MC05.png': require('../assets/menu/MC05.png'),
  'MC06.png': require('../assets/menu/MC06.png'),
  'MC07.png': require('../assets/menu/MC07.png'),
  'MC08.jpg': require('../assets/menu/MC08.jpg'),
  'VG01.png': require('../assets/menu/VG01.png'),
  'VG04.png': require('../assets/menu/VG04.png'),
  'VG05.png': require('../assets/menu/VG05.png'),
};

const modulesLower: Record<string, string> = {};
for (const key of Object.keys(modules)) {
  modulesLower[key.toLowerCase()] = key;
}

export function getMenuImageSource(
  filename?: string | null,
): { uri: string } | undefined {
  if (!filename) {
    console.warn('[MenuImages] getMenuImageSource called with empty filename');
    return undefined;
  }

  const key = filename.trim();
  let moduleId = modules[key];

  if (moduleId === undefined) {
    const lowerKey = key.toLowerCase();
    const actualKey = modulesLower[lowerKey];
    if (actualKey) {
      console.warn(`[MenuImages] Case mismatch for "${key}" -> using "${actualKey}"`);
      moduleId = modules[actualKey];
    }
  }

  if (moduleId === undefined) {
    console.warn(`[MenuImages] "${key}" not found in modules registry`);
    return undefined;
  }

  try {
    const asset = Asset.fromModule(moduleId);
    const uri = asset.localUri || asset.uri;
    if (key.startsWith('BV')) {
      console.log(`[MenuImages] Resolved "${key}" -> ${uri}`);
    }
    return { uri };
  } catch (e) {
    console.warn(`[MenuImages] Asset.fromModule failed for "${key}":`, e);
    return undefined;
  }
}

let preloaded = false;

export async function preloadMenuImages(): Promise<void> {
  if (preloaded) return;
  try {
    const assetModules = Object.values(modules).map((id) => Asset.fromModule(id));
    await Asset.loadAsync(assetModules);
    preloaded = true;
    console.log(`[MenuImages] Preloaded ${assetModules.length} menu images`);
  } catch (e) {
    console.warn('[MenuImages] Preload failed:', e);
  }
}
