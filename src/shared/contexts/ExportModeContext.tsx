import { createContext, useContext } from 'react';

export const ExportModeContext = createContext(false);

export function useExportMode() {
  return useContext(ExportModeContext);
}
