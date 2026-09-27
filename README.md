# Sistemcar - Fleet Management Application

A modern, responsive web application for managing a vehicle rental fleet. Built with React 18, Vite, Tailwind CSS, and Supabase.

## Features

✅ **Vehicle Management**
- Add, edit, and delete vehicles
- Track detailed vehicle information (model, registration, VIN, mileage, etc.)
- Vehicle status tracking (Available, In Rental, Service, Sold)
- Soft delete with archiving

✅ **Flexible Pricing System**
- Global default daily tariff
- Per-vehicle custom pricing
- Tariff history tracking
- Dynamic pricing rules

✅ **Fleet Dashboard**
- Real-time vehicle statistics
- Status-based filtering
- Responsive design (mobile + desktop)
- Quick actions (edit, delete)

✅ **Real-time Synchronization**
- Supabase PostgreSQL with real-time subscriptions
- Instant updates across all devices
- No manual refresh needed

## Prerequisites

- Node.js 16+ and npm/yarn
- A Supabase project (https://supabase.com)
- GitHub account (for version control)
- Vercel account (for deployment, optional)

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sebastianmda/Sistemcar-rental.git
cd Sistemcar-rental
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key-here
```

**Where to find these values:**
1. Go to https://supabase.com and sign in
2. Open your project
3. Click "Settings" → "API"
4. Copy the **Project URL** and **public/anon key**

### 4. Set Up Database

1. In Supabase dashboard, go to "SQL Editor"
2. Create a new query and paste the entire contents of `DATABASE_SETUP.sql`
3. Click "Run" to create tables, indexes, and policies

Your database is now ready!

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── VehicleList.jsx    # Main dashboard
│   ├── VehicleForm.jsx    # Add/edit vehicle modal
│   └── PricingManager.jsx # Tariff management
├── hooks/              # Custom React hooks
│   ├── useVehicles.js     # Vehicle state management
│   └── usePricing.js      # Pricing state management
├── services/           # API/Backend services
│   ├── supabase.js        # Supabase client
│   ├── vehiclesService.js # Vehicle CRUD operations
│   └── pricingService.js  # Pricing operations
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Database Schema

### vehicles
- `id` (UUID) - Primary key
- `nume_model` (text) - Vehicle model name
- `inmatriculare` (text) - License plate
- `vin` (text) - Vehicle identification number
- `capacitate_pasageri` (integer) - Passenger capacity
- `tip_combustibil` (text) - Fuel type
- `consum` (decimal) - Fuel consumption (L/100km)
- `pret_achizitie` (decimal) - Purchase price
- `data_achizitie` (date) - Purchase date
- `km_achizitie` (integer) - Initial mileage
- `km_actuali` (integer) - Current mileage
- `status` (text) - Vehicle status
- `locatie` (text) - Current location
- `is_archived` (boolean) - Soft delete flag
- `created_at` (timestamp)
- `updated_at` (timestamp)

### pricing_rules
- `id` (UUID) - Primary key
- `vehicle_id` (UUID) - Vehicle reference
- `tarif_zilnic_custom` (decimal) - Custom daily tariff
- `data_inceput` (date) - Start date
- `data_sfarsit` (date, nullable) - End date
- `note` (text) - Notes/reason for custom tariff
- `created_at` (timestamp)

### settings
- `id` (text) - Primary key
- `tarif_zilnic_default` (decimal) - Default daily tariff
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Deployment on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit: complete fleet management app"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Click "Import"

### 3. Set Environment Variables

In the Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add these two variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public key

### 4. Deploy

Vercel will automatically build and deploy. Your app will be live at:
```
https://your-project-name.vercel.app
```

## Common Tasks

### Adding a New Vehicle

1. Click the **"+ Adaugă Vehicul"** button
2. Fill in the vehicle details
3. Click **"Adaugă Vehicul"** to save

### Setting Pricing

Click the **"⚙️ Tarife"** button:
- **Tarif Implicit**: Set the default daily rate for all vehicles
- **Tarife Personalizate**: Set custom rates per vehicle

### Filtering Vehicles

Use the filter buttons to view vehicles by status:
- All
- Disponibil (Available)
- În chirie (In Rental)
- Service
- Sold

### Editing/Deleting Vehicles

In the vehicle table/card:
- Click **"Editare"** to modify vehicle details
- Click **"Ștergere"** to soft-delete (archive)

## Troubleshooting

**Issue: "Cannot read properties of undefined (reading 'getAll')"**
- Solution: Ensure `.env.local` has correct Supabase credentials

**Issue: "Database returns empty list"**
- Solution: Run `DATABASE_SETUP.sql` in Supabase SQL Editor

**Issue: "Tariff not updating"**
- Solution: Check that the pricing_rules table has correct vehicle_id references

**Issue: "App not deploying to Vercel"**
- Solution: Verify environment variables are set in Vercel project settings

## Technologies Used

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Row-Level Security (RLS) policies
- **Deployment**: Vercel
- **Package Manager**: npm

## Performance & Security

- Real-time subscriptions for instant data sync
- Row-level security policies in database
- Soft delete pattern (no permanent data loss)
- Responsive design for all devices
- Optimized bundle with Vite

## Future Enhancements

- [ ] Employee authentication & role-based access
- [ ] Maintenance tracking (ITP, CASCO, services)
- [ ] Booking/rental history
- [ ] Financial reports & analytics
- [ ] SMS/Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check React documentation: https://react.dev

## License

This project is created for Sistemcar fleet management system.

---

**Happy fleet managing! 🚗**
