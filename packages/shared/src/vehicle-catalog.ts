/**
 * Catálogo inicial de marcas e modelos de veículo.
 *
 * Aplicado no provisionamento de cada oficina e por
 * `pnpm db:seed:vehicle-catalog` em tenants já existentes. É um ponto de
 * partida — a oficina pode criar marcas/modelos próprios pela API.
 */

export interface VehicleCatalogEntry {
  brand: string;
  models: readonly string[];
}

export const VEHICLE_CATALOG: readonly VehicleCatalogEntry[] = [
  {
    brand: 'Fiat',
    models: [
      'Uno',
      'Palio',
      'Siena',
      'Strada',
      'Toro',
      'Argo',
      'Mobi',
      'Cronos',
      'Punto',
      'Idea',
      'Linea',
      'Bravo',
      'Fiorino',
      'Ducato',
      'Pulse',
      'Fastback',
      '500',
    ],
  },
  {
    brand: 'Volkswagen',
    models: [
      'Gol',
      'Voyage',
      'Saveiro',
      'Polo',
      'Virtus',
      'T-Cross',
      'Nivus',
      'Taos',
      'Tiguan',
      'Amarok',
      'Fox',
      'Up!',
      'Jetta',
      'Passat',
      'Kombi',
    ],
  },
  {
    brand: 'Chevrolet',
    models: [
      'Onix',
      'Onix Plus',
      'Prisma',
      'Celta',
      'Classic',
      'Corsa',
      'Montana',
      'S10',
      'Tracker',
      'Cruze',
      'Spin',
      'Cobalt',
      'Captiva',
      'Blazer',
      'Agile',
    ],
  },
  {
    brand: 'Ford',
    models: [
      'Ka',
      'Ka Sedan',
      'Fiesta',
      'Focus',
      'EcoSport',
      'Ranger',
      'F-250',
      'Fusion',
      'Edge',
      'Maverick',
      'Territory',
    ],
  },
  {
    brand: 'Toyota',
    models: [
      'Corolla',
      'Etios',
      'Yaris',
      'Hilux',
      'SW4',
      'RAV4',
      'Camry',
      'Prius',
      'Corolla Cross',
    ],
  },
  {
    brand: 'Honda',
    models: ['Civic', 'City', 'Fit', 'HR-V', 'CR-V', 'WR-V', 'Accord'],
  },
  {
    brand: 'Hyundai',
    models: [
      'HB20',
      'HB20S',
      'Creta',
      'Tucson',
      'ix35',
      'Santa Fe',
      'Elantra',
      'i30',
    ],
  },
  {
    brand: 'Renault',
    models: [
      'Kwid',
      'Sandero',
      'Logan',
      'Duster',
      'Oroch',
      'Captur',
      'Megane',
      'Fluence',
      'Master',
    ],
  },
  {
    brand: 'Nissan',
    models: ['March', 'Versa', 'Kicks', 'Frontier', 'Sentra', 'Livina'],
  },
  {
    brand: 'Peugeot',
    models: ['208', '2008', '308', '408', '3008', '5008', 'Partner', 'Hoggar'],
  },
  {
    brand: 'Citroën',
    models: ['C3', 'C4', 'C4 Cactus', 'Aircross', 'Berlingo', 'Jumpy'],
  },
  {
    brand: 'Jeep',
    models: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Cherokee'],
  },
  {
    brand: 'Mitsubishi',
    models: ['L200', 'Pajero', 'Outlander', 'ASX', 'Eclipse Cross'],
  },
  {
    brand: 'Kia',
    models: ['Picanto', 'Rio', 'Cerato', 'Sportage', 'Sorento', 'Soul'],
  },
  {
    brand: 'Chery',
    models: ['QQ', 'Tiggo 5x', 'Tiggo 7', 'Tiggo 8'],
  },
  {
    brand: 'Audi',
    models: ['A3', 'A4', 'Q3', 'Q5'],
  },
  {
    brand: 'BMW',
    models: ['Série 1', 'Série 3', 'X1', 'X3'],
  },
  {
    brand: 'Mercedes-Benz',
    models: ['Classe A', 'Classe C', 'GLA', 'GLC'],
  },
  {
    brand: 'Volvo',
    models: ['XC40', 'XC60', 'XC90'],
  },
  {
    brand: 'Land Rover',
    models: ['Discovery', 'Evoque', 'Defender'],
  },
  {
    brand: 'Suzuki',
    models: ['Jimny', 'Vitara', 'S-Cross'],
  },
  {
    brand: 'Ram',
    models: ['700', '1500'],
  },
  {
    brand: 'Troller',
    models: ['T4'],
  },
];
