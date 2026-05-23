import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../shared/components/AppShell';
import { LoadingState } from '../shared/components/States';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ComplexListPage = lazy(() => import('../pages/ComplexListPage').then((module) => ({ default: module.ComplexListPage })));
const ComplexDetailPage = lazy(() => import('../pages/ComplexDetailPage').then((module) => ({ default: module.ComplexDetailPage })));
const ListingInputPage = lazy(() => import('../pages/ListingInputPage').then((module) => ({ default: module.ListingInputPage })));
const BulkListingInputPage = lazy(() => import('../pages/BulkListingInputPage').then((module) => ({ default: module.BulkListingInputPage })));
const GroupManagementPage = lazy(() => import('../pages/GroupManagementPage').then((module) => ({ default: module.GroupManagementPage })));
const ComparisonPage = lazy(() => import('../pages/ComparisonPage').then((module) => ({ default: module.ComparisonPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function suspend(element: ReactNode) {
  return <Suspense fallback={<LoadingState />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: suspend(<DashboardPage />) },
      { path: '/complexes', element: suspend(<ComplexListPage />) },
      { path: '/complexes/:complexId', element: suspend(<ComplexDetailPage />) },
      { path: '/listings/new', element: suspend(<ListingInputPage />) },
      { path: '/listings/bulk', element: suspend(<BulkListingInputPage />) },
      { path: '/groups', element: suspend(<GroupManagementPage />) },
      { path: '/compare', element: suspend(<ComparisonPage />) },
      { path: '*', element: suspend(<NotFoundPage />) },
    ],
  },
]);
