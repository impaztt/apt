import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from '../shared/data/AppDataContext';
import { router } from './router';

export function App() {
  return (
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  );
}
