import fs from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'server-config.json');

export interface PersistentConfig {
  adminPanel: {
    cardImageOffsetNormal: number;
    cardImageOffsetAssassin: number;
    clueInputFontSize: number;
  };
}

const DEFAULT_CONFIG: PersistentConfig = {
  adminPanel: {
    cardImageOffsetNormal: -6,
    cardImageOffsetAssassin: -6,
    clueInputFontSize: 21
  }
};

export function loadConfig(): PersistentConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const config = JSON.parse(data);
      console.log('Loaded config from file:', config);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error('Error loading config file, using defaults:', error);
  }
  
  // If file doesn't exist or error occurred, create it with defaults
  saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export function saveConfig(config: PersistentConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    console.log('Config saved to file:', config);
  } catch (error) {
    console.error('Error saving config file:', error);
  }
}

export function updateAdminConfig(updates: Partial<PersistentConfig['adminPanel']>): PersistentConfig {
  const currentConfig = loadConfig();
  currentConfig.adminPanel = { ...currentConfig.adminPanel, ...updates };
  saveConfig(currentConfig);
  return currentConfig;
}