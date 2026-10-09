'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, buildQuery } from './api';
import type { Customer, Paginated, ServiceItem, Vehicle } from './types';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => apiFetch<Branch[]>('/branches'),
  });
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', 'options', search ?? ''],
    queryFn: () =>
      apiFetch<Paginated<Customer>>(
        `/customers${buildQuery({ search, pageSize: 100 })}`,
      ),
  });
}

export function useVehicles(customerId?: string) {
  return useQuery({
    queryKey: ['vehicles', 'options', customerId ?? ''],
    queryFn: () =>
      apiFetch<Paginated<Vehicle>>(
        `/vehicles${buildQuery({ customerId, pageSize: 100 })}`,
      ),
  });
}

export function useServices(search?: string) {
  return useQuery({
    queryKey: ['services', 'options', search ?? ''],
    queryFn: () =>
      apiFetch<Paginated<ServiceItem>>(
        `/services${buildQuery({ search, pageSize: 100 })}`,
      ),
  });
}
