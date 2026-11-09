'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, buildQuery } from './api';
import type { Customer, Paginated, ServiceItem, Vehicle } from './types';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
}

export interface VehicleBrand {
  id: string;
  name: string;
  _count?: { models: number };
}

export interface VehicleModel {
  id: string;
  name: string;
  brandId: string;
}

export function useVehicleBrands() {
  return useQuery({
    queryKey: ['vehicle-catalog', 'brands'],
    queryFn: () => apiFetch<VehicleBrand[]>('/vehicle-catalog/brands'),
  });
}

export function useVehicleModels(brandId?: string) {
  return useQuery({
    queryKey: ['vehicle-catalog', 'models', brandId ?? ''],
    queryFn: () =>
      apiFetch<VehicleModel[]>(`/vehicle-catalog/models${buildQuery({ brandId })}`),
    enabled: Boolean(brandId),
  });
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
