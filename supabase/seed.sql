begin;

-- Seed execution is privileged. Keep the review trigger enabled for application
-- writes, but suspend it inside this transaction so idempotent upserts do not
-- send already-approved catalog vehicles back to pending review.
alter table public.vehicles disable trigger vehicles_protect_review_fields;

insert into public.locations (district, name) values
  ('Dar es Salaam', 'Julius Nyerere International Airport'),
  ('Dar es Salaam', 'Masaki'),
  ('Dar es Salaam', 'Mlimani City'),
  ('Dar es Salaam', 'Kariakoo'),
  ('Arusha', 'Arusha Airport'),
  ('Arusha', 'Clocktower'),
  ('Arusha', 'Njiro'),
  ('Zanzibar', 'Abeid Amani Karume Airport'),
  ('Zanzibar', 'Stone Town'),
  ('Mwanza', 'Mwanza Airport'),
  ('Mwanza', 'Rock City Mall'),
  ('Dodoma', 'Dodoma Airport'),
  ('Dodoma', 'Nyerere Square')
on conflict (district, name) do nothing;

insert into public.vehicles (
  id, registration_number, company, name, model, title, description,
  year_made, fuel_type, seats, transmission, car_type, price_per_day,
  base_package, district, location, rating, approval_status, is_admin_added
) values
  (
    '10000000-0000-4000-8000-000000000001', 'T 824 AQP', 'Audi',
    'Audi Q8 Quattro', 'Q8', 'Premium comfort for Dar es Salaam',
    'A refined luxury SUV for airport transfers, business travel, and comfortable city journeys.',
    2023, 'petrol', 5, 'automatic', 'suv', 320000,
    'Executive SUV', 'Dar es Salaam', 'Masaki', 4.9, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000002', 'T 707 RST', 'Audi',
    'Audi RS7 Sportback', 'RS7', 'Performance with everyday comfort',
    'A premium sportback for special occasions, executive transfers, and memorable weekend drives.',
    2022, 'petrol', 5, 'automatic', 'sedan', 380000,
    'Performance premium', 'Dar es Salaam', 'Mlimani City', 4.9, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000003', 'T 505 BMX', 'BMW',
    'BMW X5 xDrive', 'X5', 'Confident travel beyond the city',
    'A spacious premium SUV suited to family trips, northern-circuit travel, and airport pickups.',
    2023, 'petrol', 5, 'automatic', 'suv', 285000,
    'Luxury explorer', 'Arusha', 'Clocktower', 4.8, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000004', 'T 250 MGL', 'Mercedes-Benz',
    'Mercedes-Benz GLC', 'GLC', 'Quiet luxury for every route',
    'A polished midsize SUV with a comfortable cabin for city meetings and relaxed road trips.',
    2022, 'petrol', 5, 'automatic', 'suv', 290000,
    'Executive comfort', 'Dar es Salaam', 'Julius Nyerere International Airport', 4.8, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000005', 'T 303 BMV', 'BMW',
    'BMW M3 Competition', 'M3', 'A focused premium driving experience',
    'A high-performance sedan for drivers who want sharp handling without giving up daily comfort.',
    2023, 'petrol', 5, 'automatic', 'sedan', 350000,
    'Performance sedan', 'Dodoma', 'Nyerere Square', 4.9, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000006', 'T 725 EVY', 'Tesla',
    'Tesla Model Y', 'Model Y', 'Modern electric mobility',
    'A quiet electric crossover with generous cabin space for clean and comfortable urban travel.',
    2023, 'electric', 5, 'automatic', 'suv', 260000,
    'Electric premium', 'Zanzibar', 'Stone Town', 4.7, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000007', 'T 428 TCM', 'Toyota',
    'Toyota Camry Hybrid', 'Camry', 'Efficient executive transport',
    'A dependable and economical sedan for business travel, hotel transfers, and longer city days.',
    2022, 'hybrid', 5, 'automatic', 'sedan', 190000,
    'Executive hybrid', 'Mwanza', 'Rock City Mall', 4.7, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000008', 'T 482 DCE', 'Suzuki',
    'Suzuki Alto Urban', 'Alto', 'Easy Dar es Salaam city movement',
    'A compact automatic hatchback for errands, hotel transfers, and quick trips around the city.',
    2019, 'petrol', 5, 'automatic', 'hatchback', 85000,
    'City runabout', 'Dar es Salaam', 'Kariakoo', 4.8, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000009', 'T 914 DQW', 'Volkswagen',
    'Volkswagen Golf', 'Golf', 'Comfortable everyday travel',
    'A practical automatic hatchback for airport pickups, business travel, and relaxed daily driving.',
    2021, 'petrol', 5, 'automatic', 'hatchback', 145000,
    'Everyday comfort', 'Arusha', 'Arusha Airport', 4.8, 'approved', true
  ),
  (
    '10000000-0000-4000-8000-000000000010', 'Z 118 ABH', 'Suzuki',
    'Suzuki Swift Zanzibar', 'Swift', 'Light, efficient island driving',
    'A small, easy car for Stone Town, airport transfers, beach routes, and hotel runs across Unguja.',
    2020, 'petrol', 5, 'automatic', 'hatchback', 95000,
    'Island day hire', 'Zanzibar', 'Stone Town', 4.7, 'approved', true
  )
on conflict (id) do update set
  registration_number = excluded.registration_number,
  company = excluded.company,
  name = excluded.name,
  model = excluded.model,
  title = excluded.title,
  description = excluded.description,
  year_made = excluded.year_made,
  fuel_type = excluded.fuel_type,
  seats = excluded.seats,
  transmission = excluded.transmission,
  car_type = excluded.car_type,
  price_per_day = excluded.price_per_day,
  base_package = excluded.base_package,
  district = excluded.district,
  location = excluded.location,
  rating = excluded.rating,
  approval_status = excluded.approval_status,
  rejection_reason = null,
  is_admin_added = excluded.is_admin_added,
  deleted_at = null,
  updated_at = now();

insert into public.vehicle_images (vehicle_id, public_url, position) values
  ('10000000-0000-4000-8000-000000000001', '/assets/vehicles/audi-q8.png', 0),
  ('10000000-0000-4000-8000-000000000002', '/assets/vehicles/audi-rs7.png', 0),
  ('10000000-0000-4000-8000-000000000003', '/assets/vehicles/bmw-x5-product.png', 0),
  ('10000000-0000-4000-8000-000000000004', '/assets/vehicles/mercedes-benz-glc.png', 0),
  ('10000000-0000-4000-8000-000000000005', '/assets/vehicles/bmw-m3.png', 0),
  ('10000000-0000-4000-8000-000000000006', '/assets/vehicles/tesla-model-y.png', 0),
  ('10000000-0000-4000-8000-000000000007', '/assets/vehicles/toyota-camry.png', 0),
  ('10000000-0000-4000-8000-000000000008', '/assets/vehicles/suzuki-alto.png', 0),
  ('10000000-0000-4000-8000-000000000009', '/assets/vehicles/volkswagen-golf.png', 0),
  ('10000000-0000-4000-8000-000000000010', '/assets/vehicles/suzuki-swift.png', 0)
on conflict (vehicle_id, position) do update set
  storage_path = null,
  public_url = excluded.public_url;

alter table public.vehicles enable trigger vehicles_protect_review_fields;

commit;
