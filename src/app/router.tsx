import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../shared/components/AppShell';
import { LoadingState } from '../shared/components/States';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ComplexListPage = lazy(() => import('../pages/ComplexListPage').then((module) => ({ default: module.ComplexListPage })));
const ComplexDetailPage = lazy(() => import('../pages/ComplexDetailPage').then((module) => ({ default: module.ComplexDetailPage })));
const ComplexDataInputPage = lazy(() => import('../pages/ComplexDataInputPage').then((module) => ({ default: module.ComplexDataInputPage })));
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
      { path: '/data/input', element: suspend(<ComplexDataInputPage />) },
      { path: '/listings/new', element: <Navigate replace to="/data/input" /> },
      { path: '/listings/bulk', element: <Navigate replace to="/data/input" /> },
      { path: '/groups', element: suspend(<GroupManagementPage />) },
      { path: '/compare', element: suspend(<ComparisonPage />) },
      { path: '*', element: suspend(<NotFoundPage />) },
    ],
  },
]);
