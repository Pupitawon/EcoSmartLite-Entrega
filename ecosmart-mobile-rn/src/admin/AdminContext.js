import { createContext, useContext } from 'react';

// El contexto vive aparte para que AdminData y AdminHoja no se importen entre sí (era un ciclo).
export const AdminDataContext = createContext(null);

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData debe usarse dentro de <AdminDataProvider>');
  return ctx;
}