
-- Create lands table for farm/land management
CREATE TABLE public.lands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  area_m2 NUMERIC NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  commodities TEXT[] NOT NULL DEFAULT '{}',
  custom_commodity TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacant', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create productions table for tracking planting and harvesting
CREATE TABLE public.productions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  commodity TEXT NOT NULL,
  planting_date DATE NOT NULL,
  seed_count INTEGER NOT NULL,
  estimated_harvest_date DATE,
  harvest_date DATE,
  harvest_yield_kg NUMERIC,
  status TEXT NOT NULL DEFAULT 'planted' CHECK (status IN ('planted', 'growing', 'harvested')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table for tracking ongoing activities
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES public.lands(id) ON DELETE SET NULL,
  production_id UUID REFERENCES public.productions(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (allowing public access for demo purposes)
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode without auth)
CREATE POLICY "Allow public read access on lands" 
ON public.lands FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on lands" 
ON public.lands FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on lands" 
ON public.lands FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on lands" 
ON public.lands FOR DELETE USING (true);

CREATE POLICY "Allow public read access on productions" 
ON public.productions FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on productions" 
ON public.productions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on productions" 
ON public.productions FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on productions" 
ON public.productions FOR DELETE USING (true);

CREATE POLICY "Allow public read access on activities" 
ON public.activities FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on activities" 
ON public.activities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on activities" 
ON public.activities FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on activities" 
ON public.activities FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_lands_updated_at
BEFORE UPDATE ON public.lands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_productions_updated_at
BEFORE UPDATE ON public.productions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for farm photos
INSERT INTO storage.buckets (id, name, public) VALUES ('farm-photos', 'farm-photos', true);

-- Create storage policies
CREATE POLICY "Allow public read access on farm-photos" 
ON storage.objects FOR SELECT USING (bucket_id = 'farm-photos');

CREATE POLICY "Allow public insert access on farm-photos" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'farm-photos');

CREATE POLICY "Allow public update access on farm-photos" 
ON storage.objects FOR UPDATE USING (bucket_id = 'farm-photos');

CREATE POLICY "Allow public delete access on farm-photos" 
ON storage.objects FOR DELETE USING (bucket_id = 'farm-photos');
